import type { ReactNode } from 'react';
import './ContextLine.css';

export type ContextMode = 'default' | 'exam';

/**
 * rc/Quiz/ContextLine (proposed, RC · Proposed — issue #138): the grey box under a prompt with the blank's sentence.
 * Variants: Mode default / exam (exam papers: the sentence is in the left pane already, so it shows only on narrow
 * screens); Stack single / stacked (ContextStack around several lines). Keeps the classes `context-line` /
 * `exam-context` / `context-stack`.
 */
export function ContextLine({ mode = 'default', children }: { mode?: ContextMode; children?: ReactNode }) {
  return <p className={`context-line ${mode === 'exam' ? 'exam-context' : ''}`}>{children}</p>;
}

/** Stack stacked: one ContextLine per blank */
export function ContextStack({ children }: { children: ReactNode }) {
  return <div className="context-stack">{children}</div>;
}

/**
 * Form: a printed notes form in the question pane (Ready frame 2.08 — listening Part 2 「Radio camp for teenagers」): the
 * same grey box, a bold title, label / answer rows with the gaps as lines. `table` — the box draws the rows itself; a
 * printed note (PET) keeps its own card.
 */
export function ContextForm({ table = true, children }: { table?: boolean; children: ReactNode }) {
  return <div className={table ? 'context-line context-form' : 'context-form is-note'}>{children}</div>;
}
