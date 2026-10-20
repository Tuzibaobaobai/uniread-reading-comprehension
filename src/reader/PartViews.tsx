import { useState } from 'react';
import type { InlineT, QuestionT } from '@schema';
import { Rich, plainText } from '@/components/Rich';
import { Check, Cross } from '@/components/Icons';
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
                        aria-label={`第 ${q.number} 题：${o.id} ${plainText(o.content)}`}
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
        <section key={q.id} className="part-stack-q" aria-label={`第 ${q.number} 题`}>
          <QuestionPrompt number={q.number}>
            <Rich nodes={promptOf(q)} />
          </QuestionPrompt>
          <OptionList
            options={optionsOf(q)}
            selected={answerOf(q.id)}
            correct={correctOf(q.id)}
            locked={!!review}
            explain={review ? { text: review.key.answers[q.id]?.explanationZh } : undefined}
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
        {!review && <p className="hint-line">为每个人选一个字母；每个字母只能用一次，再点一次可取消。</p>}
        <ol className="match-rows">
          {qs.map((q) => {
            const ans = answerOf(q.id);
            const right = correctOf(q.id);
            const ok = review ? right?.includes(ans ?? '') : null;
            return (
              <li key={q.id} className={`match-row ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}>
                <p className="match-row-text">
                  <span className="q-num">{q.number}.</span> <Rich nodes={promptOf(q)} />
                </p>
                <div className="match-row-letters" role="radiogroup" aria-label={`第 ${q.number} 题`}>
                  {opts.map((o) => {
                    const owner = ownerOf(o.id);
                    const mine = ans === o.id;
                    const isRight = review && right?.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        role="radio"
                        aria-checked={mine}
                        aria-label={`${o.id} ${plainText(o.content)}${owner && !mine ? `（第 ${owner.number} 题已选）` : ''}`}
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
      {!review && <p className="hint-line">先点左边的人，再点右边的选项；每个选项只能用一次，再点一次可取消。</p>}
      <div className="match-board">
        <ol className="match-board-people" aria-label="题目">
          {example && (
            <li className="match-board-person is-example" aria-label={`例题：${example.prompt} — ${example.answer}`}>
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
        <div className="match-board-options" role="group" aria-label="选项">
          {opts.map((o) => {
            const isExample = o.id === example?.answer;
            const owner = ownerOf(o.id);
            return (
              <button
                key={o.id}
                className={`match-board-option ${isExample ? 'is-example' : ''} ${owner ? 'is-used' : ''} ${owner && owner.id === active ? 'is-here' : ''}`}
                disabled={!!review || isExample || !active}
                aria-label={`${o.id} ${plainText(o.content)}${isExample ? '（例题已用）' : owner ? `（第 ${owner.number} 题已选）` : ''}`}
                onClick={() => choose(o.id)}
              >
                <span className="match-board-letter">{o.id}</span>
                <span className="match-board-text">
                  <Rich nodes={o.content} />
                </span>
                {isExample ? <span className="match-board-used">例</span> : owner && <span className="match-board-used">{owner.number}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <Explanations props={props} qs={qs} />
    </>
  );
}
