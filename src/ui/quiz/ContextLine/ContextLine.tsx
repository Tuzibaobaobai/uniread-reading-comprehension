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
