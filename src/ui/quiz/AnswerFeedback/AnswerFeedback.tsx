import type { ReactNode } from 'react';
import { Check, Cross } from '@/components/Icons';
import './AnswerFeedback.css';

export type FeedbackResult = 'none' | 'correct' | 'wrong' | 'partial';
/** row = the vocab quiz row (compact, grey until scored); block = the 时文 / 真题 review box under a question */
export type FeedbackVariant = 'row' | 'block';
/** Size compact (block only): one line per question in the explanation list after a whole exam Part (.part-explain) */
export type FeedbackSize = 'default' | 'compact';

const ResultIcon = ({ result }: { result: FeedbackResult }) => (result === 'correct' ? <Check /> : result === 'wrong' || result === 'partial' ? <Cross /> : null);

/**
 * RC/Quiz/AnswerFeedback (proposed, Figma RC · Proposed 19446:804): the review box under a question — the right answer
 * (or reference translations / a sample answer), the points, then the judge verdict / explanation / 查看词条 as children.
 * Variants: Result correct / wrong / partial (+ none while a verdict is pending or not scored); Head no / yes (icon +
 * 正确 / 错误 / 得 x/y 分, `head` text); Action (BOOLEAN — the 定位原文 chip, `action`); `variant` row (词汇天天练,
 * classes .vq-review / .vq-answer) or block (时文阅读 / 真题, classes .explain / .explain-head / .explain-answer that the
 * e2e tests select); Size default / compact (new — block only: "6. ✓ F" + explanation + action on one tinted line, as an
 * `li` inside AnswerFeedbackList, the 真题 per-Part explanations).
 */
export function AnswerFeedback({
  result,
  label,
  answer,
  score,
  head,
  action,
  variant = 'row',
  size = 'default',
  as: Tag = 'div',
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
  size?: FeedbackSize;
  /** the element; `li` inside AnswerFeedbackList */
  as?: 'div' | 'li';
  className?: string;
  children?: ReactNode;
}) {
  const block = variant === 'block';
  const state = result === 'none' ? '' : `is-${result}`;
  if (block && size === 'compact')
    return (
      <Tag className={['explain', 'is-compact', state, className].filter(Boolean).join(' ')}>
        <p className="explain-compact-line">
          <b>
            {label} <ResultIcon result={result} /> {answer}
          </b>{' '}
          {children}
        </p>
        {action}
      </Tag>
    );
  return (
    <Tag className={[block ? 'explain' : 'vq-review', state, className].filter(Boolean).join(' ')}>
      {head && (
        <div className="explain-head">
          <ResultIcon result={result} /> {head}
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
    </Tag>
  );
}

/** Size compact: the list of compact AnswerFeedback items after a whole exam Part; keeps the class `part-explain` */
export function AnswerFeedbackList({ children }: { children: ReactNode }) {
  return <ul className="part-explain">{children}</ul>;
}

/** an explanation line inside AnswerFeedback; in the block variant a `tip` line is one size smaller */
export function AnswerExplain({ variant = 'row', tip = false, children }: { variant?: FeedbackVariant; tip?: boolean; children: ReactNode }) {
  if (variant === 'block') return <p className={tip ? 'explain-text explain-tip' : 'explain-text'}>{children}</p>;
  return <p className="vq-explain">{children}</p>;
}
