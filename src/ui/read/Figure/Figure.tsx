import type { HTMLAttributes, ReactNode } from 'react';
import './Figure.css';

export type FigureSize = 'inline' | 'full';

/**
 * RC/Read/Figure (proposed, issue #138): a picture with its caption — article illustrations, notice photos, picture
 * prompts. Variants: Size inline (capped height) / full (natural height, exam question material; the grid-3 sequence
 * layout is the exam material's grid around several figures); Caption (BOOLEAN). Keeps the legacy class
 * `article-figure`.
 */
export function Figure({ src, alt, w, h, caption, size = 'inline' }: { src: string; alt: string; w: number; h: number; caption?: string; size?: FigureSize }) {
  return (
    <figure className={['article-figure', size === 'full' ? 'is-full' : ''].filter(Boolean).join(' ')}>
      <img src={src} alt={alt} width={w} height={h} style={{ aspectRatio: `${w} / ${h}` }} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * RC/Read/Figure, Size grid-3: several figures of one question's material laid out as a sequence (auto-fit columns).
 * `sequence` false renders a plain wrapper, so callers can switch by picture count. Extra attributes / classes
 * (.exam-q-material, .article-body) go on the wrapper.
 */
export function FigureGrid({ sequence = true, className = '', children, ...rest }: { sequence?: boolean; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[className, sequence ? 'figure-grid is-sequence' : ''].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
