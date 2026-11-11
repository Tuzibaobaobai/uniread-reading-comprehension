import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { InlineT, ItemKeyT, ItemT, JudgementT } from '@schema';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { questionBlankIds, type Result } from '@/lib/grading';
import { isCambridge, judgeFeedback } from '@/lib/judge';
import { Block } from './ArticlePane';
import { blankContext, blankCorrect, correctBlankText, listeningForm, showFirstLetter, type FlatQuestion, type Responses } from './model';
import { staticContent } from '@/lib/content';
import { Chip } from '@/ui/common/Chip/Chip';
import { HintText } from '@/ui/common/HintText/HintText';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { OptionGroup, OptionItem, type OptionState } from '@/ui/quiz/OptionItem/OptionItem';
import { QuestionPrompt } from '@/ui/quiz/QuestionPrompt/QuestionPrompt';
import { ContextForm, ContextLine, ContextStack } from '@/ui/quiz/ContextLine/ContextLine';
import { BlankSlot } from '@/ui/quiz/BlankSlot/BlankSlot';
import { BlankInput } from '@/ui/quiz/BlankInput/BlankInput';
import { WordBank, WordBankEntry } from '@/ui/quiz/WordBank/WordBank';
import { MatchColumns, MatchItem } from '@/ui/quiz/MatchItem/MatchItem';
import { OrderLine, OrderPool } from '@/ui/quiz/OrderLine/OrderLine';
import { OrderChunk } from '@/ui/OrderChunk/OrderChunk';
import { LongAnswer } from '@/ui/quiz/LongAnswer/LongAnswer';
import { JudgePending, JudgeResult } from '@/ui/quiz/JudgeResult/JudgeResult';
import { SelfAssess } from '@/ui/quiz/SelfAssess/SelfAssess';
import { ChoiceCard, ChoiceCardGroup } from '@/ui/ChoiceCard/ChoiceCard';
import { Stimulus, WritingTask, type WritingKind } from '@/ui/exam/WritingTask/WritingTask';

// moved to src/ui (docs/14 §15); re-exported so PartViews / Speaking / VocabQuiz keep importing them from here
export { BlankInput, QuestionPrompt };

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
  imageList,
}: {
  /** Ready frame 1.17: 时文 picture options are a list (one per row, the picture under the letter), not tiles */
  imageList?: boolean;
  options: { id: string; content: InlineT[]; image?: string }[];
  selected?: string;
  onSelect: (id: string) => void;
  correct?: string[];
  locked: boolean;
  showLetter?: boolean;
  ariaLabels?: Record<string, string>;
  explain?: { text?: string; block?: string; quote?: string; onLocate?: (blockId: string, quote?: string) => void };
}) {
  const { t } = useTranslation();
  return (
    <OptionGroup images={options.length > 0 && options.every((o) => o.image)} imageList={imageList} locked={locked}>
      {options.map((o) => {
        const isSel = selected === o.id;
        const isRight = !!correct?.includes(o.id);
        const state: OptionState = correct ? (isRight ? 'correct' : isSel ? 'wrong' : 'default') : isSel ? 'selected' : 'default';
        const expanded = locked && isRight && explain && (explain.text || explain.block);
        return (
          <OptionItem
            key={o.id}
            state={state}
            selected={isSel}
            checked={isSel} /* 1.05: the right answer the learner missed keeps an empty radio (option-text-item 正确 × checked=no) */
            locked={locked}
            letter={showLetter ? o.id : undefined}
            image={
              o.image
                ? { src: staticContent.assetUrl(o.image), alt: o.content.map((n) => ('v' in n ? n.v : '')).join('') || t('interaction.optionAlt', { id: o.id }) }
                : undefined
            }
            ariaLabel={ariaLabels?.[o.id]}
            onSelect={() => onSelect(o.id)}
            explain={
              expanded
                ? {
                    text: explain.text,
                    locateLabel: t('reader.locate'),
                    onLocate: explain.block && explain.onLocate ? () => explain.onLocate!(explain.block!, explain.quote) : undefined,
                  }
                : undefined
            }
          >
            <Rich nodes={o.content} />
          </OptionItem>
        );
      })}
    </OptionGroup>
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
  const { t } = useTranslation();
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
          ariaLabels={{ T: t('interaction.tfTrue'), F: t('interaction.tfFalse') }}
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
        imageList={!isExamItem(props.item)}
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
        ) : null /* 1.08: only the number when nothing is printed */}
      </QuestionPrompt>
      {!it.prompt && context && (
        // exam papers: the sentence is in the left pane already; repeated only on narrow screens (tabs)
        <ContextLine mode={isExamItem(item) ? 'exam' : 'default'}>
          <Rich nodes={context} blank={(n) => <ContextBlank n={n} active={n.id === it.blankId} />} />
        </ContextLine>
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
    <BlankSlot
      state={active ? 'current' : text ? 'filled' : 'empty'}
      label={n.number ?? '\u00a0'}
      text={text || undefined}
      prefix={showFirstLetter(n.hint?.firstLetter, text) ? n.hint!.firstLetter : undefined}
      base={n.hint?.baseWord}
    />
  );
}

