import type { ButtonHTMLAttributes } from 'react';
import './QuizButton.css';

/**
 * UniRead UIKit-Quiz · button (Next 7870:49853 / Submit 6433:39508), reused (`ui/QuizButton`).
 * variant primary = Submit (brand fill); default = Next (outline). Disabled → the Figma Disabled=yes variant.
 */
export function QuizButton({ variant = 'default', dim = false, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary'; dim?: boolean }) {
  return <button type="button" {...rest} className={['pill-button', variant === 'primary' ? 'primary' : '', dim ? 'is-dim' : '', className].filter(Boolean).join(' ')} />;
}
