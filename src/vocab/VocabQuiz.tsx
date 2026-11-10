import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AnswerKeyT, BlockT, InlineT, ItemKeyT, QuestionT, VocabDayItemT } from '@schema';
import { Rich, type BlankNode } from '@/components/Rich';
import { isAnswered, type Result } from '@/lib/grading';
import { BlankInput } from '@/reader/interactions';
import { Block } from '@/reader/ArticlePane';
import { SectionHeader } from '@/ui/quiz/SectionHeader/SectionHeader';
import { Breadcrumb } from '@/ui/common/Breadcrumb/Breadcrumb';
import { JudgeResult } from '@/ui/quiz/JudgeResult/JudgeResult';
import bookmarkIcon from '@/assets/icons/answer-bookmark.svg';
import { LineInput, type LineResult } from '@/ui/quiz/LineInput/LineInput';
import { PosChips } from '@/ui/quiz/PosChips/PosChips';
import { TableFill } from '@/ui/quiz/TableFill/TableFill';
import { AnswerExplain, AnswerFeedback, type FeedbackResult } from '@/ui/quiz/AnswerFeedback/AnswerFeedback';
import { PartNav, type PartNavPart, type PartQuestionState } from '@/ui/vocab/PartNav/PartNav';
import { WordProfileRow as WordProfileLayout } from '@/ui/vocab/WordProfileRow/WordProfileRow';
import { WordFamilyRow as WordFamilyLayout } from '@/ui/vocab/WordFamilyRow/WordFamilyRow';
import { TranslateRow } from '@/ui/vocab/TranslateRow/TranslateRow';
import { PhraseBank } from '@/ui/vocab/PhraseBank/PhraseBank';
import { centreOnFocus } from './useVisualViewport';

type Rec = Record<string, string>;
export type VocabResponses = Record<string, Rec | string>;

export interface QuizState {
  item: VocabDayItemT;
  responses: VocabResponses;
  setResponse: (qid: string, value: Rec | string) => void;
  /** answer parts solved with a hint (none since #115; kept for attempts saved earlier) */
  hinted: Set<string>;
  /** questions carried over from the last attempt (「只练错题」): shown answered and read-only */
  kept: Set<string>;
  review: { key: ItemKeyT; result: Result } | null;
  onOpenEntry: (id: string) => void;
}

/** Enter in a field moves to the next one on the page (Tab works as usual) */
function focusNext(from: HTMLElement) {
  const fields = Array.from(document.querySelectorAll<HTMLElement>('[data-vq-field]:not([readonly])'));
  const next = fields[fields.indexOf(from) + 1];
  if (next) next.focus();
  else from.blur();
}
const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
    e.preventDefault();
    focusNext(e.currentTarget);
  }
};
/** attributes every quiz input shares: Enter → next field, keep the field clear of the on-screen keyboard */
const fieldAttrs = { 'data-vq-field': '', onKeyDown: onEnter, onFocus: centreOnFocus };

/** the grading verdict of one answer part → the result variant of its field */
const partResult = (ok: boolean | null | undefined): LineResult => (ok === true ? 'correct' : ok === false ? 'wrong' : 'none');

const record = (v: Rec | string | undefined): Rec => (v && typeof v === 'object' ? v : {});

/** a 大题 is shown as "Part N" with the range of its question numbers, like the one-page Parts of KET / PET (#114) */
export const partLabel = (t: TFunction, i: number) => t('vocab.quiz.part', { n: i + 1 });
const range = (s: VocabDayItemT['sections'][number]) => {
  const first = s.questions[0]?.number;
  const last = s.questions[s.questions.length - 1]?.number;
  return first === last ? `${first}` : `${first}–${last}`;
};

/** the range on a Part's card: "Q6–Q20" */
const qRange = (t: TFunction, s: VocabDayItemT['sections'][number]) => {
  const first = s.questions[0]?.number;
  const last = s.questions[s.questions.length - 1]?.number;
  return first === last ? t('vocab.quiz.qSingle', { n: first }) : t('vocab.quiz.qRange', { first, last });
};