/* -------------------------------------------------------------- gapMatch */

export function GapMatchView(props: InteractionProps) {
  const { t } = useTranslation();
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
      <BlankSlot
        mode="button"
        state={active === n.id && !review ? 'current' : entry ? 'filled' : 'empty'}
        result={ok === true ? 'correct' : ok === false ? 'wrong' : 'none'}
        label={n.number ?? '　'}
        text={entry?.id}
        onClick={() => (active === n.id && entryId ? clear(n.id) : setActive(n.id))}
        disabled={!!review}
        ariaLabel={`${t('interaction.slot', { n: n.number ?? '' })}${entryId ? t('interaction.slotChosen', { id: entryId }) : t('interaction.slotEmpty')}`}
      />
    );
  };

  const context = it.prompt ?? (blanks[0] ? blankContext(item, blanks[0]) : null);
  const correctIds = (() => {
    const k = review?.key.answers[fq.q.id];
    return k && 'correct' in k ? k.correct : [];
  })();

  return (
    <>
      {/* 1.09: the hint sits right under the title, above the sentence */}
      <QuestionPrompt number={fq.q.number} hint={review ? undefined : blanks.length > 1 ? t('interaction.gapHintMulti') : t('interaction.gapHintSingle')}>
        {it.prompt ? <Rich nodes={it.prompt} blank={renderBlank} /> : isExamItem(item) ? null : <>{t('interaction.blankN', { n: fq.q.number })}</> /* 1.09 keeps 第 N 空 */}
      </QuestionPrompt>
      {!it.prompt && context && (
        <ContextLine mode={isExamItem(item) ? 'exam' : 'default'}>
          <Rich nodes={context} blank={renderBlank} />
        </ContextLine>
      )}
      <WordBank layout={bank.some((b) => plainText(b.content).split(' ').length > 4) ? 'sentence' : 'word'}>
        {bank.map((b) => {
          const use = usage.get(b.id);
          return (
            <WordBankEntry
              key={b.id}
              letter={b.id}
              used={use ? (use.qid === fq.q.id ? 'here' : 'elsewhere') : 'no'}
              usedLabel={use ? t('interaction.bankUsed', { n: use.number }) : undefined}
              correct={!!review && correctIds.includes(b.id)}
              locked={!!review}
              onClick={() => choose(b.id)}
            >
              <Rich nodes={b.content} />
            </WordBankEntry>
          );
        })}
      </WordBank>
    </>
  );
}

/* ------------------------------------------------------------- textEntry */

