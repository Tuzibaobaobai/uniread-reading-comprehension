import type { ReactNode } from 'react';
import './SectionHeader.css';

/**
 * RC/Quiz/SectionHeader (proposed, Figma RC · Proposed 19446:576; the designer's 词汇 › 测验 frames): the Part title line
 * — "Part N." (bold) + the section instruction (secondary) on one line. How far the learner is shows in the pager
 * (ui/vocab/PartNav), not here. Wraps the shared reader `.section-instruction`.
 */
export function SectionHeader({ part, instruction }: { part: string; instruction: ReactNode }) {
  return (
    <p className="section-instruction vq-part-head">
      <b>{part}.</b>{' '}
      {instruction}
    </p>
  );
}
