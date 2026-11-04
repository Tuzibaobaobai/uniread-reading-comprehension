import { useId, type ReactNode } from 'react';
import './Dialog.css';

export type DialogSize = 's' | 'm' | 'l';

/**
 * RC/Common/Dialog (proposed): backdrop + card + title + body + actions. Variants: Size s 480 / m 560 / l 720;
 * Close no / yes (UIKit-LearnNav btn-close); Actions none / one / two (ui/QuizButton). Clicking the backdrop or the
 * close button calls onClose. Keeps the legacy classes (.dialog-backdrop, .dialog, .dialog-close, .dialog-actions).
 */
export function Dialog({
  title,
  label,
  size = 's',
  onClose,
  closeLabel,
  actions,
  className = '',
  role = 'dialog',
  children,
}: {
  title?: ReactNode;
  /** aria-label when there is no visible title */
  label?: string;
  size?: DialogSize;
  onClose: () => void;
  /** shows the × button when given */
  closeLabel?: string;
  actions?: ReactNode;
  className?: string;
  role?: 'dialog' | 'alertdialog';
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className={['dialog', `is-${size}`, className].filter(Boolean).join(' ')}
        role={role}
        aria-modal
        aria-labelledby={title ? id : undefined}
        aria-label={title ? undefined : label}
        onClick={(e) => e.stopPropagation()}
      >
        {closeLabel && (
          <button className="dialog-close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        )}
        {title && <h2 id={id}>{title}</h2>}
        {children}
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}
