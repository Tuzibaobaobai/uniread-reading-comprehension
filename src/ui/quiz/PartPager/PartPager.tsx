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
 * 标记本题), Tone default / pending (the unanswered numbers in the submit confirmation: brand-soft, no bar).
 * `reviewing` with Result none = submitted but not scored (greyed, no bar).
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
  reviewing?: boolean;
  flagged?: boolean;
  tone?: PagerTone;
  layout?: 'part' | 'question';
  ariaLabel: string;
  onClick: () => void;
}) {
  const pending = tone === 'pending';
  const state = pending ? 'is-pending' : result !== 'none' ? `is-${result}` : reviewing ? 'is-neutral' : completed ? 'is-answered' : '';
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
      {result !== 'none' && !pending ? (
        <img className="question-dot-icon" src={result === 'correct' ? correctIcon : wrongIcon} alt="" />
      ) : (
        <>
          <span className={`question-dot-num${labelKind === 'range' ? ' is-range' : ''}`}>{label}</span>
          {!reviewing && !pending && <span className="question-dot-mark" aria-hidden />}
        </>
      )}
    </button>
  );
}
