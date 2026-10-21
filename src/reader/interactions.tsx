import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { InlineT, ItemKeyT, ItemT } from '@schema';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { Check, Cross, Locate } from '@/components/Icons';
import tipIcon from '@/assets/icons/tip.svg';
import { questionBlankIds, type Result } from '@/lib/grading';
import { CAMBRIDGE_NOTE_ZH, isCambridge } from '@/lib/judge';
import { Block } from './ArticlePane';
import { blankContext, blankCorrect, correctBlankText, showFirstLetter, type FlatQuestion, type Responses } from './model';
import { staticContent } from '@/lib/content';

/** exam papers (KET/PET): no Chinese prompts, the number alone stands for a blank (#81 #83 #84) */
const isExamItem = (item: ItemT) => 'format' in item && item.format === 'exam';

/** instruction text with **bold** key words (exam instructions, #84 #85) */
export function Emph({ text }: { text: string }) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}</>;
}

export interface InteractionProps {
  item: ItemT;
  fq: FlatQuestion;
  flat: FlatQuestion[];
  owners: Map<string, number>;
  responses: Responses;
  setResponses: (update: (prev: Responses) => Responses) => void;
  review: { key: ItemKeyT; result: Result } | null;
  onLocate?: (blockId: string, quote?: string) => void;
  /** exam papers in exam mode (speaking: the examiner's questions are heard, not read — #88) */
  examMode?: boolean;
}

const asRecord = (v: unknown): Record<string, string> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};
const asList = (v: unknown): string[] => (Array.isArray(v) ? v : []);

function setOne(props: InteractionProps, value: Responses[string] | undefined) {
  props.setResponses((prev) => {
    const next = { ...prev };
    if (value === undefined) delete next[props.fq.q.id];
    else next[props.fq.q.id] = value;
    return next;
  });
}

/* ---------------------------------------------------------------- choice */

