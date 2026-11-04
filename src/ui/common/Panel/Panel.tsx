import { forwardRef, type ReactNode } from 'react';
import './Panel.css';

export type PanelKind = 'article' | 'quiz' | 'exam';

/**
 * RC/Common/Panel (proposed, issue #138): the white card of a split reader page — the article (时文), the exam
 * material (真题) or the questions — with the thin scroller kept clear of the rounded corners (#8).
 * Variants: Kind article / quiz / exam; Header (BOOLEAN, above the scroller); Footer (BOOLEAN, below it).
 * The ref is the scrolling element. Keeps the legacy classes (.article-pane / .article-scroll, .exam-pane,
 * .question-card / .question-scroll) that the e2e tests and other screens use.
 */
export const Panel = forwardRef<HTMLDivElement, { kind?: PanelKind; header?: ReactNode; footer?: ReactNode; className?: string; children?: ReactNode }>(
  function Panel({ kind = 'article', header, footer, className = '', children }, ref) {
    const quiz = kind === 'quiz';
    const card = quiz ? 'question-card' : kind === 'exam' ? 'article-pane exam-pane' : 'article-pane';
    return (
      <div className={[card, className].filter(Boolean).join(' ')}>
        {header}
        <div className={`${quiz ? 'question-scroll' : 'article-scroll'} thin-scroll`} ref={ref}>
          {children}
        </div>
        {footer}
      </div>
    );
  },
);
