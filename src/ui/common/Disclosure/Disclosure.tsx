import type { ReactNode } from 'react';
import './Disclosure.css';

export type DisclosureTone = 'neutral' | 'tip';

/**
 * RC/Common/Disclosure (proposed, issue #138; Figma: RC · Proposed): a collapsible panel on a native
 * <details> / <summary> (keyboard and tap work without script) — the listening transcript after submitting.
 * Variants: Tone neutral (divider above, the transcript) / tip (名师点拨 look; vocab still renders rc/Vocab/TipBox);
 * Open no / yes (`defaultOpen`, the learner can toggle it).
 * `className` keeps legacy hooks: the transcript passes `transcript` (e2e/ket.spec.ts).
 */
export function Disclosure({
  summary,
  tone = 'neutral',
  defaultOpen = false,
  className = '',
  children,
}: {
  summary: ReactNode;
  tone?: DisclosureTone;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={['ur-disclosure', `is-${tone}`, className].filter(Boolean).join(' ')} open={defaultOpen}>
      <summary className="ur-disclosure-summary">{summary}</summary>
      {children}
    </details>
  );
}
