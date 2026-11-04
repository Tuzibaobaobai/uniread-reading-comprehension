import leftIcon from '@/assets/icons/scan-arrow-left.svg';
import rightIcon from '@/assets/icons/scan-arrow-right.svg';
import './ArrowButton.css';

/**
 * ui/ArrowButton — UniRead `previous` / `next` (Figma RC · Screens · DS-2026-11-03, section 词汇 · 速览（Scan）
 * 19528:124853 / 19528:124860, drawn by the UniRead designer; Ready for dev): the tall side buttons of the 速览 card.
 * Variants State Default / Hover (CSS) × Disabled no / yes — a disabled arrow is not shown (opacity 0) and cannot be used.
 */
export function ArrowButton({ direction, label, disabled = false, onClick }: { direction: 'prev' | 'next'; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="scan-nav" disabled={disabled} onClick={onClick} aria-label={label}>
      <img src={direction === 'prev' ? leftIcon : rightIcon} alt="" />
    </button>
  );
}
