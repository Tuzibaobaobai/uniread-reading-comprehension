import type { HTMLAttributes, ReactNode } from 'react';
import './HintText.css';

/**
 * RC/Common/HintText (proposed): the small grey line under a question prompt (gap hint, match progress, 计分说明).
 * Keeps the legacy class `hint-line`.
 */
export function HintText({ className = '', children, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={['hint-line', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </p>
  );
}
