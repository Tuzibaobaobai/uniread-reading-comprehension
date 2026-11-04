import type { ReactNode } from 'react';
import './MarkButton.css';

/** the designer's 32px icons in MarkButton (19443:490 / 19443:506), drawn in the button's colour */
const KnowIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden>
    <path d="M6.66667 16.6667L12.6667 22.6667L25.3333 10" stroke="currentColor" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UnknownIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden>
    <path d="M8 8L16 16M16 16L24 24M16 16L24 8M16 16L8 24" stroke="currentColor" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * RC/Vocab/MarkButton (proposed, 19443:521; sizes from the designer's 3.03–3.05, Ready for dev): 认识 / 不认识, 200 × 80.
 * Variants Mark = know / unknown × Selected (aria-pressed) × State (hover via CSS: the selected tint).
 */
export function MarkButton({ mark, selected, onClick, children }: { mark: 'know' | 'unknown'; selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`scan-btn is-${mark}${selected ? ' is-on' : ''}`} aria-pressed={selected} onClick={onClick}>
      {mark === 'know' ? <KnowIcon /> : <UnknownIcon />}
      <span>{children}</span>
    </button>
  );
}
