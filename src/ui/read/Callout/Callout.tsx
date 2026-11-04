import type { HTMLAttributes, ReactNode } from 'react';
import './Callout.css';

export type CalloutSide = 'left' | 'right';

/**
 * RC/Read/Callout (proposed, issue #138; Figma: RC · Proposed): a handwritten note on a printed text (PET Writing
 * Part 1), inline in the text. Variants: Side left (tilted left, the default and the only one the content uses) /
 * right. `label` is the accessible name (role note). Keeps the legacy class `rt-callout` (e2e/pet.spec.ts).
 */
export function Callout({ side = 'left', label, children, className = '', ...rest }: { side?: CalloutSide; label: string; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={['rt-callout', `is-${side}`, className].filter(Boolean).join(' ')} role="note" aria-label={label} {...rest}>
      {children}
    </span>
  );
}
