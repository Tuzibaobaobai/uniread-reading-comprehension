import type { ReactNode } from 'react';
import './OrderLine.css';

export type OrderResult = 'none' | 'correct' | 'wrong';

/**
 * rc/Quiz/OrderLine (proposed, RC · Proposed — issue #138): the answer line of 连词成句 — the placeholder while empty,
 * the placed ui/OrderChunk chunks, then the sentence ending. Variants: State empty / partial / full (the chunks given
 * as children; `placeholder` shows while there are none); Result none / correct / wrong (the underline). OrderPool is
 * the row of chunks still to place (+ the 清空 Chip). Keeps the classes `order-line` / `order-pool`.
 */
export function OrderLine({
  result = 'none',
  label,
  placeholder,
  ending,
  children,
}: {
  result?: OrderResult;
  label: string;
  /** shown while no chunk is placed */
  placeholder?: string;
  ending?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`order-line ${result === 'none' ? '' : `is-${result}`}`} aria-label={label}>
      {placeholder && <span className="order-placeholder">{placeholder}</span>}
      {children}
      {ending && <span className="order-ending">{ending}</span>}
    </div>
  );
}

export function OrderPool({ children }: { children: ReactNode }) {
  return <div className="order-pool">{children}</div>;
}
