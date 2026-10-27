import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { InlineT, QuestionT } from '@schema';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { Check, ChevronDown, Cross, Locate } from '@/components/Icons';
import { staticContent } from '@/lib/content';
import { Block } from './ArticlePane';
import { OptionList, QuestionPrompt, type InteractionProps } from './interactions';

/*
 * Exam Parts answered on one page (section.view, GitHub #82 #86 #87). Every question keeps its own id, response
 * ([optionId]) and key — only the presentation changes. 待补组件 — no Figma design yet; built from Option-text-item
 * and existing tokens.
 */

type Opt = { id: string; content: InlineT[] };
const optionsOf = (q: QuestionT): Opt[] => (q.interaction.kind === 'choice' ? q.interaction.options : []);
const promptOf = (q: QuestionT): InlineT[] => (q.interaction.kind === 'choice' ? q.interaction.prompt : []);
const sameOptions = (qs: QuestionT[]) => {
  const key = (q: QuestionT) => optionsOf(q).map((o) => `${o.id}:${plainText(o.content)}`).join('|');
  return qs.length > 1 && qs.every((q) => key(q) === key(qs[0]));
};

function useAnswers(props: InteractionProps) {
  const pick = (qid: string, id: string | undefined) =>
    props.setResponses((prev) => {
      const next = { ...prev };
      if (id === undefined) delete next[qid];
      else next[qid] = [id];
      return next;
    });
  const answerOf = (qid: string) => {
    const r = props.responses[qid];
    return Array.isArray(r) ? r[0] : undefined;
  };
  const correctOf = (qid: string) => {
    const k = props.review?.key.answers[qid];
    return k && 'correct' in k ? k.correct : undefined;
  };
  return { pick, answerOf, correctOf };
}

