import type { ButtonHTMLAttributes } from 'react';
import './LinkButton.css';

/**
 * ui/LinkButton — UniRead UIKit-Notes · link (10817:60790), reused (`ui/LinkButton`): a button that reads as a link
 * inside a sentence (成绩报告「换算表」). Usable as an i18next <Trans> component (children come from the translation).
 * Keeps the legacy class `.link-button`.
 */
export function LinkButton({ className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={['link-button', className].filter(Boolean).join(' ')} {...rest} />;
}
