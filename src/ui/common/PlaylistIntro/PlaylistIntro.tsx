import type { CSSProperties, ReactNode } from 'react';
import { BackArrow } from '@/components/Icons';
import './PlaylistIntro.css';

/**
 * RC/Common/PlaylistIntro (proposed, #138): the playlist page intro panel — back button, blurred cover behind a
 * translucent layer, banner, title, two stats (words / entries + level or CEFR band), description and an action slot
 * (ui/FavoriteButton). Sticky full-height column ≥ 1024px; a compact grid card on narrow screens. Keeps the
 * `.playlist-intro*` / `.playlist-back` classes.
 */
export function PlaylistIntro({
  cover,
  banner,
  title,
  stats,
  description,
  backLabel,
  onBack,
  action,
}: {
  /** blurred background image */
  cover: string;
  /** banner image (defaults to the cover) */
  banner?: string;
  title: string;
  stats: [ReactNode, ReactNode];
  description: ReactNode;
  backLabel: string;
  onBack: () => void;
  action?: ReactNode;
}) {
  return (
    <aside className="playlist-intro">
      <button className="back-button playlist-back" onClick={onBack} aria-label={backLabel}>
        <BackArrow />
      </button>
      <div className="playlist-intro-panel" style={{ '--cover': `url("${cover}")` } as CSSProperties}>
        <img className="playlist-intro-cover" src={banner ?? cover} alt="" />
        <h1 className="playlist-intro-title">{title}</h1>
        <div className="playlist-intro-stats">
          <span>{stats[0]}</span>
          <span>{stats[1]}</span>
        </div>
        <p className="playlist-intro-desc">{description}</p>
        {action}
      </div>
    </aside>
  );
}
