import type { ReactNode } from 'react';
import { Check, Cross } from '@/components/Icons';
import './AnswerFeedback.css';

export type FeedbackResult = 'none' | 'correct' | 'wrong' | 'partial';

/**
 * RC/Quiz/AnswerFeedback (proposed, Figma RC · Proposed 19446:804): the review box under a question — the right answer
 * (or reference translations), the points, then the judge verdict / explanation / 查看词条 as children.
 * Variant Result correct / wrong / partial (+ none while a verdict is pending or not scored).
 */
export function AnswerFeedback({
  result,
  label,
  answer,
  score,
  children,
}: {
  result: FeedbackResult;
  label: string;
  answer: string;
  score?: { correct: boolean; text: string };
  children?: ReactNode;
}) {
  return (
    <div className={`vq-review ${result === 'none' ? '' : `is-${result}`}`}>
      <p className="vq-answer">
        <span className="explain-label">{label}</span>
        <span lang="en">{answer}</span>
        {score && (
          <span className="vq-points">
            {score.correct ? <Check /> : <Cross />} {score.text}
          </span>
        )}
      </p>
      {children}
    </div>
  );
}

/** an explanation line inside AnswerFeedback */
export function AnswerExplain({ children }: { children: ReactNode }) {
  return <p className="vq-explain">{children}</p>;
}
