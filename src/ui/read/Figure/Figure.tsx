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
