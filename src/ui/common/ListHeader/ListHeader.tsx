import type { ReactNode } from 'react';
import './ListHeader.css';

/**
 * RC/Common/ListHeader (proposed, #138): the sticky head of the playlist's item list ("共 N 篇" / "Items (N)").
 * Keeps the class `.playlist-items-head` that e2e selects.
 */
export function ListHeader({ children }: { children: ReactNode }) {
  return <h2 className="playlist-items-head">{children}</h2>;
}
