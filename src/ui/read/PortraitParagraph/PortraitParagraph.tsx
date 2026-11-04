import type { HTMLAttributes, ReactNode } from 'react';
import './PortraitParagraph.css';

/**
 * RC/Read/PortraitParagraph (proposed, issue #138; Figma: RC · Proposed): a person's photo beside their paragraph
 * (KET Reading Part 2 #91, PET Reading Part 2). Extra attributes (data-block, the evidence class) go on the row.
 * Keeps the legacy classes (.rt-portrait-row, .rt-portrait, .rt-p) that e2e/ket.spec.ts uses.
 */
export function PortraitParagraph({
  src,
  alt,
  w,
  h,
  children,
  className = '',
  ...rest
}: { src: string; alt: string; w: number; h: number; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['rt-portrait-row', className].filter(Boolean).join(' ')} {...rest}>
      <img className="rt-portrait" src={src} alt={alt} width={w} height={h} />
      <p className="rt-p">{children}</p>
    </div>
  );
}
