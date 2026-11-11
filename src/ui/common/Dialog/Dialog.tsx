import { useId, useRef, type ReactNode } from 'react';
import { CloseButton } from '@/ui/CloseButton/CloseButton';
import { useModal } from './useModal';
import './Dialog.css';

export type DialogSize = 's' | 'm' | 'l';

/**
 * RC/Common/Dialog (proposed; the designer's Ready-for-dev frames 2.02 / 2.05 / 2.11 / 2.12, Figma 真题 19802:131628):
 * backdrop + card (radius xl, padding 32, a 12 gap between title, body and content) + actions. Variants: Size s 480 /
 * m 560 / l 900; Close no / yes (UniRead `dialog close` 11777:76962 — ui/CloseButton, a dimmed 48 circle just outside
 * the top right corner); Actions none / one / two (ui/QuizButton, 200 × 56). A dialog taller than the screen scrolls
 * its title and content (`.dialog-body`) and keeps the actions in view. Clicking the backdrop or the close button calls
 * onClose, and so does Esc; the dialog is modal for keyboard and screen-reader users (useModal). Keeps the legacy classes (.dialog-backdrop, .dialog, .dialog-close, .dialog-actions).
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
  const ref = useRef<HTMLDivElement>(null);
  useModal(ref, onClose);
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={ref}
        className={['dialog', `is-${size}`, closeLabel ? 'has-close' : '', className].filter(Boolean).join(' ')}
        role={role}
        aria-modal
        aria-labelledby={title ? id : undefined}
        aria-label={title ? undefined : label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-body thin-scroll">
          {title && <h2 id={id}>{title}</h2>}
          {children}
        </div>
        {actions && <div className="dialog-actions">{actions}</div>}
        {closeLabel && <CloseButton label={closeLabel} onClick={onClose} />}
      </div>
    </div>
  );
}