/** after submitting: each question's explanation (Chinese), in order */
function Explanations({ props, qs }: { props: InteractionProps; qs: QuestionT[] }) {
  const { correctOf, answerOf } = useAnswers(props);
  const { t } = useTranslation();
  if (!props.review) return null;
  return (
    <ul className="part-explain">
      {qs.map((q) => {
        const k = props.review!.key.answers[q.id];
        const ok = correctOf(q.id)?.includes(answerOf(q.id) ?? '');
        return (
          <li key={q.id} className={ok ? 'is-correct' : 'is-wrong'}>
            <b>
              {q.number}. {ok ? <Check /> : <Cross />} {correctOf(q.id)?.join('')}
            </b>{' '}
            {k?.explanationZh}
            {k?.evidence?.[0] && props.onLocate && (
              <button className="chip part-explain-locate" onClick={() => props.onLocate!(k.evidence![0].block, k.evidence![0].quote)}>
                <Locate /> {t('reader.locate')}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * view "all": every question of the Part on one page. Questions that share one option set (KET Reading Part 2:
 * the three people) form a grid — a row per question, a column per option; otherwise the questions are stacked,
 * each with its options (Listening parts with one continuous recording).
 */
export function SectionAllView(props: InteractionProps) {
  const qs = props.fq.section.questions;
  const { pick, answerOf, correctOf } = useAnswers(props);
  const { t } = useTranslation();
  const review = props.review;

  if (sameOptions(qs)) {
    const opts = optionsOf(qs[0]);
    return (
      <>
        <table className="part-grid">
          <thead>
            <tr>
              <th scope="col" />
              {opts.map((o) => (
                <th key={o.id} scope="col">
                  <span className="part-grid-letter">{o.id}</span> <Rich nodes={o.content} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qs.map((q) => (
              <tr key={q.id}>
                <th scope="row" className="part-grid-q">
                  <span className="q-num">{q.number}.</span> <Rich nodes={promptOf(q)} />
                </th>
                {opts.map((o) => {
                  const sel = answerOf(q.id) === o.id;
                  const right = correctOf(q.id)?.includes(o.id);
                  const state = review ? (right ? 'is-correct' : sel ? 'is-wrong' : '') : sel ? 'is-selected' : '';
                  return (
                    <td key={o.id}>
                      <button
                        className={`part-grid-cell ${state}`}
                        role="radio"
                        aria-checked={sel}
                        aria-label={t('reader.questionOption', { n: q.number, option: `${o.id} ${plainText(o.content)}` })}
                        disabled={!!review}
                        onClick={() => pick(q.id, sel ? undefined : o.id)}
                      >
                        <span className={`option-radio ${sel || (review && right) ? 'is-on' : ''}`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <Explanations props={props} qs={qs} />
      </>
    );
  }

  return (
    <div className="part-stack">
      {qs.map((q) => (
        <section key={q.id} className="part-stack-q" aria-label={t('reader.questionN', { n: q.number })}>
          <QuestionPrompt number={q.number}>
            <Rich nodes={promptOf(q)} />
          </QuestionPrompt>
          <OptionList
            options={optionsOf(q)}
            selected={answerOf(q.id)}
            correct={correctOf(q.id)}
            locked={!!review}
            explain={
              review
                ? {
                    text: review.key.answers[q.id]?.explanationZh,
                    block: review.key.answers[q.id]?.evidence?.[0]?.block,
                    quote: review.key.answers[q.id]?.evidence?.[0]?.quote,
                    onLocate: props.onLocate,
                  }
                : undefined
            }
            onSelect={(id) => pick(q.id, id)}
          />
        </section>
      ))}
    </div>
  );
}

/**
 * view "match": people (the questions) on one side, all options on the other, each option used once (KET Listening
 * Part 5, PET Reading Part 2). Tap a person, then an option; an option already given to someone else moves to the
 * new person. The printed example takes its option out of play.
 */
export function MatchBoardView(props: InteractionProps) {
  const { section } = props.fq;
  const qs = section.questions;
  const opts = optionsOf(qs[0]);
  const { pick, answerOf, correctOf } = useAnswers(props);
  const { t } = useTranslation();
  const review = props.review;
  const firstOpen = qs.find((q) => !answerOf(q.id))?.id ?? qs[0].id;
  const [active, setActive] = useState<string | null>(review ? null : firstOpen);
  const ownerOf = (optId: string) => qs.find((q) => answerOf(q.id) === optId);
  const example = section.example;

  const choose = (optId: string) => {
    if (review || !active || optId === example?.answer) return;
    const owner = ownerOf(optId);
    if (owner?.id === active) return pick(active, undefined); // tap again: clear
    if (owner) pick(owner.id, undefined);
    pick(active, optId);
    const next = qs.find((q) => q.id !== active && !answerOf(q.id) && q.id !== owner?.id);
    setActive(next?.id ?? null);
  };

  // long descriptions (PET Reading Part 2: what each person wants): a card per person with a row of letters;
  // the options' full texts are in the left pane
  const long = qs.reduce((n, q) => n + plainText(promptOf(q)).length, 0) / qs.length > 60;
  if (long)
    return (
      <>
        {!review && <p className="hint-line">{t('interaction.matchRowsHint')}</p>}
        <ol className="match-rows">
          {qs.map((q) => {
            const ans = answerOf(q.id);
            const right = correctOf(q.id);
            const ok = review ? right?.includes(ans ?? '') : null;
            const photo = q.image ? props.item.article.images.find((i) => i.id === q.image) : undefined;
            return (
              <li key={q.id} className={`match-row ${photo ? 'has-photo' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}>
                {/* each person's printed photo: a visual anchor while checking back against the texts (#91) */}
                {photo && <img className="match-row-photo" src={staticContent.assetUrl(photo.src)} alt={photo.alt} width={photo.w} height={photo.h} />}
                <p className="match-row-text">
                  <span className="q-num">{q.number}.</span> <Rich nodes={promptOf(q)} />
                </p>
                <div className="match-row-letters" role="radiogroup" aria-label={t('reader.questionN', { n: q.number })}>
                  {opts.map((o) => {
                    const owner = ownerOf(o.id);
                    const mine = ans === o.id;
                    const isRight = review && right?.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        role="radio"
                        aria-checked={mine}
                        aria-label={`${o.id} ${plainText(o.content)}${owner && !mine ? t('interaction.takenBy', { n: owner.number }) : ''}`}
                        className={`match-row-letter ${mine ? 'is-on' : ''} ${owner && !mine ? 'is-used' : ''} ${isRight ? 'is-correct' : review && mine ? 'is-wrong' : ''}`}
                        disabled={!!review || o.id === example?.answer}
                        onClick={() => {
                          if (mine) return pick(q.id, undefined);
                          if (owner) pick(owner.id, undefined);
                          pick(q.id, o.id);
                        }}
                      >
                        {o.id}
                        {owner && !mine && <span className="match-row-owner">{owner.number}</span>}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
        <Explanations props={props} qs={qs} />
      </>
    );

  return (
    <>
      {!review && <p className="hint-line">{t('interaction.matchBoardHint')}</p>}
      <div className="match-board">
        {section.columns && (
          <>
            <p className="match-board-head">{section.columns.left}</p>
            <p className="match-board-head">{section.columns.right}</p>
          </>
        )}
        <ol className="match-board-people" aria-label={t('interaction.questions')}>
          {example && (
            <li className="match-board-person is-example" aria-label={t('interaction.exampleLabel', { prompt: example.prompt, answer: example.answer })}>
              <span className="q-num">0</span>
              <span className="match-board-text">{example.prompt}</span>
              <span className="match-board-badge">{example.answer}</span>
            </li>
          )}
          {qs.map((q) => {
            const ans = answerOf(q.id);
            const right = correctOf(q.id);
            const ok = review ? right?.includes(ans ?? '') : null;
            return (
              <li key={q.id}>
                <button
                  className={`match-board-person ${active === q.id ? 'is-active' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}
                  disabled={!!review}
                  aria-pressed={active === q.id}
                  onClick={() => setActive(q.id)}
                >
                  <span className="q-num">{q.number}</span>
                  <span className="match-board-text">
                    <Rich nodes={promptOf(q)} />
                  </span>
                  <span className={`match-board-badge ${ans ? 'is-filled' : ''}`}>{ans ?? ''}</span>
                  {review && ok === false && <span className="match-board-answer">→ {right?.join('')}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="match-board-options" role="group" aria-label={t('interaction.options')}>
          {opts.map((o) => {
            const isExample = o.id === example?.answer;
            const owner = ownerOf(o.id);
            return (
              <button
                key={o.id}
                className={`match-board-option ${isExample ? 'is-example' : ''} ${owner ? 'is-used' : ''} ${owner && owner.id === active ? 'is-here' : ''}`}
                disabled={!!review || isExample || !active}
                aria-label={`${o.id} ${plainText(o.content)}${isExample ? t('interaction.exampleUsed') : owner ? t('interaction.takenBy', { n: owner.number }) : ''}`}
                onClick={() => choose(o.id)}
              >
                <span className="match-board-letter">{o.id}</span>
                <span className="match-board-text">
                  <Rich nodes={o.content} />
                </span>
                {isExample ? <span className="match-board-used">{t('interaction.exampleMark')}</span> : owner && <span className="match-board-used">{owner.number}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <Explanations props={props} qs={qs} />
    </>
  );
}

/* ------------------------------------------------------------------ table */

/** a dropdown in a table cell (the emoticons of a 表格填空, #127) — tap to open, tap an option; no native <select> */
function CellSelect({
  n,
  options,
  value,
  correct,
  locked,
  onPick,
}: {
  n: number;
  options: Opt[];
  value?: string;
  correct?: string[];
  locked: boolean;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => root.current?.contains(e.target as Node) || setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const chosen = options.find((o) => o.id === value);
  const ok = locked && correct ? correct.includes(value ?? '') : null;
  const right = locked && correct && !ok ? options.find((o) => correct.includes(o.id)) : undefined;
  return (
    <span className="cell-select" ref={root}>
      <button
        className={`cell-select-button ${chosen ? 'is-filled' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('interaction.cellSelect', { n, value: chosen ? plainText(chosen.content) : t('interaction.cellEmpty') })}
        disabled={locked}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cell-num">{n}</span>
        <span className="cell-select-value">{chosen ? <Rich nodes={chosen.content} /> : null}</span>
        {!locked && <ChevronDown />}
      </button>
      {right && (
        <span className="cell-select-correct" aria-label={t('reader.correctAnswer')}>
          <Rich nodes={right.content} />
        </span>
      )}
      {open && (
        <span className="cell-select-menu" role="listbox" aria-label={t('reader.questionN', { n })}>
          {options.map((o) => (
            <button
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              className={`cell-select-item ${o.id === value ? 'is-current' : ''}`}
              onClick={() => {
                setOpen(false);
                onPick(o.id);
              }}
            >
              <Rich nodes={o.content} />
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * view "table" (#127): the section's table as printed, every question answered in its own cell — inlineChoice
 * blanks are dropdowns, extendedText blanks are text boxes. One page in the pager; explanations follow the table.
 */
export function SectionTableView(props: InteractionProps) {
  const { t } = useTranslation();
  const { section } = props.fq;
  const review = props.review;
  const byBlank = new Map(section.questions.flatMap((q) => {
    const it = q.interaction;
    const b = it.kind === 'inlineChoice' ? it.blankId : it.kind === 'extendedText' ? it.blankId : undefined;
    return b ? [[b, q] as const] : [];
  }));
  const set = (qid: string, v: string[] | string | undefined) =>
    props.setResponses((prev) => {
      const next = { ...prev };
      if (v === undefined || v === '') delete next[qid];
      else next[qid] = v;
      return next;
    });
  const renderBlank = (n: BlankNode) => {
    const q = byBlank.get(n.id);
    if (!q) return null;
    const it = q.interaction;
    const r = props.responses[q.id];
    if (it.kind === 'inlineChoice') {
      const k = review?.key.answers[q.id];
      return (
        <CellSelect
          key={n.id}
          n={q.number}
          options={it.options}
          value={Array.isArray(r) ? r[0] : undefined}
          correct={k && 'correct' in k ? k.correct : undefined}
          locked={!!review}
          onPick={(id) => set(q.id, [id])}
        />
      );
    }
    // written cells are marked right / wrong by the AI judge against the reference answer (#127)
    const row = review?.result.byQuestion.find((b) => b.q === q.id);
    const ok = row?.scoredBy === 'judge' ? row.correct : null;
    return (
      <span key={n.id} className={`cell-text ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}>
        <span className="cell-num">
          {q.number} {ok === true ? <Check /> : ok === false ? <Cross /> : null}
        </span>
        <textarea
          className="cell-text-input"
          value={typeof r === 'string' ? r : ''}
          readOnly={!!review}
          rows={3}
          aria-label={t('reader.questionN', { n: q.number })}
          autoCapitalize="sentences"
          onChange={(e) => set(q.id, e.target.value)}
        />
      </span>
    );
  };
  return (
    <>
      <div className="stimulus section-table">
        {(section.stimulus ?? []).map((b) => (
          <Block key={b.id} block={b} renderBlank={renderBlank} />
        ))}
      </div>
      {review && <TableExplanations props={props} />}
    </>
  );
}

/** after submitting: one line per cell — ✓ / ✗ (written cells: the AI judge's verdict), the answer, the explanation */
function TableExplanations({ props }: { props: InteractionProps }) {
  const { t } = useTranslation();
  const review = props.review!;
  return (
    <ul className="part-explain">
      {props.fq.section.questions.map((q) => {
        const k = review.key.answers[q.id];
        const row = review.result.byQuestion.find((b) => b.q === q.id);
        const it = q.interaction;
        let head: ReactNode = null;
        let answer = '';
        if (it.kind === 'inlineChoice' && k && 'correct' in k) {
          head = row?.correct ? <Check /> : <Cross />;
          answer = k.correct.map((id) => plainText(it.options.find((o) => o.id === id)?.content ?? [])).join(' ');
        } else if (k && 'sampleAnswer' in k) {
          head = row?.scoredBy === 'pending' ? t('judge.marking') : row?.scoredBy === 'judge' ? row.correct ? <Check /> : <Cross /> : null;
          answer = k.sampleAnswer;
        }
        const cls = row?.scoredBy === 'pending' || row?.correct === null || row?.correct === undefined ? '' : row.correct ? 'is-correct' : 'is-wrong';
        const j = row?.judgement;
        return (
          <li key={q.id} className={cls}>
            <b>
              {q.number}. {head}
            </b>{' '}
            <span className="part-explain-q">{plainText(it.kind === 'inlineChoice' ? (it.prompt ?? []) : it.kind === 'extendedText' ? it.prompt : [])}</span>
            <br />
            <span className="explain-label">{it.kind === 'inlineChoice' ? t('reader.correctAnswer') : t('reader.sampleAnswer')}</span> {answer}
            {j?.feedbackZh && <span className="part-explain-feedback">{j.feedbackZh}</span>}
            {k?.explanationZh && <> {k.explanationZh}</>}
            {k?.evidence?.[0] && props.onLocate && (
              <button className="chip part-explain-locate" onClick={() => props.onLocate!(k.evidence![0].block, k.evidence![0].quote)}>
                <Locate /> {t('reader.locate')}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