/** the page = one 大题 */
export function VocabQuiz({
  state,
  page,
  setPage,
  onSubmit,
  submitting,
  onShowResult,
}: {
  state: QuizState;
  page: number;
  setPage: (n: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  onShowResult: () => void;
}) {
  const { t } = useTranslation();
  const { item, review } = state;
  const sections = item.sections;
  const section = sections[page];
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 }); // returns a promise in current Chrome — not a cleanup
  }, [page]);
  const done = (s: (typeof sections)[number]) => s.questions.filter((q) => isAnswered(q, state.responses[q.id] as never)).length;
  const isLast = page === sections.length - 1;
  const rowsOf = (s: (typeof sections)[number]) => s.questions.map((q) => review?.result.byQuestion.find((b) => b.q === q.id));
  /** #128 / #140: after submitting, each Part's card shows questions right / questions ("4/5"); nothing while a 中译英
   *  mark is still coming */
  const sectionScore = (s: (typeof sections)[number]): string | undefined => {
    if (!review) return undefined;
    const rows = rowsOf(s);
    if (rows.some((r) => !r || r.scoredBy === 'pending')) return undefined;
    return `${rows.filter((r) => r?.correct === true).length}/${s.questions.length}`;
  };
  /** the number of one question in the footer: answered (brand fill) while answering, right / wrong after submitting */
  const questionState = (q: QuestionT): PartQuestionState => {
    if (review) {
      const r = review.result.byQuestion.find((b) => b.q === q.id);
      return r?.correct === true ? 'correct' : r?.correct === false ? 'wrong' : 'none';
    }
    return isAnswered(q, state.responses[q.id] as never) ? 'answered' : 'none';
  };
  const allAnswered = sections.every((s) => done(s) === s.questions.length);
  const parts: PartNavPart[] = sections.map((s, i) => {
    const score = sectionScore(s);
    return {
      id: s.id,
      title: partLabel(t, i),
      kicker: `P${i + 1}`,
      range: qRange(t, s),
      questions: s.questions.map((q) => {
        const st = questionState(q);
        return {
          id: q.id,
          number: q.number,
          state: st,
          ariaLabel:
            t('vocab.quiz.goQuestion', { n: q.number }) +
            (st === 'answered' ? t('vocab.quiz.markAnswered') : st === 'correct' ? t('vocab.quiz.markRight') : st === 'wrong' ? t('vocab.quiz.markWrong') : ''),
        };
      }),
      count: review ? score : `${done(s)}/${s.questions.length}`,
      complete: done(s) === s.questions.length,
      ariaLabel: t('vocab.quiz.sectionDot', { part: partLabel(t, i), range: range(s), done: done(s), total: s.questions.length }) + (score ? t('reader.dotRight', { score }) : ''),
    };
  });
  /** tap a question number in the footer: bring its row into view and put the cursor in its first field */
  const pickQuestion = (_part: number, qid: string) => {
    const root = scroller.current;
    const row = root?.querySelector<HTMLElement>(`[data-q="${qid}"], [data-vq-q="${qid}"]`);
    if (!row) return;
    const field = row.matches('[data-vq-field]') ? row : row.querySelector<HTMLElement>('[data-vq-field]:not([readonly])');
    field?.focus({ preventScroll: true });
    row.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const next = { kind: 'next' as const, label: t('reader.next'), onClick: () => setPage(page + 1) };
  return (
    <div className="question-card vocab-quiz">
      {/* #146: in review the way back to the result is the breadcrumb at the top of the card (Figma 3.26), not a button */}
      {review && (
        <Breadcrumb
          label={t('vocab.result.breadcrumb')}
          items={[
            { key: 'result', label: t('vocab.result.crumbResult'), onClick: onShowResult },
            { key: 'answers', label: t('vocab.result.view') },
          ]}
        />
      )}
      <div className="question-scroll thin-scroll" ref={scroller}>
        <SectionHeader part={partLabel(t, page)} instruction={section.instruction} />
        {section.promptBank && <PromptBank items={section.promptBank} />}
        {section.stimulus && <TableStimulus blocks={section.stimulus} questions={section.questions} state={state} />}
        <ol className="vq-rows">
          {section.questions
            // a question answered inside the table has no row of its own; in review the table's right answers come in one box
            .filter((q) => !inTable(q))
            .map((q) => (
              <Row key={q.id} q={q} state={state} />
            ))}
        </ol>
      </div>
      <PartNav
        label={t('reader.nav')}
        parts={parts}
        page={page}
        review={!!review}
        prev={{ label: t('reader.prev'), onClick: () => setPage(page - 1) }}
        action={
          review
            ? isLast
              ? { ...next, disabled: true }
              : next
            : isLast
              ? { kind: 'submit', label: t('reader.submit'), dim: !allAnswered, disabled: submitting, onClick: onSubmit }
              : next
        }
        onPage={setPage}
        onPickQuestion={pickQuestion}
      />
    </div>
  );
}

