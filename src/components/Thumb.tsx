import type { CSSProperties } from 'react';
import { staticContent } from '@/lib/content';

/** article thumbnail; items without a picture get a generated text card in the playlist accent */
export function Thumb({
  src,
  title,
  kicker,
  accent,
  className,
}: {
  src?: string;
  title: string;
  /** small line above the title, e.g. "Week 1 · Monday" or "Test 1 · Listening" */
  kicker: string;
  accent: string;
  className?: string;
}) {
  if (src) return <img className={className} src={staticContent.assetUrl(src)} alt="" loading="lazy" />;
  return (
    <div className={`${className ?? ''} text-thumb`} style={{ '--thumb-accent': accent } as CSSProperties} aria-hidden>
      <span className="text-thumb-day">{kicker}</span>
      <span className="text-thumb-title">{title}</span>
    </div>
  );
}
