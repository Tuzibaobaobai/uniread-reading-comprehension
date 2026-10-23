import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnswerKeyT, InlineT, ItemKeyT, QuestionT, VocabDayItemT } from '@schema';
import { Rich, type BlankNode } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import { isAnswered, type Result } from '@/lib/grading';
import { Check, Cross } from '@/components/Icons';
import { JudgeMarks } from '@/reader/interactions';
import { QuestionStrip } from '@/reader/QuestionStrip';
import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import { HintTiles } from './HintTiles';
import { VoiceInput } from './VoiceInput';
import { centreOnFocus } from './useVisualViewport';

type Rec = Record<string, string>;
export type VocabResponses = Record<string, Rec | string>;

export interface QuizState {
  item: VocabDayItemT;
  responses: VocabResponses;
  setResponse: (qid: string, value: Rec | string) => void;
  hinted: Set<string>;
  onHinted: (part: string) => void;
  onVoiced: (part: string) => void;
  /** questions carried over from the last attempt (「只练错题」): shown answered and read-only */
  kept: Set<string>;
  review: { key: ItemKeyT; result: Result } | null;
  onOpenEntry: (id: string) => void;
}

/** Enter in a field moves to the next one on the page (Tab works as usual) */
function focusNext(from: HTMLElement) {
  const fields = Array.from(document.querySelectorAll<HTMLElement>('[data-vq-field]:not([disabled])'));
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

const record = (v: Rec | string | undefined): Rec => (v && typeof v === 'object' ? v : {});

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
  const sectionState = (s: (typeof sections)[number]) => {
    if (!review) return done(s) === s.questions.length ? 'is-answered' : '';
    const rows = s.questions.map((q) => review.result.byQuestion.find((b) => b.q === q.id));
    return rows.every((r) => r?.correct === true) ? 'is-correct' : rows.some((r) => r?.correct === false) ? 'is-wrong' : 'is-neutral';
  };
  return (
    <div className="question-card vocab-quiz">
      <div className="question-scroll thin-scroll" ref={scroller}>
        <p className="section-instruction">
          <b>{section.label}. </b>
          {section.instruction}
          {!review && (
            <span className="vq-progress">
              {t('vocab.quiz.sectionProgress', { done: done(section), total: section.questions.length })}
            </span>
          )}
        </p>
        {section.promptBank && <PromptBank items={section.promptBank} />}
        <ol className="vq-rows">
          {section.questions.map((q) => (
            <Row key={q.id} q={q} state={state} />
          ))}
        </ol>
      </div>
      <nav className="question-nav" aria-label={t('reader.nav')}>
        <button className="pill-button" disabled={page <= 0} onClick={() => setPage(page - 1)}>
          {t('reader.prev')}
        </button>
        <QuestionStrip current={page} count={sections.length}>
          {sections.map((s, i) => {
            const st = sectionState(s);
            return (
              <button
                key={s.id}
                className={`question-dot ${i === page ? 'is-current' : ''} ${st}`}
                onClick={() => setPage(i)}
                aria-current={i === page}
                aria-label={t('vocab.quiz.sectionDot', { label: s.label, done: done(s), total: s.questions.length })}
              >
                {st === 'is-correct' || st === 'is-wrong' ? (
                  <img className="question-dot-icon" src={st === 'is-correct' ? correctIcon : wrongIcon} alt="" />
                ) : (
                  <>
                    <span className="question-dot-num">{s.label}</span>
                    {!review && <span className="question-dot-mark" aria-hidden />}
                  </>
                )}
              </button>
            );
          })}
        </QuestionStrip>
        {review ? (
          isLast ? (
            <button className="pill-button primary" onClick={onShowResult}>
              {t('vocab.result.back')}
            </button>
          ) : (
            <button className="pill-button" onClick={() => setPage(page + 1)}>
              {t('reader.next')}
            </button>
          )
        ) : isLast ? (
          <button className="pill-button primary" disabled={submitting} onClick={onSubmit}>
            {t('reader.submit')}
          </button>
        ) : (
          <button className="pill-button" onClick={() => setPage(page + 1)}>
            {t('reader.next')}
          </button>
        )}
      </nav>
    </div>
  );
}