/** Figma `Option-text-item`: default / hover / selected / wrong / correct-expanded (with explanation). */
export function OptionList({
  options,
  selected,
  onSelect,
  correct,
  locked,
  showLetter = true,
  explain,
  ariaLabels,
}: {
  options: { id: string; content: InlineT[]; image?: string }[];
  selected?: string;
  onSelect: (id: string) => void;
  correct?: string[];
  locked: boolean;
  showLetter?: boolean;
  ariaLabels?: Record<string, string>;
  explain?: { text?: string; block?: string; quote?: string; onLocate?: (blockId: string, quote?: string) => void };
}) {
  return (
    <div className={`options ${options.length > 0 && options.every((o) => o.image) ? 'has-images' : ''}`} role="radiogroup" aria-readonly={locked || undefined}>
      {options.map((o) => {
        const isSel = selected === o.id;
        const isRight = correct?.includes(o.id);
        const state = correct ? (isRight ? 'is-correct' : isSel ? 'is-wrong' : '') : isSel ? 'is-selected' : '';
        const marked = correct ? isRight || isSel : isSel;
        const row = (
          <span className="option-row">
            <span className="option-radio-box" aria-hidden>
              <span className={`option-radio ${marked ? 'is-on' : ''}`} />
            </span>
            <span className="option-text">
              {showLetter && <span className="option-letter">{o.id}. </span>}
              {o.image ? (
                <img className="option-image" src={staticContent.assetUrl(o.image)} alt={o.content.map((n) => ('v' in n ? n.v : '')).join('') || `选项 ${o.id}`} />
              ) : (
                <Rich nodes={o.content} />
              )}
            </span>
          </span>
        );
        if (!locked) {
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={isSel}
              aria-label={ariaLabels?.[o.id]}
              className={`option ${state}`}
              onClick={() => onSelect(o.id)}
            >
              {row}
            </button>
          );
        }
        const expanded = isRight && explain && (explain.text || explain.block);
        return (
          <div key={o.id} role="radio" aria-checked={isSel} aria-label={ariaLabels?.[o.id]} className={`option ${state}`}>
            {row}
            {expanded && (
              <div className="option-explain">
                <img className="option-explain-icon" src={tipIcon} alt="" />
                <div className="option-explain-body">
                  {explain.text && <p className="option-explain-text">{explain.text}</p>}
                  {explain.block && explain.onLocate && (
                    <button className="chip" onClick={() => explain.onLocate!(explain.block!, explain.quote)}>
                      <Locate /> 定位原文
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function choiceExplain(props: InteractionProps) {
  const k = props.review?.key.answers[props.fq.q.id];
  if (!k) return undefined;
  return { text: k.explanationZh, block: k.evidence?.[0]?.block, quote: k.evidence?.[0]?.quote, onLocate: props.onLocate };
}

const TF_OPTIONS: { id: string; content: InlineT[] }[] = [
  { id: 'T', content: [{ t: 'text', v: 'T' }] },
  { id: 'F', content: [{ t: 'text', v: 'F' }] },
];

export function ChoiceView(props: InteractionProps) {
  const { fq, responses, review } = props;
  const it = fq.q.interaction;
  if (it.kind !== 'choice') return null;
  const selected = asList(responses[fq.q.id])[0];
  const k = review?.key.answers[fq.q.id];
  const correct = k && 'correct' in k ? k.correct : undefined;

  if (it.variant === 'trueFalse') {
    return (
      <>
        <QuestionPrompt number={fq.q.number}>
          <Rich nodes={it.prompt} />
        </QuestionPrompt>
        <OptionList
          options={TF_OPTIONS.filter((t) => it.options.some((o) => o.id === t.id))}
          selected={selected}
          correct={correct}
          locked={!!review}
          showLetter={false}
          ariaLabels={{ T: 'T 正确 True', F: 'F 错误 False' }}
          explain={choiceExplain(props)}
          onSelect={(id) => setOne(props, [id])}
        />
      </>
    );
  }
  return (
    <>
      <QuestionPrompt number={fq.q.number}>
        {/* exam Part 1 notices print no question: the notice itself (left pane) is the stem */}
        {it.prompt.length ? <Rich nodes={it.prompt} /> : null}
      </QuestionPrompt>
      <OptionList
        options={it.options}
        selected={selected}
        correct={correct}
        locked={!!review}
        explain={hasImageOptions(fq.q) ? undefined : choiceExplain(props)}
        onSelect={(id) => setOne(props, [id])}
      />
    </>
  );
}

/** picture options sit side by side, so their explanation goes below the options instead of inside one */
export const hasImageOptions = (q: InteractionProps['fq']['q']) =>
  q.interaction.kind === 'choice' && q.interaction.options.length > 0 && q.interaction.options.every((o) => o.image);

/* ---------------------------------------------------------- inlineChoice */

export function InlineChoiceView(props: InteractionProps) {
  const { fq, responses, review, item } = props;
  const it = fq.q.interaction;
  if (it.kind !== 'inlineChoice') return null;
  const selected = asList(responses[fq.q.id])[0];
  const k = review?.key.answers[fq.q.id];
  const correct = k && 'correct' in k ? k.correct : undefined;
  const context = it.prompt ?? blankContext(item, it.blankId);
  return (
    <>
      <QuestionPrompt number={fq.q.number}>
        {it.prompt ? (
          <Rich nodes={it.prompt} blank={(n) => <ContextBlank n={n} active={n.id === it.blankId} text={undefined} />} />
        ) : isExamItem(item) ? null : (
          <>第 {fq.q.number} 空</>
        )}
      </QuestionPrompt>
      {!it.prompt && context && (
        // exam papers: the sentence is in the left pane already; repeated only on narrow screens (tabs)
        <p className={`context-line ${isExamItem(item) ? 'exam-context' : ''}`}>
          <Rich nodes={context} blank={(n) => <ContextBlank n={n} active={n.id === it.blankId} />} />
        </p>
      )}
      <OptionList
        options={it.options}
        selected={selected}
        correct={correct}
        locked={!!review}
        explain={choiceExplain(props)}
        onSelect={(id) => setOne(props, [id])}
      />
    </>
  );
}

/** read-only blank inside a prompt / context line: [first letter][answer or number] on a single underline */
function ContextBlank({ n, active, text }: { n: BlankNode; active: boolean; text?: string }) {
  return (
    <span className={`context-blank ${active ? 'is-active' : ''} ${text ? 'is-filled' : ''}`}>
      {showFirstLetter(n.hint?.firstLetter, text) && <span className="blank-prefix">{n.hint!.firstLetter}</span>}
      <span className={text ? 'blank-fill' : 'blank-num'}>{text ?? n.number ?? '\u00a0'}</span>
      {n.hint?.baseWord && <span className="blank-base">({n.hint.baseWord})</span>}
    </span>
  );
}

/* -------------------------------------------------------------- gapMatch */

export function GapMatchView(props: InteractionProps) {
  const { fq, flat, responses, setResponses, review, item } = props;
  const it = fq.q.interaction;
  const blanks = questionBlankIds(fq.q);
  const mine = asRecord(responses[fq.q.id]);
  const firstEmpty = blanks.find((b) => !mine[b]) ?? blanks[0];
  const [active, setActive] = useState(firstEmpty);
  useEffect(() => setActive(blanks.find((b) => !asRecord(responses[fq.q.id])[b]) ?? blanks[0]), [fq.q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (it.kind !== 'gapMatch') return null;

  const bank = fq.section.bank ?? [];
  const sectionQs = flat.filter((f) => f.section.id === fq.section.id);
  // where each bank entry is currently used: entryId → {qid, blankId, number}
  const usage = new Map<string, { qid: string; blankId: string; number: number }>();
  sectionQs.forEach((f) =>
    Object.entries(asRecord(responses[f.q.id])).forEach(([blankId, entryId]) =>
      usage.set(entryId, { qid: f.q.id, blankId, number: f.q.number }),
    ),
  );

  const choose = (entryId: string) => {
    if (review || !active) return;
    setResponses((prev) => {
      const next = { ...prev };
      // an entry can be used once: remove it from wherever it was
      const was = usage.get(entryId);
      if (was) {
        const r = { ...asRecord(next[was.qid]) };
        delete r[was.blankId];
        if (Object.keys(r).length) next[was.qid] = r;
        else delete next[was.qid];
      }
      const r = { ...asRecord(next[fq.q.id]), [active]: entryId };
      next[fq.q.id] = r;
      return next;
    });
    const nextEmpty = blanks.find((b) => b !== active && !mine[b]);
    if (nextEmpty) setActive(nextEmpty);
  };

  const clear = (blankId: string) => {
    if (review) return;
    setResponses((prev) => {
      const r = { ...asRecord(prev[fq.q.id]) };
      delete r[blankId];
      const next = { ...prev };
      if (Object.keys(r).length) next[fq.q.id] = r;
      else delete next[fq.q.id];
      return next;
    });
  };

  const renderBlank = (n: BlankNode) => {
    if (!blanks.includes(n.id)) return <ContextBlank n={n} active={false} />;
    const entryId = mine[n.id];
    const entry = bank.find((b) => b.id === entryId);
    const ok = review ? blankCorrect(review.result, fq, n.id) : null;
    return (
      <button
        className={`gap-slot ${active === n.id && !review ? 'is-active' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}
        onClick={() => (active === n.id && entryId ? clear(n.id) : setActive(n.id))}
        disabled={!!review}
        aria-label={`空格 ${n.number ?? ''}${entryId ? `，已选 ${entryId}` : '，未作答'}`}
      >
        {entry ? (
          <b className="blank-fill">{entry.id}</b>
        ) : (
          (n.number ?? '　')
        )}
      </button>
    );
  };

  const context = it.prompt ?? (blanks[0] ? blankContext(item, blanks[0]) : null);
  const correctIds = (() => {
    const k = review?.key.answers[fq.q.id];
    return k && 'correct' in k ? k.correct : [];
  })();

  return (
    <>
      <QuestionPrompt number={fq.q.number}>
        {it.prompt ? <Rich nodes={it.prompt} blank={renderBlank} /> : isExamItem(item) ? null : <>第 {fq.q.number} 空</>}
      </QuestionPrompt>
      {!it.prompt && context && (
        <p className={`context-line ${isExamItem(item) ? 'exam-context' : ''}`}>
          <Rich nodes={context} blank={renderBlank} />
        </p>
      )}
      <p className="hint-line">{review ? '' : blanks.length > 1 ? '先点选空格，再点下面的选项填入；再次点击已填空格可清除。' : '点选下面的选项填入空格；再次点击空格可清除。'}</p>
      <div className={`bank ${bank.some((b) => plainText(b.content).split(' ').length > 4) ? 'bank-sentences' : ''}`}>
        {bank.map((b) => {
          const use = usage.get(b.id);
          const usedHere = use?.qid === fq.q.id;
          const isAnswer = correctIds.includes(b.id);
          return (
            <button
              key={b.id}
              className={`bank-entry ${use ? (usedHere ? 'is-here' : 'is-used') : ''} ${review && isAnswer ? 'is-correct' : ''}`}
              disabled={!!review}
              onClick={() => choose(b.id)}
            >
              <span className="bank-letter">{b.id}</span>
              <span className="bank-text">
                <Rich nodes={b.content} />
              </span>
              {use && !usedHere && <span className="bank-used">第{use.number}题</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- textEntry */

function BlankInput({
  n,
  value,
  onChange,
  ok,
  correctText,
  locked,
  autoFocus,
}: {
  n: BlankNode;
  value: string;
  onChange: (v: string) => void;
  ok: boolean | null;
  correctText?: string;
  locked: boolean;
  autoFocus?: boolean;
}) {
  return (
    <span className={`blank-input ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}>
      {n.hint?.firstLetter && <span className="blank-input-prefix">{n.hint.firstLetter}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        autoFocus={autoFocus}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="next"
        aria-label={`空格 ${n.number ?? ''}${n.hint?.firstLetter ? `，首字母 ${n.hint.firstLetter}` : ''}`}
        placeholder={n.number !== undefined ? String(n.number) : undefined}
        size={Math.max(6, value.length + 1)}
      />
      {n.hint?.baseWord && <span className="blank-input-base">({n.hint.baseWord})</span>}
      {ok === false && correctText && <span className="blank-input-answer">{correctText}</span>}
    </span>
  );
}

export function TextEntryView(props: InteractionProps) {
  const { fq, responses, review, item, flat, owners } = props;
  const it = fq.q.interaction;
  if (it.kind !== 'textEntry') return null;
  const blanks = questionBlankIds(fq.q);
  const mine = asRecord(responses[fq.q.id]);
  const update = (blankId: string, v: string) =>
    props.setResponses((prev) => {
      const r = { ...asRecord(prev[fq.q.id]), [blankId]: v };
      return { ...prev, [fq.q.id]: r };
    });

  const renderBlank = (n: BlankNode, i = 0) => {
    if (!blanks.includes(n.id)) {
      // someone else's blank (e.g. other cells in the same table)
      const other = flat[owners.get(n.id) ?? -1];
      const v = other ? asRecord(responses[other.q.id])[n.id] : '';
      return <ContextBlank n={n} active={false} text={v?.trim() ? v : undefined} />;
    }
    return (
      <BlankInput
        key={n.id}
        n={n}
        value={mine[n.id] ?? ''}
        onChange={(v) => update(n.id, v)}
        ok={review ? blankCorrect(review.result, fq, n.id) : null}
        correctText={review ? correctBlankText(fq, n.id, review.key) : undefined}
        locked={!!review}
        autoFocus={i === 0 && blanks[0] === n.id}
      />
    );
  };

  const stimulus = fq.section.stimulus;
  return (
    <>
      <QuestionPrompt number={fq.q.number}>
        {it.prompt ? <Rich nodes={it.prompt} blank={renderBlank} /> : isExamItem(item) ? null : <>第 {fq.q.number} 空</>}
      </QuestionPrompt>
      {!it.prompt && stimulus && (
        <div className="stimulus">
          {stimulus.map((b) => (
            <Block key={b.id} block={b} renderBlank={renderBlank} />
          ))}
        </div>
      )}
      {!it.prompt && !stimulus && (
        // typed blanks: the input lives in this sentence, so it always shows (only choice cloze hides it, #83)
        <div className="context-stack">
          {blanks.map((b) => {
            const ctx = blankContext(item, b);
            return (
              <p key={b} className="context-line">
                {ctx ? <Rich nodes={ctx} blank={renderBlank} /> : null}
              </p>
            );
          })}
        </div>
      )}
      {it.maxWords && !isExamItem(item) && <p className="hint-line">每空不超过 {it.maxWords} 个词</p>}
    </>
  );
}

/* ----------------------------------------------------------------- match */

/** match pair markers: tokens --pair-1..7 */
const PAIR_COLORS = [1, 2, 3, 4, 5, 6, 7].map((n) => `var(--pair-${n})`);

export function MatchView(props: InteractionProps) {
  const { fq, responses, review } = props;
  const it = fq.q.interaction;
  const [selLeft, setSelLeft] = useState<string | null>(null);
  if (it.kind !== 'match') return null;
  const pairs = asRecord(responses[fq.q.id]);
  const k = review?.key.answers[fq.q.id];
  const keyPairs = k && 'pairs' in k ? k.pairs : {};
  const colorOf = (leftId: string) => PAIR_COLORS[it.left.findIndex((l) => l.id === leftId) % PAIR_COLORS.length];
  const leftOfRight = (rightId: string) => Object.entries(pairs).find(([, r]) => r === rightId)?.[0];

  const pickRight = (rightId: string) => {
    if (review || !selLeft) return;
    const next = { ...pairs };
    const prevLeft = leftOfRight(rightId);
    if (prevLeft) delete next[prevLeft];
    next[selLeft] = rightId;
    setOne(props, next);
    const nextLeft = it.left.find((l) => !next[l.id]);
    setSelLeft(nextLeft?.id ?? null);
  };

  return (
    <>
      <QuestionPrompt number={fq.q.number}>{it.prompt ? <Rich nodes={it.prompt} /> : <>连线：先点左边，再点右边</>}</QuestionPrompt>
      <p className="hint-line">{review ? '' : `已配对 ${Object.keys(pairs).length} / ${it.left.length}；点已配对的左项可重新选择。`}</p>
      <div className="match">
        <div className="match-col">
          {it.left.map((l) => {
            const r = pairs[l.id];
            const ok = review ? r === keyPairs[l.id] : null;
            return (
              <button
                key={l.id}
                className={`match-item ${selLeft === l.id ? 'is-active' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}
                style={r ? { borderColor: colorOf(l.id) } : undefined}
                disabled={!!review}
                onClick={() => setSelLeft(selLeft === l.id ? null : l.id)}
              >
                <span className="match-id">{l.id}</span>
                <span className="match-text">
                  <Rich nodes={l.content} />
                </span>
                <span className="match-badge" style={r ? { background: colorOf(l.id) } : undefined}>
                  {r ?? ''}
                </span>
                {review && ok === false && <span className="match-answer">→ {keyPairs[l.id]}</span>}
              </button>
            );
          })}
        </div>
        <div className="match-col">
          {it.right.map((r) => {
            const left = leftOfRight(r.id);
            return (
              <button
                key={r.id}
                className={`match-item ${selLeft && !review ? 'is-target' : ''}`}
                style={left ? { borderColor: colorOf(left) } : undefined}
                disabled={!!review || !selLeft}
                onClick={() => pickRight(r.id)}
              >
                <span className="match-badge" style={left ? { background: colorOf(left) } : undefined}>
                  {left ?? ''}
                </span>
                <span className="match-id">{r.id}</span>
                <span className="match-text">
                  <Rich nodes={r.content} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- order */

/** sentence built from chunks: first letter capitalised, ending appended */
export function orderSentence(items: { id: string; content: InlineT[] }[], ids: string[], ending = ''): string {
  const text = ids
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean)
    .map((i) => plainText(i!.content))
    .join(' ');
  return text ? text[0].toUpperCase() + text.slice(1) + ending : '';
}

/** 连词成句: tap chunks to append them to the answer line; tap a placed chunk to send it back (no drag) */
export function OrderView(props: InteractionProps) {
  const { fq, responses, review } = props;
  const it = fq.q.interaction;
  if (it.kind !== 'order') return null;
  const placed = asList(responses[fq.q.id]);
  const pool = it.items.filter((i) => !placed.includes(i.id));
  const set = (ids: string[]) => setOne(props, ids.length ? ids : undefined);
  const r = review?.result.byQuestion.find((b) => b.q === fq.q.id);
  const label = (id: string) => it.items.find((i) => i.id === id);
  return (
    <>
      <QuestionPrompt number={fq.q.number}>{it.prompt ? <Rich nodes={it.prompt} /> : <>连词成句</>}</QuestionPrompt>
      {!review && <p className="hint-line">按顺序点词块组成句子；点已放入的词块可撤回。</p>}
      <div className={`order-line ${r?.correct === true ? 'is-correct' : r?.correct === false ? 'is-wrong' : ''}`} aria-label="你的句子">
        {placed.length === 0 && <span className="order-placeholder">点下方词块开始组句</span>}
        {placed.map((id, i) => {
          const item = label(id);
          if (!item) return null;
          return (
            <button key={id} className="order-chip is-placed" disabled={!!review} onClick={() => set(placed.filter((x) => x !== id))}>
              {i === 0 ? capitalise(plainText(item.content)) : <Rich nodes={item.content} />}
            </button>
          );
        })}
        {it.ending && <span className="order-ending">{it.ending}</span>}
      </div>
      {!review && (
        <div className="order-pool">
          {pool.map((item) => (
            <button key={item.id} className="order-chip" onClick={() => set([...placed, item.id])}>
              <Rich nodes={item.content} />
            </button>
          ))}
          {placed.length > 0 && (
            <button className="chip" onClick={() => set([])}>
              清空
            </button>
          )}
        </div>
      )}
    </>
  );
}

const capitalise = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/* ---------------------------------------------------------- extendedText */

export function ExtendedTextView(props: InteractionProps & { selfAssessed?: boolean; onSelfAssess: (v: boolean) => void }) {
  const { fq, responses, review } = props;
  const it = fq.q.interaction;
  const ta = useRef<HTMLTextAreaElement>(null);
  const value = typeof responses[fq.q.id] === 'string' ? (responses[fq.q.id] as string) : '';
  useEffect(() => {
    const el = ta.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  if (it.kind !== 'extendedText') return null;
  return (
    <>
      <QuestionPrompt number={fq.q.number}>
        <Rich nodes={it.prompt} />
      </QuestionPrompt>
      {/* the printed text in its genre layout, then the closing instruction (#96) */}
      {it.stimulus && (
        <div className="task-stimulus">
          {it.stimulus.map((b) => (
            <Block key={b.id} block={b} renderBlank={() => null} />
          ))}
        </div>
      )}
      {it.task && (
        <p className="task-line">
          <Rich nodes={it.task} />
        </p>
      )}
      {it.scaffold && (
        <p className="context-line">
          <Rich nodes={it.scaffold} blank={() => <span className="context-blank"><span className="blank-num">{'\u00a0'}</span></span>} />
        </p>
      )}
      <textarea
        ref={ta}
        className="long-answer"
        value={value}
        readOnly={!!review}
        placeholder="在这里写下你的答案…"
        rows={it.minWords ? 6 : 3}
        autoCapitalize="sentences"
        onChange={(e) => setOne(props, e.target.value || undefined)}
      />
      {it.minWords && <WordCount text={value} min={it.minWords} />}
      {review && <JudgeVerdict {...props} />}
      {review && rowOf(props)?.scoredBy === 'self' && (
        <div className="self-assess">
          <span>对照参考答案，你答对了吗？</span>
          <button className={`chip ${props.selfAssessed === true ? 'is-correct' : ''}`} onClick={() => props.onSelfAssess(true)}>
            <Check /> 答对了
          </button>
          <button className={`chip ${props.selfAssessed === false ? 'is-wrong' : ''}`} onClick={() => props.onSelfAssess(false)}>
            还需努力
          </button>
        </div>
      )}
    </>
  );
}

const rowOf = (props: InteractionProps) => props.review?.result.byQuestion.find((b) => b.q === props.fq.q.id);

export const countWords = (text: string) => (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;

/** writing tasks: live word count against the task's minimum (Cambridge shows a live counter too) */
function WordCount({ text, min }: { text: string; min: number }) {
  const n = countWords(text);
  return (
    <p className={`word-count ${n >= min ? 'is-enough' : ''}`} aria-live="polite">
      已写 {n} 词 · 至少 {min} 词
    </p>
  );
}

const CRITERIA_ZH: Record<string, string> = {
  content: '内容',
  organisation: '条理性',
  language: '语言',
  grammar_vocabulary: '语法与词汇',
  interactive_communication: '互动交流',
  global: '整体表现',
  communicative_achievement: '交际效果',
  discourse_management: '话语组织',
};

const MET_LABEL = { yes: '已答到', partial: '部分答到', no: '未答到' } as const;

/** LLM judge verdict (docs/09): score, key points, feedback, language fixes; provisional when sent to review */
export function JudgeVerdict(props: InteractionProps) {
  const row = rowOf(props);
  if (!row) return null;
  if (row.scoredBy === 'pending') {
    return (
      <div className="judge is-pending" role="status">
        正在批改…
      </div>
    );
  }
  const j = row.judgement;
  if (row.scoredBy !== 'judge' || !j) return null;
  const k = props.review?.key.answers[props.fq.q.id];
  const points = k && 'keyPoints' in k ? (k.keyPoints ?? []) : [];
  const full = j.score >= j.maxPoints;
  const rubric = k && 'sampleAnswer' in k ? k.rubricType : undefined;
  if (isCambridge(rubric)) {
    return (
      <section className={`judge ${full ? 'is-full' : j.score > 0 ? 'is-partial' : 'is-zero'}`} aria-label="AI 评分">
        <div className="judge-head">
          <span className="judge-score">
            {j.score}
            <span className="judge-max"> / {j.maxPoints}</span>
          </span>
          <span className="judge-tag">Cambridge 标准 · AI 评分</span>
          {j.needsReview && <span className="judge-tag is-review">待老师确认</span>}
        </div>
        <p className="judge-standard">{CAMBRIDGE_NOTE_ZH[rubric]}</p>
        <ul className="criteria">
          {points.map((p) => {
            const band = j.keyPoints.find((x) => x.id === p.id)?.band ?? 0;
            return (
              <li key={p.id} className="criteria-row">
                <span className="criteria-name">{CRITERIA_ZH[p.id] ?? p.id}</span>
                <span className="criteria-bar" aria-hidden>
                  <span style={{ width: `${(band / p.weight) * 100}%` }} />
                </span>
                <span className="criteria-band">
                  {band}/{p.weight}
                </span>
              </li>
            );
          })}
          {(rubric === 'cambridge_a2_speaking' || rubric === 'cambridge_b1_speaking') && (
            <li className="criteria-row is-muted">
              <span className="criteria-name">发音</span>
              <span className="criteria-bar" aria-hidden />
              <span className="criteria-band">未评估</span>
            </li>
          )}
        </ul>
        {j.feedbackZh && <p className="judge-feedback">{j.feedbackZh}</p>}
        {j.languageIssues.length > 0 && (
          <ul className="judge-language">
            {j.languageIssues.map((l, i) => (
              <li key={i}>
                <s>{l.text}</s> → <b>{l.fix}</b>
                {l.noteZh && <span className="judge-language-note">（{l.noteZh}）</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  return (
    <section className={`judge ${full ? 'is-full' : j.score > 0 ? 'is-partial' : 'is-zero'}`} aria-label="AI 批改">
      <div className="judge-head">
        <span className="judge-score">
          {j.score}
          <span className="judge-max"> / {j.maxPoints}</span>
        </span>
        <span className="judge-tag">AI 批改</span>
        {j.needsReview && <span className="judge-tag is-review">待老师确认</span>}
      </div>
      {points.length > 0 && (
        <ul className="judge-points">
          {points.map((p) => {
            const met = j.keyPoints.find((x) => x.id === p.id)?.met ?? 'no';
            return (
              <li key={p.id} className={`judge-point is-${met}`}>
                <span className="judge-point-mark" aria-label={MET_LABEL[met]}>
                  {met === 'yes' ? <Check /> : met === 'partial' ? '½' : <Cross />}
                </span>
                {p.descZh}
              </li>
            );
          })}
        </ul>
      )}
      {j.feedbackZh && <p className="judge-feedback">{j.feedbackZh}</p>}
      {j.languageIssues.length > 0 && (
        <ul className="judge-language">
          {j.languageIssues.map((l, i) => (
            <li key={i}>
              <s>{l.text}</s> → <b>{l.fix}</b>
              {l.noteZh && <span className="judge-language-note">（{l.noteZh}）</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- shared */

export function QuestionPrompt({ number, children }: { number: number; children: ReactNode }) {
  return (
    <h2 className="q-prompt">
      <span className="q-num">{number}.</span>
      <span>{children}</span>
    </h2>
  );
}

/* ------------------------------------------------------- choose one task */

/**
 * PET Writing Part 2: the learner answers ONE of the section's tasks (article or story). Task cards on top; the
 * chosen task opens its writing box. Only one task holds an answer, so switching after writing asks first and
 * clears the other text; only the chosen task is scored. 待补组件 — no Figma design yet.
 */
export function ChooseTaskView(props: InteractionProps & { selfAssessed?: boolean; onSelfAssess: (v: boolean) => void }) {
  const { fq, responses, review } = props;
  const tasks = fq.section.questions;
  const answered = tasks.find((q) => typeof responses[q.id] === 'string' && (responses[q.id] as string).trim() !== '');
  const [picked, setPicked] = useState<string | null>(answered?.id ?? null);
  const [confirmTo, setConfirmTo] = useState<string | null>(null);
  const counted = review?.result.byQuestion.find((b) => tasks.some((q) => q.id === b.q) && b.scoredBy !== 'none')?.q;
  const selected = review ? (counted ?? null) : picked;
  const task = tasks.find((q) => q.id === selected);

  const choose = (id: string) => {
    if (review || id === picked) return;
    if (answered && answered.id !== id) return setConfirmTo(id);
    setPicked(id);
  };
  const switchTo = (id: string) => {
    props.setResponses((prev) => {
      const next = { ...prev };
      tasks.forEach((q) => q.id !== id && delete next[q.id]);
      return next;
    });
    setPicked(id);
    setConfirmTo(null);
  };
  // card summary: the prompt plus the stimulus' title (e.g. "Articles wanted! Sport and exercise")
  const label = (q: (typeof tasks)[number]) => {
    const it = q.interaction;
    if (it.kind !== 'extendedText') return '';
    const titles = (it.stimulus ?? []).flatMap((b) => (b.type === 'note' ? [b.title, b.heading] : [])).filter(Boolean);
    return [plainText(it.prompt), ...titles.map((t) => plainText(t!))].join(' ');
  };

  return (
    <>
      <p className="hint-line">{review ? '' : `从下面 ${tasks.length} 题中选择 1 题作答，只评分你选择的那一题。`}</p>
      <div className="task-cards" role="radiogroup" aria-label="选择一题作答">
        {tasks.map((q) => {
          const isSel = q.id === selected;
          return (
            <button
              key={q.id}
              role="radio"
              aria-checked={isSel}
              className={`task-card ${isSel ? 'is-selected' : ''} ${review && !isSel ? 'is-unchosen' : ''}`}
              disabled={!!review}
              onClick={() => choose(q.id)}
            >
              <span className="task-card-head">
                Question {q.number}
                {review && !isSel && <span className="task-card-tag">未选</span>}
              </span>
              <span className="task-card-text">{label(q).slice(0, 160)}</span>
            </button>
          );
        })}
      </div>
      {confirmTo && (
        <div className="task-switch" role="alertdialog" aria-label="切换题目">
          <span>切换后，已经写的内容会被清空。确定切换吗？</span>
          <button className="chip" onClick={() => setConfirmTo(null)}>
            取消
          </button>
          <button className="chip is-on" onClick={() => switchTo(confirmTo)}>
            切换并清空
          </button>
        </div>
      )}
      {task && <ExtendedTextView key={task.id} {...props} fq={{ ...fq, q: task }} />}
    </>
  );
}
