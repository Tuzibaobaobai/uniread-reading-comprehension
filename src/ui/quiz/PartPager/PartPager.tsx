import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import './PartPager.css';

export type PartResult = 'none' | 'correct' | 'wrong';

/**
 * ui/PartPager — extends UniRead UIKit-Quiz `page number` (6346:85439; proposal RC · Proposed 19448:750): one Part of a
 * one-Part-a-page quiz in the question strip. Variants: Kicker (text, "P1"), Label (text, the question range "1–5"),
 * Selected no / yes, Completed no / yes (the bar under the range), Result none / correct / wrong (after submitting, the
 * quiz result icon 7870:51523 replaces the range). `reviewing` with Result none = submitted but not all scored (greyed,
 * no bar). Sizes for the strip come from the shared .question-dot (app.css); this card's wider strip is set here.
 */
export function PartPager({
  kicker,
  label,
  selected,
  completed,
  result = 'none',
  reviewing = false,
  ariaLabel,
  onClick,
}: {
  kicker: string;
  label: string;
  selected: boolean;
  completed: boolean;
  result?: PartResult;
  reviewing?: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  const state = result !== 'none' ? `is-${result}` : reviewing ? 'is-neutral' : completed ? 'is-answered' : '';
  return (
    <button className={`question-dot part-start part-pager ${selected ? 'is-current' : ''} ${state}`} data-part={kicker} onClick={onClick} aria-current={selected} aria-label={ariaLabel}>
      {result !== 'none' ? (
        <img className="question-dot-icon" src={result === 'correct' ? correctIcon : wrongIcon} alt="" />
      ) : (
        <>
          <span className="question-dot-num is-range">{label}</span>
          {!reviewing && <span className="question-dot-mark" aria-hidden />}
        </>
      )}
    </button>
  );
}