export function TextEntryView(props: InteractionProps) {
  const { t } = useTranslation();
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
  const notesForm = listeningForm(item, fq.section, blanks[0]);
  return (
    <>
      {it.prompt && stimulus && (
        // the section's word box ("given items from the box") above each sentence (#126)
        <Stimulus className="is-box">
          {stimulus.map((b) => (
            <Block key={b.id} block={b} renderBlank={renderBlank} />
          ))}
        </Stimulus>
      )}
      <QuestionPrompt number={fq.q.number}>
        {it.prompt ? <Rich nodes={it.prompt} blank={renderBlank} /> : isExamItem(item) ? null : <>{t('interaction.blankN', { n: fq.q.number })}</> /* 1.12 keeps 第 N 空 */}
      </QuestionPrompt>
      {!it.prompt && stimulus && (
        <Stimulus>
          {stimulus.map((b) => (
            <Block key={b.id} block={b} renderBlank={renderBlank} />
          ))}
        </Stimulus>
      )}
      {!it.prompt && !stimulus && notesForm && (
        // Ready frame 2.08: a listening Part's notes form (table / note with the gaps) sits under the number in the
        // question pane — the left pane keeps only the recordings
        <ContextForm table={notesForm.type === 'table'}>
          <Block block={notesForm} renderBlank={renderBlank} />
        </ContextForm>
      )}
      {!it.prompt && !stimulus && !notesForm && (
        // typed blanks: the input lives in this sentence, so it always shows (only choice cloze hides it, #83)
        <ContextStack>
          {/* blanks that share one sentence show it once, with all their inputs in place */}
          {blanks
            .map((b) => ({ b, ctx: blankContext(item, b) }))
            .filter(({ b }, i, all) => !all.slice(0, i).some((x) => x.ctx?.some((n) => n.t === 'blank' && n.id === b)))
            .map(({ b, ctx }) => (
              <ContextLine key={b}>{ctx ? <Rich nodes={ctx} blank={renderBlank} /> : null}</ContextLine>
            ))}
        </ContextStack>
      )}
      {it.maxWords && !isExamItem(item) && <HintText>{t('interaction.maxWords', { count: it.maxWords })}</HintText>}
    </>
  );
}

/* ----------------------------------------------------------------- match */

/** match pair markers: tokens color/pair/1–7 */
const PAIR_COLORS = [
  'var(--ur-color-pair-1)',
  'var(--ur-color-pair-2)',
  'var(--ur-color-pair-3)',
  'var(--ur-color-pair-4)',
  'var(--ur-color-pair-5)',
  'var(--ur-color-pair-6)',
  'var(--ur-color-pair-7)',
];

export function MatchView(props: InteractionProps) {
  const { t } = useTranslation();
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
      <QuestionPrompt number={fq.q.number} hint={review ? '' : t('interaction.matchProgress', { done: Object.keys(pairs).length, total: it.left.length })}>
        {it.prompt ? <Rich nodes={it.prompt} /> : null /* 1.10: only the number */}
      </QuestionPrompt>
      <MatchColumns
        left={it.left.map((l) => {
          const r = pairs[l.id];
          const ok = review ? r === keyPairs[l.id] : null;
          return (
            <MatchItem
              key={l.id}
              side="prompt"
              id={l.id}
              active={selLeft === l.id}
              pair={r ? { label: r, color: colorOf(l.id) } : undefined}
              result={ok === true ? 'correct' : ok === false ? 'wrong' : 'none'}
              answer={review && ok === false ? (keyPairs[l.id] ?? '') : undefined}
              disabled={!!review}
              onClick={() => setSelLeft(selLeft === l.id ? null : l.id)}
            >
              <Rich nodes={l.content} />
            </MatchItem>
          );
        })}
        right={it.right.map((r) => {
          const left = leftOfRight(r.id);
          return (
            <MatchItem
              key={r.id}
              side="option"
              id={r.id}
              target={!!selLeft && !review}
              pair={left ? { label: left, color: colorOf(left) } : undefined}
              disabled={!!review || !selLeft}
              onClick={() => pickRight(r.id)}
            >
              <Rich nodes={r.content} />
            </MatchItem>
          );
        })}
      />
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
  const { t } = useTranslation();
  const { fq, responses, review } = props;
  const it = fq.q.interaction;
  if (it.kind !== 'order') return null;
  const placed = asList(responses[fq.q.id]);
  const pool = it.items.filter((i) => !placed.includes(i.id));
  const set = (ids: string[]) => setOne(props, ids.length ? ids : undefined);
  const r = review?.result.byQuestion.find((b) => b.q === fq.q.id);
  const label = (id: string) => it.items.find((i) => i.id === id);
  const result = r?.correct === true ? 'correct' : r?.correct === false ? 'wrong' : 'none';
  return (
    <>
      <QuestionPrompt number={fq.q.number} hint={review ? undefined : t('interaction.orderHint')}>
        {it.prompt ? <Rich nodes={it.prompt} /> : <>{t('interaction.orderPrompt')}</>}
      </QuestionPrompt>
      <OrderLine
        result={result}
        label={t('interaction.orderLine')}
        placeholder={placed.length === 0 ? t('interaction.orderPlaceholder') : undefined}
        ending={it.ending}
      >
        {placed.map((id, i) => {
          const item = label(id);
          if (!item) return null;
          return (
            <OrderChunk key={id} placed result={result} disabled={!!review} onClick={() => set(placed.filter((x) => x !== id))}>
              {i === 0 ? capitalise(plainText(item.content)) : <Rich nodes={item.content} />}
            </OrderChunk>
          );
        })}
      </OrderLine>
      {!review && (
        <OrderPool>
          {pool.map((item) => (
            <OrderChunk key={item.id} onClick={() => set([...placed, item.id])}>
              <Rich nodes={item.content} />
            </OrderChunk>
          ))}
          {placed.length > 0 && <Chip onClick={() => set([])}>{t('interaction.clear')}</Chip>}
        </OrderPool>
      )}
    </>
  );
}