/** a textEntry whose blanks are in the section's table, not in a prompt of its own (第69–70天) */
const inTable = (q: QuestionT) => q.interaction.kind === 'textEntry' && !q.interaction.prompt?.length && !!q.interaction.blankIds?.length;

/**
 * 第69–70天: a table printed with answer lines (人称代词, 基数词 / 序数词, 不规则动词) — the table as printed, a typed blank in
 * each answer cell; each blank belongs to the question that lists it in blankIds (as 表格填空)
 */
function TableStimulus({ blocks, questions, state }: { blocks: BlockT[]; questions: QuestionT[]; state: QuizState }) {
  const owner = (id: string) => questions.find((q) => q.interaction.kind === 'textEntry' && q.interaction.blankIds?.includes(id));
  const renderBlank = (n: BlankNode) => {
    const q = owner(n.id);
    if (!q) return null;
    const r = record(state.responses[q.id]);
    const result = state.review?.result.byQuestion.find((b) => b.q === q.id);
    return (
      <BlankInput
        key={n.id}
        n={n}
        value={r[n.id] ?? ''}
        onChange={(v) => state.setResponse(q.id, { ...record(state.responses[q.id]), [n.id]: v })}
        ok={state.review ? (result?.parts?.[n.id] ?? null) : null}
        locked={(state.kept.has(q.id) && !state.review) || !!state.review}
        inputAttrs={{ ...fieldAttrs, 'data-vq-q': q.id }}
      />
    );
  };
  return (
    <>
      <TableFill>
        {blocks.map((b) => (
          <Block key={b.id} block={b} renderBlank={renderBlank} />
        ))}
      </TableFill>
      {state.review && <TableReview questions={questions.filter(inTable)} state={state} />}
    </>
  );
}

/** Figma 3.31: after the table one fold "正确答案" with the answers of the cells that were not right (numbered as the questions) */
function TableReview({ questions, state }: { questions: QuestionT[]; state: QuizState }) {
  const { t } = useTranslation();
  const review = state.review!;
  const wrong = questions.filter((q) => review.result.byQuestion.find((b) => b.q === q.id)?.correct !== true && review.key.answers[q.id]);
  if (!wrong.length) return <span className="sr-only">{t('reader.correct')}</span>;
  return (
    <AnswerFeedback
      result="wrong"
      label={t('reader.correctAnswer')}
      answer={wrong.map((q) => `${q.number}. ${answerText(q, review.key.answers[q.id])}`).join('   ')}
      score={{ correct: false, text: t('reader.wrong') }}
    />
  );
}

/** 词组日二: the boxed Chinese phrases; tap one to cross it off (only a note for the learner) */
function PromptBank({ items }: { items: string[] }) {
  const { t } = useTranslation();
  const [used, setUsed] = useState<Set<number>>(new Set());
  return (
    <PhraseBank
      items={items}
      used={used}
      label={t('vocab.quiz.bank')}
      onToggle={(i) => setUsed((u) => (u.has(i) ? new Set([...u].filter((y) => y !== i)) : new Set(u).add(i)))}
    />
  );
}

