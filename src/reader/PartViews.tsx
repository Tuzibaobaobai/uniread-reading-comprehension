import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InlineT, QuestionT } from '@schema';
import { Rich, plainText } from '@/components/Rich';
import { Locate } from '@/components/Icons';
import { staticContent } from '@/lib/content';
import { Chip } from '@/ui/common/Chip/Chip';
import { HintText } from '@/ui/common/HintText/HintText';
import { AnswerFeedback, AnswerFeedbackList } from '@/ui/quiz/AnswerFeedback/AnswerFeedback';
import { ChoiceGrid, ChoiceGridCell, ChoiceGridRow } from '@/ui/exam/ChoiceGrid/ChoiceGrid';
import { MatchBoard, MatchBoardOption, MatchBoardPerson } from '@/ui/exam/MatchBoard/MatchBoard';
import { MatchRow, MatchRowLetter, MatchRows } from '@/ui/exam/MatchRow/MatchRow';
import { QuestionStack, QuestionStackItem } from '@/ui/exam/QuestionStack/QuestionStack';
import { OptionList, QuestionPrompt, type InteractionProps } from './interactions';

/*
 * Exam Parts answered on one page (section.view, GitHub #82 #86 #87). Every question keeps its own id, response
 * ([optionId]) and key — only the presentation changes. Built from src/ui: rc/Exam/QuestionStack, rc/Exam/ChoiceGrid,
 * rc/Exam/MatchBoard, rc/Exam/MatchRow, and rc/Quiz/AnswerFeedback (Size compact) for the explanations.
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

/** after submitting: each question's explanation (Chinese), in order — rc/Quiz/AnswerFeedback Size compact */
function Explanations({ props, qs }: { props: InteractionProps; qs: QuestionT[] }) {
  const { correctOf, answerOf } = useAnswers(props);
  const { t } = useTranslation();
  if (!props.review) return null;
  return (
    <AnswerFeedbackList>
      {qs.map((q) => {
        const k = props.review!.key.answers[q.id];
        const ok = correctOf(q.id)?.includes(answerOf(q.id) ?? '');
        const ev = k?.evidence?.[0];
        return (
          <AnswerFeedback
            key={q.id}
            as="li"
            variant="block"
            size="compact"
            result={ok ? 'correct' : 'wrong'}
            label={`${q.number}.`}
            answer={correctOf(q.id)?.join('') ?? ''}
            action={
              ev && props.onLocate ? (
                <Chip className="part-explain-locate" icon={<Locate />} onClick={() => props.onLocate!(ev.block, ev.quote)}>
                  {t('reader.locate')}
                </Chip>
              ) : undefined
            }
          >
            {k?.explanationZh}
          </AnswerFeedback>
        );
      })}
    </AnswerFeedbackList>
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
        <ChoiceGrid columns={opts.map((o) => ({ id: o.id, label: <Rich nodes={o.content} /> }))}>
          {qs.map((q) => (
            <ChoiceGridRow
              key={q.id}
              head={
                <>
                  <span className="q-num">{q.number}.</span> <Rich nodes={promptOf(q)} />
                </>
              }
            >
              {opts.map((o) => {
                const sel = answerOf(q.id) === o.id;
                const right = correctOf(q.id)?.includes(o.id);
                return (
                  <ChoiceGridCell
                    key={o.id}
                    selected={sel}
                    checked={sel || !!(review && right)}
                    result={review ? (right ? 'correct' : sel ? 'wrong' : 'none') : sel ? 'selected' : 'none'}
                    ariaLabel={t('reader.questionOption', { n: q.number, option: `${o.id} ${plainText(o.content)}` })}
                    disabled={!!review}
                    onClick={() => pick(q.id, sel ? undefined : o.id)}
                  />
                );
              })}
            </ChoiceGridRow>
          ))}
        </ChoiceGrid>
        <Explanations props={props} qs={qs} />
      </>
    );
  }

  return (
    <QuestionStack density="compact">
      {qs.map((q) => (
        <QuestionStackItem key={q.id} label={t('reader.questionN', { n: q.number })}>
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
        </QuestionStackItem>
      ))}
    </QuestionStack>
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
        {!review && <HintText>{t('interaction.matchRowsHint')}</HintText>}
        <MatchRows>
          {qs.map((q) => {
            const ans = answerOf(q.id);
            const right = correctOf(q.id);
            const ok = review ? right?.includes(ans ?? '') : null;
            const photo = q.image ? props.item.article.images.find((i) => i.id === q.image) : undefined;
            return (
              <MatchRow
                key={q.id}
                number={q.number}
                photo={photo && { src: staticContent.assetUrl(photo.src), alt: photo.alt, width: photo.w, height: photo.h }}
                result={ok === true ? 'correct' : ok === false ? 'wrong' : 'none'}
                lettersLabel={t('reader.questionN', { n: q.number })}
                letters={opts.map((o) => {
                  const owner = ownerOf(o.id);
                  const mine = ans === o.id;
                  const isRight = review && right?.includes(o.id);
                  return (
                    <MatchRowLetter
                      key={o.id}
                      letter={o.id}
                      state={mine ? 'on' : owner ? 'used' : 'off'}
                      result={isRight ? 'correct' : review && mine ? 'wrong' : 'none'}
                      owner={owner?.number}
                      ariaLabel={`${o.id} ${plainText(o.content)}${owner && !mine ? t('interaction.takenBy', { n: owner.number }) : ''}`}
                      disabled={!!review || o.id === example?.answer}
                      onClick={() => {
                        if (mine) return pick(q.id, undefined);
                        if (owner) pick(owner.id, undefined);
                        pick(q.id, o.id);
                      }}
                    />
                  );
                })}
              >
                <Rich nodes={promptOf(q)} />
              </MatchRow>
            );
          })}
        </MatchRows>
        <Explanations props={props} qs={qs} />
      </>
    );

  return (
    <>
      {!review && <HintText>{t('interaction.matchBoardHint')}</HintText>}
      <MatchBoard
        columns={section.columns}
        peopleLabel={t('interaction.questions')}
        optionsLabel={t('interaction.options')}
        people={
          <>
            {example && (
              <MatchBoardPerson example number={0} answer={example.answer} ariaLabel={t('interaction.exampleLabel', { prompt: example.prompt, answer: example.answer })}>
                {example.prompt}
              </MatchBoardPerson>
            )}
            {qs.map((q) => {
              const ans = answerOf(q.id);
              const right = correctOf(q.id);
              const ok = review ? right?.includes(ans ?? '') : null;
              return (
                <MatchBoardPerson
                  key={q.id}
                  number={q.number}
                  answer={ans}
                  active={active === q.id}
                  result={ok === true ? 'correct' : ok === false ? 'wrong' : 'none'}
                  rightAnswer={right?.join('')}
                  disabled={!!review}
                  onClick={() => setActive(q.id)}
                >
                  <Rich nodes={promptOf(q)} />
                </MatchBoardPerson>
              );
            })}
          </>
        }
        options={opts.map((o) => {
          const isExample = o.id === example?.answer;
          const owner = ownerOf(o.id);
          return (
            <MatchBoardOption
              key={o.id}
              letter={o.id}
              example={isExample}
              used={!!owner}
              here={!!owner && owner.id === active}
              mark={isExample ? t('interaction.exampleMark') : owner?.number}
              disabled={!!review || isExample || !active}
              ariaLabel={`${o.id} ${plainText(o.content)}${isExample ? t('interaction.exampleUsed') : owner ? t('interaction.takenBy', { n: owner.number }) : ''}`}
              onClick={() => choose(o.id)}
            >
              <Rich nodes={o.content} />
            </MatchBoardOption>
          );
        })}
      />
      <Explanations props={props} qs={qs} />
    </>
  );
}