const capitalise = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/**
 * The printed task under a writing title, line by line (Ready frame 2.18): a lead-in ending in ":" is bold, "• …" lines
 * are the points (16 apart), the word-count line ("Write 25 words or more.") is bold, other lines are plain paragraphs.
 */
function TaskLines({ nodes }: { nodes: InlineT[] }) {
  const lines: InlineT[][] = [[]];
  for (const n of nodes) {
    if (n.t === 'br') lines.push([]);
    else lines[lines.length - 1].push(n);
  }
  const text = (l: InlineT[]) => plainText(l).trim();
  const out: ReactNode[] = [];
  let points: InlineT[][] = [];
  const flush = () => {
    if (!points.length) return;
    out.push(
      <ul key={`u${out.length}`} className="task-points">
        {points.map((l, i) => (
          <li key={i}>
            <Rich nodes={stripBullet(l)} />
          </li>
        ))}
      </ul>,
    );
    points = [];
  };
  for (const l of lines) {
    const s = text(l);
    const kind = taskLineKind(s);
    if (kind === 'point') {
      points.push(l);
      continue;
    }
    flush();
    if (kind === 'empty') continue;
    const cls = kind === 'lead' ? 'task-lead' : kind === 'count' ? 'task-count' : undefined;
    out.push(
      <p key={`p${out.length}`} className={cls}>
        <Rich nodes={l} />
      </p>,
    );
  }
  flush();
  return <>{out}</>;
}

/** what a printed task line is: a bold lead-in ("In your email:"), a point ("• …"), the word count, or plain text */
function taskLineKind(s: string): 'empty' | 'lead' | 'point' | 'count' | 'plain' {
  if (!s) return 'empty';
  if (/^[•·]/.test(s)) return 'point';
  if (s.endsWith(':')) return 'lead';
  return /^Write\b.*\bwords\b/i.test(s) ? 'count' : 'plain';
}

/** a point line without its printed bullet (the list draws it) */
function stripBullet(l: InlineT[]): InlineT[] {
  const [first, ...rest] = l;
  return first && first.t === 'text' ? [{ ...first, v: first.v.replace(/^\s*[•·]\s*/, '') }, ...rest] : l;
}

/* ---------------------------------------------------------- extendedText */

