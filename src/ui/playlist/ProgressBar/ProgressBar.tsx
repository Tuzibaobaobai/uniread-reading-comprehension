import './ProgressBar.css';

/**
 * ui/ProgressBar — reuses UniRead UIKit-Playlist `progress` (10539:77875, #138): the thin completion bar under a
 * playlist item. `value` 0–1. Keeps role="progressbar" and the caller's class (`.item-row-progress`).
 */
export function ProgressBar({ value, label, className = '' }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(value, 1));
  return (
    <span
      className={['ur-progress', className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(v * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${v * 100}%` }} />
    </span>
  );
}
