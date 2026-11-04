import type { ReactNode } from 'react';
import './SectionHeader.css';

/**
 * RC/Quiz/SectionHeader (proposed, Figma RC · Proposed 19446:576): the Part title line — "Part N." + the section
 * instruction + the progress "已完成 x/y" (left out in review). Wraps the shared reader `.section-instruction`.
 */
export function SectionHeader({ part, instruction, progress }: { part: string; instruction: ReactNode; progress?: string }) {
  return (
    <p className="section-instruction">
      <b>{part}. </b>
      {instruction}
      {progress && <span className="vq-progress">{progress}</span>}
    </p>
  );
}