/** where the run of blanks that ends a prompt starts (blanks with only spaces between them); 0 = no answer cell */
const trailingBlanks = (prompt: readonly InlineT[]): number => {
  let i = prompt.length;
  while (i > 0 && (prompt[i - 1].t === 'blank' || (prompt[i - 1].t === 'text' && !(prompt[i - 1] as { v: string }).v.trim()))) i--;
  while (i < prompt.length && prompt[i].t !== 'blank') i++; // spaces before the first blank stay with the prompt
  return i > 0 && i < prompt.length && prompt[prompt.length - 1]?.t === 'blank' ? i : 0;
};

/** a sentence whose Chinese prompt ends in its blank(s) (二, 词组日一): the blanks sit at the right (#118, #143) */
const answerRight = (q: QuestionT) => q.interaction.kind === 'textEntry' && trailingBlanks(q.interaction.prompt ?? []) > 0;

function Row({ q, state }: { q: QuestionT; state: QuizState }) {
  const { t } = useTranslation();
  const { review } = state;
  const res = review?.result.byQuestion.find((b) => b.q === q.id);
  const k = review?.key.answers[q.id];
  const kept = state.kept.has(q.id) && !review;
  const it = q.interaction;
  let body: ReactNode = null;
  if (it.kind === 'wordProfile') body = <WordProfileRow q={q} state={state} locked={kept} />;
  else if (it.kind === 'wordFamily') body = <WordFamilyRow q={q} state={state} locked={kept} />;
  else if (it.kind === 'textEntry') body = <TextEntryRow q={q} state={state} locked={kept} />;
  else if (it.kind === 'extendedText') body = <TranslationRow q={q} state={state} locked={kept} />;
  // 一 三 and the sentences with the blank at the right are white cards (RC/Vocab/WordProfileRow, WordFamilyRow, vq-row);
  // the other rows sit on the card itself (Figma 3.11–3.16)
  const card = it.kind === 'wordProfile' || it.kind === 'wordFamily' || answerRight(q);
  return (
    <li
      className={`vq-row ${card ? 'is-card' : ''} ${review ? 'is-reviewed' : ''} ${res?.correct === true ? 'is-correct' : res?.correct === false ? 'is-wrong' : ''} ${kept ? 'is-kept' : ''}`}
      data-q={q.id}
    >
      <div className="vq-body">
        {body}
        {kept && <span className="vq-kept">{t('vocab.quiz.kept')}</span>}
        {review && k && <Review q={q} k={k} result={res} state={state} />}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ fields */

/** 一: IPA | word + meaning on one line, 词性 chips below, the label in line with the word (#117) */
function WordProfileRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  if (q.interaction.kind !== 'wordProfile') return null;
  const r = record(state.responses[q.id]);
  const parts = state.review?.result.byQuestion.find((b) => b.q === q.id)?.parts;
  const ro = locked || !!state.review;
  const set = (k: string, v: string) => state.setResponse(q.id, { ...r, [k]: v });
  return (
    <WordProfileLayout
      num={`${q.number}.`}
      ipa={<Rich nodes={q.interaction.prompt} />}
      word={<LineInput value={r.word ?? ''} onChange={(v) => set('word', v)} locked={ro} label={t('vocab.quiz.word', { n: q.number })} result={partResult(parts?.word)} lang="en" inputAttrs={fieldAttrs} />}
      zh={<LineInput value={r.zh ?? ''} onChange={(v) => set('zh', v)} locked={ro} label={t('vocab.quiz.zh', { n: q.number })} result={partResult(parts?.zh)} lang="zh" inputAttrs={fieldAttrs} />}
      wordLabel={t('vocab.quiz.wordLabel')}
      zhLabel={t('vocab.quiz.zhLabel')}
      posLabel={t('vocab.quiz.posLabel')}
      pos={<PosChips options={q.interaction.posOptions} value={r.pos ?? ''} onChange={(v) => set('pos', v)} disabled={ro} label={t('vocab.quiz.pos', { n: q.number })} result={partResult(parts?.pos)} />}
    />
  );
}

/** 三: the given word (no part of speech) | one line per form: part of speech, word, meaning — aligned in columns (#120) */
function WordFamilyRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  const it = q.interaction;
  if (it.kind !== 'wordFamily') return null;
  const r = record(state.responses[q.id]);
  const parts = state.review?.result.byQuestion.find((b) => b.q === q.id)?.parts;
  const ro = locked || !!state.review;
  const set = (k: string, v: string) => state.setResponse(q.id, { ...r, [k]: v });
  return (
    <WordFamilyLayout
      num={`${q.number}.`}
      wordLabel={t('vocab.quiz.wordLabel')}
      zhLabel={t('vocab.quiz.zhLabel')}
      base={it.base.word}
      slots={it.slots.map((s) => ({
        id: s.id,
        pos: s.pos,
        word: <LineInput value={r[`${s.id}.word`] ?? ''} onChange={(v) => set(`${s.id}.word`, v)} locked={ro} label={t('vocab.quiz.familyWord', { n: q.number, pos: s.pos })} result={partResult(parts?.[`${s.id}.word`])} lang="en" inputAttrs={fieldAttrs} />,
        zh: <LineInput value={r[`${s.id}.zh`] ?? ''} onChange={(v) => set(`${s.id}.zh`, v)} locked={ro} label={t('vocab.quiz.familyZh', { n: q.number, pos: s.pos })} result={partResult(parts?.[`${s.id}.zh`])} lang="zh" inputAttrs={fieldAttrs} />,
      }))}
    />
  );
}