export function ExtendedTextView(props: InteractionProps & { selfAssessed?: boolean; onSelfAssess: (v: boolean) => void; kind?: WritingKind }) {
  const { t } = useTranslation();
  const { fq, responses, review } = props;
  const it = fq.q.interaction;
  const value = typeof responses[fq.q.id] === 'string' ? (responses[fq.q.id] as string) : '';
  if (it.kind !== 'extendedText') return null;
  // Ready frames 2.18 / 2.19 / 2.23: only the task's first paragraph is the bold title; the rest of the printed task
  // ("In your email:", the bullets, "Write 25 words or more.") is body text under it
  const split = isExamItem(props.item) ? it.prompt.findIndex((n, i, a) => n.t === 'br' && a[i + 1]?.t === 'br') : -1;
  // the title is one running paragraph (its printed line breaks read as spaces)
  const head = (split > 0 ? it.prompt.slice(0, split) : it.prompt).map((n): InlineT => (n.t === 'br' && isExamItem(props.item) ? { t: 'text', v: ' ' } : n));
  let tail = split > 0 ? it.prompt.slice(split + 2) : [];
  // Ready frame 2.23: the "Write …" instruction right after the title joins it ("… the notes you have made. Write your
  // email to Mrs Hallam using all the notes."); anything else (the PET story's opening sentence) stays in the body
  if (isExamItem(props.item)) {
    while (tail.length) {
      const i = tail.findIndex((n) => n.t === 'br');
      const line = i < 0 ? tail : tail.slice(0, i);
      const text = plainText(line).trim();
      if (taskLineKind(text) !== 'plain' || !/^Write\b/.test(text)) break;
      head.push({ t: 'text', v: ' ' }, ...line);
      tail = i < 0 ? [] : tail.slice(i + 1);
    }
  }
  return (
    <>
      <QuestionPrompt number={fq.q.number}>
        <Rich nodes={head} />
      </QuestionPrompt>
      {tail.length > 0 && (
        <div className="task-body">
          <TaskLines nodes={tail} />
        </div>
      )}
      {/* the printed text in its genre layout, then the closing instruction (#96): rc/Exam/WritingTask */}
      <WritingTask
        kind={props.kind ?? (it.stimulus ? 'email' : 'story')}
        stimulus={it.stimulus && it.stimulus.map((b) => <Block key={b.id} block={b} renderBlank={() => null} />)}
        task={it.task && <Rich nodes={it.task} />}
      />
      {it.scaffold && (
        <ContextLine>
          <Rich nodes={it.scaffold} blank={() => <BlankSlot label={'\u00a0'} />} />
        </ContextLine>
      )}
      <LongAnswer
        value={value}
        locked={!!review}
        placeholder={t('interaction.answerPlaceholder')}
        rows="short" /* Ready frames 2.18 / 2.23: a 120-high box that grows with the text */
        counter={it.minWords ? { text: t('interaction.wordCount', { count: countWords(value), min: it.minWords }), enough: countWords(value) >= it.minWords } : undefined}
        onChange={(v) => setOne(props, v || undefined)}
      />
      {review && <JudgeVerdict {...props} />}
      {review && rowOf(props)?.scoredBy === 'self' && !isCambridge(rubricOf(props)) && (
        <SelfAssess
          answer={props.selfAssessed}
          question={t('interaction.selfAssessQuestion')}
          yesLabel={t('interaction.selfRight')}
          noLabel={t('interaction.selfWrong')}
          onAnswer={props.onSelfAssess}
        />
      )}
    </>
  );
}

const rowOf = (props: InteractionProps) => props.review?.result.byQuestion.find((b) => b.q === props.fq.q.id);
const rubricOf = (props: InteractionProps) => {
  const k = props.review?.key.answers[props.fq.q.id];
  return k && 'sampleAnswer' in k ? k.rubricType : undefined;
};

