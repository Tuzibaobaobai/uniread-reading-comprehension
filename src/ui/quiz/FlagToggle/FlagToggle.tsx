import pin from '@/assets/icons/flag-pin.svg';
import './FlagToggle.css';

/**
 * ui/quiz/FlagToggle — designer component `flag-toggle` (Figma 19834:178047, frame 2.03): 真题 exam mode 标记本题, at the
 * right of the question's title. Variant 标记 no: a 40 × 32 pill with the pin only; yes: pin + 已标记. A toggle
 * (aria-pressed); the visible pill is 32 high, the tap target 44.
 */
export function FlagToggle({ flagged, label, flaggedLabel, onToggle }: { flagged: boolean; label: string; flaggedLabel: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`flag-toggle ${flagged ? 'is-flagged' : ''}`}
      aria-pressed={flagged}
      aria-label={flagged ? undefined : label}
      onClick={onToggle}
    >
      <img src={pin} alt="" />
      {flagged && <span>{flaggedLabel}</span>}
    </button>
  );
}