/** 词组日二: the boxed Chinese phrases; tap one to cross it off (only a note for the learner) */
function PromptBank({ items }: { items: string[] }) {
  const { t } = useTranslation();
  const [used, setUsed] = useState<Set<number>>(new Set());
  return (
    <div className="vq-bank" role="group" aria-label={t('vocab.quiz.bank')}>
      {items.map((x, i) => (
        <button
          key={i}
          type="button"
          className={`vq-bank-item ${used.has(i) ? 'is-used' : ''}`}
          aria-pressed={used.has(i)}
          onClick={() => setUsed((u) => (u.has(i) ? new Set([...u].filter((y) => y !== i)) : new Set(u).add(i)))}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

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
  return (
    <li className={`vq-row ${res?.correct === true ? 'is-correct' : res?.correct === false ? 'is-wrong' : ''} ${kept ? 'is-kept' : ''}`} data-q={q.id}>
      <span className="vq-num">{q.number}</span>
      <div className="vq-body">
        {body}
        {kept && <span className="vq-kept">{t('vocab.quiz.kept')}</span>}
        {review && k && <Review q={q} k={k} result={res} state={state} />}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ fields */

function useHint(state: QuizState, q: QuestionT, part: string) {
  const [tiles, setTiles] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const ask = async () => {
    setFailed(false);
    try {
      const x = await staticContent.hint!({ itemId: state.item.id, questionId: q.id, part });
      setTiles(x);
      state.onHinted(`${q.id}:${part}`);
    } catch {
      setFailed(true);
    }
  };
  return { tiles, ask, failed, used: state.hinted.has(`${q.id}:${part}`) };
}

function EnField({
  q,
  part,
  state,
  value,
  onChange,
  locked,
  prefix,
  label,
  ok,
  wide,
  placeholder,
}: {
  q: QuestionT;
  part: string;
  state: QuizState;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  prefix?: string;
  label: string;
  ok?: boolean | null;
  wide?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const hint = useHint(state, q, part);
  const readOnly = locked || !!state.review;
  return (
    <span className={`vq-field-wrap ${wide ? 'is-wide' : ''}`}>
      <span className={`vq-field ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}>
        {prefix && <span className="vq-prefix">{prefix}</span>}
        <input
          data-vq-field
          className="vq-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onEnter}
          onFocus={centreOnFocus}
          disabled={readOnly}
          aria-label={label}
          placeholder={placeholder}
          lang="en"
          inputMode="text"
          enterKeyHint="next"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
        {hint.used && <span className="vq-hinted">{t('vocab.hint.used')}</span>}
        {!readOnly && staticContent.hint && !hint.tiles && (
          <button type="button" className="vq-hint-btn" onClick={() => void hint.ask()} aria-label={t('vocab.hint.askFor', { label })}>
            {t('vocab.hint.ask')}
          </button>
        )}
      </span>
      {hint.failed && <span className="voice-error">{t('vocab.hint.failed')}</span>}
      {!readOnly && hint.tiles && <HintTiles tiles={hint.tiles} onChange={onChange} />}
    </span>
  );
}

function ZhField({
  q,
  part,
  state,
  value,
  onChange,
  locked,
  label,
  ok,
}: {
  q: QuestionT;
  part: string;
  state: QuizState;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  label: string;
  ok?: boolean | null;
}) {
  const { t } = useTranslation();
  const readOnly = locked || !!state.review;
  return (
    <span className={`vq-field is-zh ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}>
      <input
        data-vq-field
        className="vq-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onEnter}
        onFocus={centreOnFocus}
        disabled={readOnly}
        aria-label={label}
        placeholder={t('vocab.quiz.phZh')}
        lang="zh-CN"
        enterKeyHint="next"
        autoComplete="off"
      />
      {!readOnly && (
        <VoiceInput
          itemId={state.item.id}
          questionId={q.id}
          part={part}
          onText={(text) => {
            onChange(text.replace(/[。.！!？?]+$/u, ''));
            state.onVoiced(`${q.id}:${part}`);
          }}
        />
      )}
    </span>
  );
}

/** POS chips (no native select) */
function PosChips({ options, value, onChange, disabled, label, ok }: { options: string[]; value: string; onChange: (v: string) => void; disabled: boolean; label: string; ok?: boolean | null }) {
  return (
    <span className={`vq-pos ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={value === p} className={`vq-pos-chip ${value === p ? 'is-on' : ''}`} disabled={disabled} onClick={() => onChange(value === p ? '' : p)}>
          {p}
        </button>
      ))}
    </span>
  );
}

function WordProfileRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  if (q.interaction.kind !== 'wordProfile') return null;
  const r = record(state.responses[q.id]);
  const parts = state.review?.result.byQuestion.find((b) => b.q === q.id)?.parts;
  const set = (k: string, v: string) => state.setResponse(q.id, { ...r, [k]: v });
  return (
    <div className="vq-profile">
      <span className="vq-ipa">
        <Rich nodes={q.interaction.prompt} />
      </span>
      <EnField q={q} part="word" state={state} value={r.word ?? ''} onChange={(v) => set('word', v)} locked={locked} label={t('vocab.quiz.word', { n: q.number })} ok={parts?.word} placeholder={t('vocab.quiz.phWord')} />
      <PosChips options={q.interaction.posOptions} value={r.pos ?? ''} onChange={(v) => set('pos', v)} disabled={locked || !!state.review} label={t('vocab.quiz.pos', { n: q.number })} ok={parts?.pos} />
      <ZhField q={q} part="zh" state={state} value={r.zh ?? ''} onChange={(v) => set('zh', v)} locked={locked} label={t('vocab.quiz.zh', { n: q.number })} ok={parts?.zh} />
    </div>
  );
}

function WordFamilyRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  const it = q.interaction;
  if (it.kind !== 'wordFamily') return null;
  const r = record(state.responses[q.id]);
  const parts = state.review?.result.byQuestion.find((b) => b.q === q.id)?.parts;
  const set = (k: string, v: string) => state.setResponse(q.id, { ...r, [k]: v });
  return (
    <div className="vq-family">
      <span className="vq-base">
        <b lang="en">{it.base.word}</b> {it.base.pos}
      </span>
      {it.slots.map((s) => (
        <span key={s.id} className="vq-slot">
          <span className="vq-slot-pos">{s.pos}</span>
          <EnField q={q} part={`${s.id}.word`} state={state} value={r[`${s.id}.word`] ?? ''} onChange={(v) => set(`${s.id}.word`, v)} locked={locked} label={t('vocab.quiz.familyWord', { n: q.number, pos: s.pos })} ok={parts?.[`${s.id}.word`]} placeholder={t('vocab.quiz.phWord')} />
          <ZhField q={q} part={`${s.id}.zh`} state={state} value={r[`${s.id}.zh`] ?? ''} onChange={(v) => set(`${s.id}.zh`, v)} locked={locked} label={t('vocab.quiz.familyZh', { n: q.number, pos: s.pos })} ok={parts?.[`${s.id}.zh`]} />
        </span>
      ))}
    </div>
  );
}

function TextEntryRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  if (q.interaction.kind !== 'textEntry') return null;
  const r = record(state.responses[q.id]);
  const parts = state.review?.result.byQuestion.find((b) => b.q === q.id)?.parts;
  const prompt = q.interaction.prompt ?? [];
  const phrase = state.item.unit === 'phrases';
  const blank = (n: BlankNode) => (
    <span className="vq-blank" key={n.id}>
      <EnField
        q={q}
        part={n.id}
        state={state}
        value={r[n.id] ?? ''}
        onChange={(v) => state.setResponse(q.id, { ...r, [n.id]: v })}
        locked={locked}
        prefix={n.hint?.firstLetter}
        label={t('interaction.blankN', { n: n.number ?? q.number })}
        ok={parts?.[n.id]}
        wide={phrase}
      />
      {n.hint?.baseWord && <span className="vq-base-word">({n.hint.baseWord})</span>}
    </span>
  );
  return (
    <p className="vq-sentence">
      <Rich nodes={prompt as InlineT[]} blank={blank} />
    </p>
  );
}

function TranslationRow({ q, state, locked }: { q: QuestionT; state: QuizState; locked: boolean }) {
  const { t } = useTranslation();
  const it = q.interaction;
  if (it.kind !== 'extendedText') return null;
  const value = typeof state.responses[q.id] === 'string' ? (state.responses[q.id] as string) : '';
  const readOnly = locked || !!state.review;
  return (
    <div className="vq-translate">
      <p className="vq-zh-sentence">
        <Rich nodes={it.prompt} />
        {it.requiredWord && <span className="vq-required" lang="en">（{it.requiredWord}）</span>}
      </p>
      <span className="vq-field is-text">
        <textarea
          data-vq-field
          className="vq-textarea"
          value={value}
          onChange={(e) => state.setResponse(q.id, e.target.value)}
          onFocus={centreOnFocus}
          disabled={readOnly}
          rows={2}
          lang="en"
          aria-label={t('vocab.quiz.translate', { n: q.number })}
          placeholder={t('vocab.quiz.phTranslate')}
          autoCapitalize="sentences"
          autoCorrect="off"
          spellCheck={false}
        />
        {!readOnly && (
          <VoiceInput
            itemId={state.item.id}
            questionId={q.id}
            part="text"
            onText={(text) => {
              state.setResponse(q.id, value ? `${value} ${text}` : text);
              state.onVoiced(`${q.id}:text`);
            }}
          />
        )}
      </span>
    </div>
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

function Review({ q, k, result, state }: { q: QuestionT; k: AnswerKeyT; result?: Result['byQuestion'][number]; state: QuizState }) {
  const { t } = useTranslation();
  const hintedHere = [...state.hinted].some((h) => h.startsWith(`${q.id}:`));
  const points = 'keyPoints' in k ? (k.keyPoints ?? []) : [];
  return (
    <div className="vq-review">
      <p className="vq-answer">
        <span className="explain-label">{q.interaction.kind === 'extendedText' ? t('vocab.result.references') : t('reader.correctAnswer')}</span>
        <span lang="en">{answerText(q, k)}</span>
        {result && result.scoredBy !== 'pending' && result.scoredBy !== 'self' && result.scoredBy !== 'none' && (
          <span className="vq-points">
            {result.correct ? <Check /> : <Cross />} {t('vocab.result.points', { points: Math.round(result.points * 100) / 100, max: result.maxPoints })}
            {hintedHere && ` · ${t('vocab.hint.half')}`}
          </span>
        )}
      </p>
      {result?.scoredBy === 'pending' && (
        <p className="judge is-pending" role="status">
          {t('judge.marking')}
        </p>
      )}
      {result?.scoredBy === 'judge' && result.judgement && <JudgeMarks j={result.judgement} points={points} />}
      {k.explanationZh && <p className="vq-explain">{k.explanationZh}</p>}
      {q.entryRef && (
        <button type="button" className="chip" onClick={() => state.onOpenEntry(q.entryRef!)}>
          {t('vocab.result.openEntry')}
        </button>
      )}
    </div>
  );
}
