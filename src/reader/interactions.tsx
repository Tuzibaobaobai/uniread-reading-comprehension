import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { InlineT, ItemKeyT, ItemT } from '@schema';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { Check, Locate } from '@/components/Icons';
import tipIcon from '@/assets/icons/tip.svg';
import { questionBlankIds, type Result } from '@/lib/grading';
import { Block } from './ArticlePane';
import { blankContext, blankCorrect, correctBlankText, showFirstLetter, type FlatQuestion, type Responses } from './model';

export interface InteractionProps {
  item: ItemT;
  fq: FlatQuestion;
  flat: FlatQuestion[];
  owners: Map<string, number>;
  responses: Responses;
  setResponses: (update: (prev: Responses) => Responses) => void;
  review: { key: ItemKeyT; result: Result } | null;
  onLocate?: (blockId: string, quote?: string) => void;
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
function OptionList({
  options,
  selected,
  onSelect,
  correct,
  locked,
  showLetter = true,
  explain,
  ariaLabels,
}: {
  options: { id: string; content: InlineT[] }[];
  selected?: string;
  onSelect: (id: string) => void;
  correct?: string[];
  locked: boolean;
  showLetter?: boolean;
  ariaLabels?: Record<string, string>;
  explain?: { text?: string; block?: string; quote?: string; onLocate?: (blockId: string, quote?: string) => void };
}) {
  return (
    <div className="options" role="radiogroup" aria-readonly={locked || undefined}>
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
              <Rich nodes={o.content} />
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

function choiceExplain(props: InteractionProps) {
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
        <Rich nodes={it.prompt} />
      </QuestionPrompt>
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
        ) : (
          <>第 {fq.q.number} 空</>
        )}
      </QuestionPrompt>
      {!it.prompt && context && (
        <p className="context-line">
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
          <>
            <b>{entry.id}</b> {plainText(entry.content).split(' ').length <= 4 ? plainText(entry.content) : ''}
          </>
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
      <QuestionPrompt number={fq.q.number}>{it.prompt ? <Rich nodes={it.prompt} blank={renderBlank} /> : <>第 {fq.q.number} 空</>}</QuestionPrompt>
      {!it.prompt && context && (
        <p className="context-line">
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
        {it.prompt ? <Rich nodes={it.prompt} blank={renderBlank} /> : <>第 {fq.q.number} 空</>}
      </QuestionPrompt>
      {!it.prompt && stimulus && (
        <div className="stimulus">
          {stimulus.map((b) => (
            <Block key={b.id} block={b} renderBlank={renderBlank} />
          ))}
        </div>
      )}
      {!it.prompt && !stimulus && (
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
      {it.maxWords && <p className="hint-line">每空不超过 {it.maxWords} 个词</p>}
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
        rows={3}
        autoCapitalize="sentences"
        onChange={(e) => setOne(props, e.target.value || undefined)}
      />
      {review && it.scoring === 'self' && (
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

/* ----------------------------------------------------------------- shared */

export function QuestionPrompt({ number, children }: { number: number; children: ReactNode }) {
  return (
    <h2 className="q-prompt">
      <span className="q-num">{number}.</span>
      <span>{children}</span>
    </h2>
  );
}
