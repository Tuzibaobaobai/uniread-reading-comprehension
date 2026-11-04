import type { ButtonHTMLAttributes } from 'react';
import './CloseButton.css';

/**
 * ui/CloseButton — UniRead UIKit-LearnNav · btn-close (7870:43771), reused (design-system/components.registry.json
 * `ui/CloseButton`). The × in a dialog's top right corner (rc/Common/Dialog Close=yes). `label` is the aria-label;
 * keeps the legacy class `.dialog-close`.
 */
export function CloseButton({ label, className = '', ...rest }: { label: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" className={['dialog-close', className].filter(Boolean).join(' ')} aria-label={label} {...rest}>
      ×
    </button>
  );
}
