import type { ReactNode } from 'react';
import { Check, Cross } from '@/components/Icons';
import './MarkButton.css';

/**
 * RC/Vocab/MarkButton (proposed, 19443:521): 认识 / 不认识.
 * Variants Mark = know / unknown × Selected (aria-pressed) × State (hover via CSS).
 */
export function MarkButton({ mark, selected, onClick, children }: { mark: 'know' | 'unknown'; selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`scan-btn is-${mark}${selected ? ' is-on' : ''}`} aria-pressed={selected} onClick={onClick}>
      {mark === 'know' ? <Check /> : <Cross />} {children}
    </button>
  );
}
