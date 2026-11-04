import type { ReactNode } from 'react';
import './OrderChunk.css';

export type ChunkResult = 'none' | 'correct' | 'wrong';

/**
 * ui/OrderChunk — extends UniRead UIKit-Dictation `item-hug` (15504:106347): one word chunk of 连词成句, in the pool or
 * placed on the answer line. Variants: Placed no / yes (new); Result none / correct / wrong (new — a placed chunk in
 * review). Keeps the class `order-chip` (+ is-placed).
 */
export function OrderChunk({
  placed = false,
  result = 'none',
  disabled,
  onClick,
  children,
}: {
  placed?: boolean;
  result?: ChunkResult;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={['order-chip', placed ? 'is-placed' : '', placed && result !== 'none' ? `is-${result}` : ''].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