/** writing tasks: live word count against the task's minimum (Cambridge shows a live counter too) */
export const countWords = (text: string) => (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;

/** LLM judge verdict (docs/09): score, key points, feedback, language fixes; provisional when sent to review */
export function JudgeVerdict(props: InteractionProps) {
  const { t } = useTranslation();
  const row = rowOf(props);
  if (!row) return null;
  if (row.scoredBy === 'pending') return <JudgePending>{t('judge.marking')}</JudgePending>;
  const k = props.review?.key.answers[props.fq.q.id];
  const rubric = k && 'sampleAnswer' in k ? k.rubricType : undefined;
  // the judge was down: say so (not a 0); Cambridge writing / speaking can't be self-marked, reading answers can
  if (row.scoredBy === 'self') return <JudgePending notice>{t(isCambridge(rubric) ? 'judge.unavailable' : 'judge.unavailableSelf')}</JudgePending>;
  const j = row.judgement;
  if (row.scoredBy !== 'judge' || !j) return null;
  const points = k && 'keyPoints' in k ? (k.keyPoints ?? []) : [];
  if (isCambridge(rubric)) {
    return (
      <JudgeResult
        label={t('judge.scoreLabel')}
        score={j.score}
        max={j.maxPoints}
        tag={t('judge.cambridgeTag')}
        standard={t(`judge.note.${rubric}`)}
        criteria={points.map((p) => ({
          id: p.id,
          name: t(`judge.criteria.${p.id}`, { defaultValue: p.id }),
          band: j.keyPoints.find((x) => x.id === p.id)?.band ?? 0,
          weight: p.weight,
        }))}
        extraCriterion={
          rubric === 'cambridge_a2_speaking' || rubric === 'cambridge_b1_speaking' ? { name: t('judge.pronunciation'), note: t('judge.notAssessed') } : undefined
        }
        feedback={judgeFeedback(j, t)}
        issues={languageIssues(j, t)}
      />
    );
  }
  return <JudgeMarks j={j} points={points} />;
}

const languageIssues = (j: JudgementT, t: (k: string, o?: Record<string, unknown>) => string) =>
  j.languageIssues.map((l) => ({ text: l.text, fix: l.fix, note: l.noteZh ? t('judge.issueNote', { note: l.noteZh }) : undefined }));

/** an LLM judgement on its key points (reading answers, 中译英 #110) */
export function JudgeMarks({ j, points }: { j: JudgementT; points: { id: string; descZh: string }[] }) {
  const { t } = useTranslation();
  return (
    <JudgeResult
      label={t('judge.markLabel')}
      score={j.score}
      max={j.maxPoints}
      tag={t('judge.markLabel')}
      points={points.map((p) => {
        const met = j.keyPoints.find((x) => x.id === p.id)?.met ?? 'no';
        return { id: p.id, desc: p.descZh, met, metLabel: t(`judge.met.${met}`) };
      })}
      feedback={judgeFeedback(j, t)}
      issues={languageIssues(j, t)}
    />
  );
}

/* ------------------------------------------------------- choose one task */

/**
 * PET Writing Part 2: the learner answers ONE of the section's tasks (article or story). Task cards on top; the
 * chosen task opens its writing box. Only one task holds an answer, so switching after writing asks first and
 * clears the other text; only the chosen task is scored. rc/Exam/WritingTask Kind=choose-one: ui/ChoiceCard cards, rc/Common/InlineNotice confirm.
 */
export function ChooseTaskView(props: InteractionProps & { selfAssessed?: boolean; onSelfAssess: (v: boolean) => void }) {
  const { t } = useTranslation();
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
      <HintText>{review ? '' : t('interaction.chooseHint', { count: tasks.length })}</HintText>
      <ChoiceCardGroup layout="columns" className="task-cards" role="radiogroup" aria-label={t('interaction.chooseLabel')}>
        {tasks.map((q) => {
          const isSel = q.id === selected;
          return (
            <ChoiceCard
              key={q.id}
              role="radio"
              aria-checked={isSel}
              className="task-card is-filled" /* Ready frame 2.24: the filled card of 2.02 (grey-1, no border, radius m) */
              titleClassName="task-card-head"
              textClassName="task-card-text"
              title={t('interaction.taskCard', { n: q.number })}
              tag={review && !isSel ? t('interaction.unchosen') : undefined}
              selected={isSel}
              dim={!!review && !isSel}
              disabled={!!review}
              onClick={() => choose(q.id)}
            >
              {label(q).slice(0, 160)}
            </ChoiceCard>
          );
        })}
      </ChoiceCardGroup>
      {confirmTo && (
        <InlineNotice
          tone="warning"
          className="task-switch"
          role="alertdialog"
          aria-label={t('interaction.switchLabel')}
          actions={
            <>
              <Chip onClick={() => setConfirmTo(null)}>{t('common.cancel')}</Chip>
              <Chip tone="on" onClick={() => switchTo(confirmTo)}>
                {t('interaction.switchAndClear')}
              </Chip>
            </>
          }
        >
          {t('interaction.switchConfirm')}
        </InlineNotice>
      )}
      {task && <ExtendedTextView key={task.id} {...props} kind="choose-one" fq={{ ...fq, q: task }} />}
    </>
  );
}
