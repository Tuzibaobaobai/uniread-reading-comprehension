import type { ButtonHTMLAttributes } from 'react';
import './CloseButton.css';

/**
 * ui/CloseButton — UniRead `dialog close` (11777:76962), reused (design-system/components.registry.json `ui/CloseButton`;
 * the designer's Ready-for-dev frames 2.02 / 2.05 / 2.11 / 2.12): a dimmed 48 circle with a light ×, 16 outside the
 * top right corner of rc/Common/Dialog (Close=yes), inside the corner below 1024px. `label` is the aria-label; keeps
 * the legacy class `.dialog-close`.
 */
export function CloseButton({ label, className = '', ...rest }: { label: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" className={['dialog-close', className].filter(Boolean).join(' ')} aria-label={label} {...rest}>
      <svg viewBox="0 0 48 48" aria-hidden fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 18L18 30M18 18l12 12" />
      </svg>
    </button>
  );
}