/**
 * sentences with blanks (二 四 五, 词组日一 二) — the KET / PET blank (#121 #122): underline, question number as
 * placeholder, printed first letter before it, the word to change in brackets after it. A Chinese prompt that ends in
 * its blank (二, 词组日一) has the blank at the right, like the answer lines in the book (#118).
 */
function TextEntryRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  if (q.interaction.kind !== 'textEntry') return null;
  const r = record(state.responses[q.id]);
  const prompt = (q.interaction.prompt ?? []) as InlineT[];
  const result = state.review?.result.byQuestion.find((b) => b.q === q.id);
  const blank = (n: BlankNode) => (
    <BlankInput
      key={n.id}
      n={n}
      value={r[n.id] ?? ''}
      onChange={(v) => state.setResponse(q.id, { ...r, [n.id]: v })}
      ok={state.review ? (result?.parts?.[n.id] ?? null) : null}
      locked={locked || !!state.review}
      baseOutside
      inputAttrs={fieldAttrs}
    />
  );
  const num = <span className="vq-num">{q.number}.</span>;
  const from = trailingBlanks(prompt);
  if (from > 0) {
    // #143: every blank at the end (原形 过去式 过去分词) goes to the answer cell, not only the last one
    const blanks = prompt.slice(from).filter((n): n is BlankNode & InlineT => n.t === 'blank');
    return (
      <p className="vq-sentence is-answer-right">
        {num}
        <span className="vq-prompt">
          <Rich nodes={prompt.slice(0, from)} />
        </span>
        <span className={`vq-answer-cell ${blanks.length > 1 ? 'is-multi' : ''}`}>{blanks.map(blank)}</span>
      </p>
    );
  }
  return (
    <p className="vq-sentence">
      {num}
      <span className="vq-text">
        <Rich nodes={prompt} blank={blank} />
      </span>
    </p>
  );
}

function TranslationRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  const it = q.interaction;
  if (it.kind !== 'extendedText') return null;
  const value = typeof state.responses[q.id] === 'string' ? (state.responses[q.id] as string) : '';
  return (
    <TranslateRow
      num={`${q.number}.`}
      prompt={<Rich nodes={it.prompt} />}
      requiredWord={it.requiredWord}
      value={value}
      onChange={(v) => state.setResponse(q.id, v)}
      locked={locked || !!state.review}
      label={t('vocab.quiz.translate', { n: q.number })}
      placeholder={t('vocab.quiz.phTranslate')}
      textareaAttrs={{ 'data-vq-field': '', onFocus: centreOnFocus }}
    />
  );
}

/* ------------------------------------------------------------------ review */

