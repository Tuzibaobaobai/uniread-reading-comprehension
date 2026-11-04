import type { ReactNode } from 'react';
import { Check, Cross } from '@/components/Icons';
import './AnswerFeedback.css';

export type FeedbackResult = 'none' | 'correct' | 'wrong' | 'partial';
/** row = the vocab quiz row (compact, grey until scored); block = the 时文 / 真题 review box under a question */
export type FeedbackVariant = 'row' | 'block';

/**
 * RC/Quiz/AnswerFeedback (proposed, Figma RC · Proposed 19446:804): the review box under a question — the right answer
 * (or reference translations / a sample answer), the points, then the judge verdict / explanation / 查看词条 as children.
 * Variants: Result correct / wrong / partial (+ none while a verdict is pending or not scored); Head no / yes (icon +
 * 正确 / 错误 / 得 x/y 分, `head` text); Action (BOOLEAN — the 定位原文 chip, `action`); `variant` row (词汇天天练,
 * classes .vq-review / .vq-answer) or block (时文阅读 / 真题, classes .explain / .explain-head / .explain-answer that the
 * e2e tests select).
 */
export function AnswerFeedback({
  result,
  label,
  answer,
  score,
  head,
  action,
  variant = 'row',
  className = '',
  children,
}: {
  result: FeedbackResult;
  label: string;
  answer: string;
  score?: { correct: boolean; text: string };
  /** Head = yes: the verdict line (the icon follows Result) */
  head?: string;
  /** Action: e.g. the 定位原文 chip, after the explanation */
  action?: ReactNode;
  variant?: FeedbackVariant;
  className?: string;
  children?: ReactNode;
}) {
  const block = variant === 'block';
  const state = result === 'none' ? '' : `is-${result}`;
  return (
    <div className={[block ? 'explain' : 'vq-review', state, className].filter(Boolean).join(' ')}>
      {head && (
        <div className="explain-head">
          {result === 'correct' ? <Check /> : result === 'wrong' || result === 'partial' ? <Cross /> : null} {head}
        </div>
      )}
      <p className={block ? 'explain-answer' : 'vq-answer'}>
        <span className="explain-label">{label}</span>
        {block ? answer : <span lang="en">{answer}</span>}
        {score && (
          <span className="vq-points">
            {score.correct ? <Check /> : <Cross />} {score.text}
          </span>
        )}
      </p>
      {children}
      {action}
    </div>
  );
}

/** an explanation line inside AnswerFeedback; in the block variant a `tip` line is one size smaller */
export function AnswerExplain({ variant = 'row', tip = false, children }: { variant?: FeedbackVariant; tip?: boolean; children: ReactNode }) {
  if (variant === 'block') return <p className={tip ? 'explain-text explain-tip' : 'explain-text'}>{children}</p>;
  return <p className="vq-explain">{children}</p>;
}
