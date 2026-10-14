import type { CSSProperties } from 'react';
import { DAY_NAME } from '@/lib/labels';
import { staticContent } from '@/lib/content';

/** article thumbnail; items without a picture get a generated text card in the playlist accent */
export function Thumb({
  src,
  title,
  day,
  week,
  accent,
  className,
}: {
  src?: string;
  title: string;
  day: keyof typeof DAY_NAME;
  week: number;
  accent: string;
  className?: string;
}) {
  if (src) return <img className={className} src={staticContent.assetUrl(src)} alt="" loading="lazy" />;
  return (
    <div className={`${className ?? ''} text-thumb`} style={{ '--thumb-accent': accent } as CSSProperties} aria-hidden>
      <span className="text-thumb-day">
        Week {week} · {DAY_NAME[day]}
      </span>
      <span className="text-thumb-title">{title}</span>
    </div>
  );
}