function answerText(q: QuestionT, k: AnswerKeyT): string {
  if ('word' in k && 'pos' in k) return `${k.word.join(' / ')}  ${k.pos.join(' / ')}  ${k.zh[0] ?? ''}`;
  if ('forms' in k) return Object.values(k.forms).map((f) => `${f.word.join(' / ')} ${f.zh[0] ?? ''}`).join('；');
  if ('slots' in k) return Object.values(k.slots).map((s) => s.accept.join(' / ')).join('；');
  if ('sampleAnswer' in k) return (k.references?.length ? k.references : [k.sampleAnswer]).join(' / ');
  return q.id;
}

/** correct / wrong / partly right (some points) / not scored yet */
const feedbackResult = (r?: Result['byQuestion'][number]): FeedbackResult =>
  r?.correct === true ? 'correct' : r?.correct === false ? (r.points > 0 ? 'partial' : 'wrong') : 'none';

function Review({ q, k, result, state }: { q: QuestionT; k: AnswerKeyT; result?: Result['byQuestion'][number]; state: QuizState }) {
  const { t } = useTranslation();
  const hintedHere = [...state.hinted].some((h) => h.startsWith(`${q.id}:`));
  const points = 'keyPoints' in k ? (k.keyPoints ?? []) : [];
  const scored = result && result.scoredBy !== 'pending' && result.scoredBy !== 'self' && result.scoredBy !== 'none';
  // Figma 3.28: a model-marked 中译英 is one grey box — the score, a pill per point met / to work on, the reference translation
  if (result?.scoredBy === 'judge' && result.judgement) {
    const j = result.judgement;
    return (
      <JudgeResult
        layout="line"
        label={t('judge.markLabel')}
        score={j.score}
        max={j.maxPoints}
        scoreText={t('judge.scoreLine', { score: j.score, max: j.maxPoints })}
        reviewTag={j.needsReview ? t('judge.needsReview') : undefined}
        // #147: an empty / non-English answer met nothing — no key-point pills (they read as praise), only the message
        chips={j.flags.includes('empty') || j.flags.includes('not_english') ? [] : [
          ...points.map((p) => ({ id: p.id, text: p.descZh, kind: (j.keyPoints.find((x) => x.id === p.id)?.met === 'yes' ? 'good' : 'tip') as 'good' | 'tip' })),
          ...j.languageIssues.map((l, i) => ({ id: `language-${i}`, text: l.noteZh ?? `${l.text} → ${l.fix}`, kind: 'tip' as const })),
        ]}
        feedback={j.feedbackZh}
        reference={t('vocab.result.reference', { text: answerText(q, k) })}
      />
    );
  }
  // Figma 3.26: a right answer has no box — the colour of the field and the Part's mark say it (spoken here)
  if (result?.correct === true) return <span className="sr-only">{t('reader.correct')}</span>;
  return (
    <AnswerFeedback
      result={feedbackResult(result)}
      label={q.interaction.kind === 'extendedText' ? t('vocab.result.references') : t('reader.correctAnswer')}
      answer={answerText(q, k)}
      score={
        scored
          ? {
              correct: !!result.correct,
              // #140: right / partly right / wrong — no per-question points (some are fractions of a point)
              text:
                (result.correct ? t('reader.correct') : result.points > 0 ? t('vocab.result.partly') : t('reader.wrong')) +
                (hintedHere ? ` · ${t('vocab.result.hintHalf')}` : ''),
            }
          : undefined
      }
      action={
        q.entryRef && (
          <button type="button" className="vq-word" onClick={() => state.onOpenEntry(q.entryRef!)}>
            <img src={bookmarkIcon} alt="" />
            {t('vocab.result.openEntry')}
          </button>
        )
      }
    >
      {result?.scoredBy === 'pending' && (
        <p className="judge is-pending" role="status">
          {t('judge.marking')}
        </p>
      )}
      {result?.scoredBy === 'self' && <AnswerExplain>{t('vocab.result.judgeUnavailable')}</AnswerExplain>}
      {k.explanationZh && <AnswerExplain>{k.explanationZh}</AnswerExplain>}
    </AnswerFeedback>
  );
}
