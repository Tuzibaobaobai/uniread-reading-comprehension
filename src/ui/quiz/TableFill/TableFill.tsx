import type { ReactNode } from 'react';
import './TableFill.css';

/**
 * RC/Quiz/TableFill (proposed, Figma RC · Proposed 19446:779): 第69–70天 — a table printed with answer lines, a typed
 * blank in each answer cell. Variant Cell header / text / blank: the cells are the reader's table blocks (.rt-table),
 * the blank cells the shared BlankInput (rc/Quiz/BlankInput) — both passed in as children.
 */
export function TableFill({ children }: { children: ReactNode }) {
  return <div className="vq-table stimulus">{children}</div>;
}
