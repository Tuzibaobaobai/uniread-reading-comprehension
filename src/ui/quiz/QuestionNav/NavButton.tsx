import leftIcon from '@/assets/icons/scan-arrow-left.svg';
import rightIcon from '@/assets/icons/scan-arrow-right.svg';
import { Check, Retry } from '@/components/Icons';
import './NavButton.css';

/** the right-hand button of a quiz footer */
export interface NavAction {
  /** next: arrow · submit: brand circle with ✓ · retry: white circle (review, last question: 重新作答) */
  kind: 'next' | 'submit' | 'retry';
  label: string;
  /** submit while questions are left: drawn at 20%, still tappable (→ the confirmation) */
  dim?: boolean;
  disabled?: boolean;
  /** numbers hidden on this side of the strip ("+N" under the arrow) */
  more?: number;
  onClick: () => void;
}

/**
 * The 56 × 80 round buttons at both ends of the quiz footer — designer components `question-nav` (19802:13269, 时文)
 * and `question-nav-part` (19706:145652, 真题 / 词汇): previous / next (arrow, with "+N" under it when the strip hides N
 * numbers on that side), submit (brand, ✓ + 提交) and, RC only, retry (重新作答 after submitting). Effect style btn-s.
 */
export function NavArrow({ dir, label, disabled, more, onClick }: { dir: 'prev' | 'next'; label: string; disabled?: boolean; more?: number; onClick: () => void }) {
  return (
    <button type="button" className={`part-arrow nav-arrow-${dir}`} aria-label={label} disabled={disabled} onClick={onClick}>
      <img src={dir === 'prev' ? leftIcon : rightIcon} alt="" />
      {!!more && (
        <span className="part-arrow-more" aria-hidden>
          +{more}
        </span>
      )}
    </button>
  );
}

export function NavActionButton({ kind, label, dim, disabled, more, onClick }: NavAction) {
  if (kind === 'next') return <NavArrow dir="next" label={label} disabled={disabled} more={more} onClick={onClick} />;
  return (
    <button type="button" className={`part-arrow is-${kind === 'submit' ? 'primary' : 'retry'} ${dim ? 'is-dim' : ''}`} disabled={disabled} onClick={onClick}>
      {kind === 'submit' ? <Check /> : <Retry />}
      <span>{label}</span>
    </button>
  );
}
