import type { ReactNode } from 'react';
import starIcon from '@/assets/icons/mark-star.svg';
import './MarkTag.css';

/**
 * RC/Vocab/MarkTag (proposed, 19445:483; the designer's Ready-for-dev 3.07–3.10): handbook marks — Kind = level /
 * textbook / supplement (a bordered tag with its text: 三级, G6下U1, 补充词) · star (one gold star per `*` printed:
 * "*" / "**" / "***", the children are the printed symbol).
 */
export function MarkTag({ kind, title, label, children }: { kind: 'level' | 'textbook' | 'star' | 'supplement'; title?: string; label?: string; children: ReactNode }) {
  if (kind === 'star')
    return (
      <span className="entry-star" role="img" title={title} aria-label={label ?? title}>
        {Array.from({ length: Math.max(1, String(children).length) }, (_, i) => (
          <img key={i} src={starIcon} alt="" />
        ))}
      </span>
    );
  return (
    <span className="entry-tag" title={title} aria-label={label}>
      {children}
    </span>
  );
}
