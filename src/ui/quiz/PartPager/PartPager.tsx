import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import './PartPager.css';

export type PartResult = 'none' | 'correct' | 'wrong';
export type PagerLabel = 'number' | 'range';
export type PagerTone = 'default' | 'pending';

/**
 * ui/PartPager — extends UniRead UIKit-Quiz `page number` (6346:85439; proposal RC · Proposed 19448:750): one number
 * of the question strip. Variants: Kicker (BOOLEAN + text "P1": the first number of a Part carries the Part's label
 * and, after the first Part, a divider — left out on one-question-a-page strips except at a Part start), Label
 * number / range (text "6" or "1–5"), Selected no / yes, Completed no / yes (the bar under the number), Result none /
 * correct / wrong (after submitting, the quiz result icon 7870:51523 replaces the number), Flagged no / yes (真题
 * 标记本题), Tone default / pending (the unanswered numbers in the submit confirmation, 1.04 19483:3986: 22 bold over a grey bar).
 * `reviewing` with Result none = submitted but not scored (greyed, no bar).
 * Score (text, #128): after submitting, a page marked with points or several questions shows the mark instead of an
 * icon — score / full marks for judged answers ("18/20": writing, speaking, written cells), right / total for an
 * objective Part on one page ("3/5"). Every scored question type uses this, never a ✓ / ✗ icon.
 * Layout `part` (default) = one Part a page (词汇天天练: always a kicker, the range label, the wider pager of this
 * card); `question` = one question a page (时文阅读 / 真题).
 */
export function PartPager({
  kicker,
  label,
  labelKind = 'range',
  selected = false,
  completed = false,
  result = 'none',
  score,
  reviewing = false,
  flagged = false,
  tone = 'default',
  layout = 'part',
  ariaLabel,
  onClick,
}: {
  kicker?: string;
  label: string;
  labelKind?: PagerLabel;
  selected?: boolean;
  completed?: boolean;
  result?: PartResult;
  /** Score: the mark shown instead of the result icon ("18/20", "3/5") */
  score?: string;
  reviewing?: boolean;
  flagged?: boolean;
  tone?: PagerTone;
  layout?: 'part' | 'question';
  ariaLabel: string;
  onClick: () => void;
}) {
  const pending = tone === 'pending';
  const state = pending ? 'is-pending' : score && !pending ? 'is-score' : result !== 'none' ? `is-${result}` : reviewing ? 'is-neutral' : completed ? 'is-answered' : '';
  const cls = [
    'question-dot',
    kicker ? 'part-start' : '',
    layout === 'part' ? 'part-pager' : '',
    selected ? 'is-current' : '',
    state,
    flagged ? 'is-flagged' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} data-part={kicker} onClick={onClick} aria-current={pending ? undefined : selected} aria-label={ariaLabel}>
      {score && !pending ? (
        <span className="question-dot-num is-score">{score}</span>
      ) : result !== 'none' && !pending ? (
        <img className="question-dot-icon" src={result === 'correct' ? correctIcon : wrongIcon} alt="" />
      ) : (
        <>
          <span className={`question-dot-num${labelKind === 'range' ? ' is-range' : ''}`}>{label}</span>
          {!reviewing && <span className="question-dot-mark" aria-hidden />}
        </>
      )}
    </button>
  );
}
