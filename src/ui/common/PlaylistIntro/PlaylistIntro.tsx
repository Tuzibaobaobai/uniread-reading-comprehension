import type { CSSProperties, ReactNode } from 'react';
import { BackArrow } from '@/components/Icons';
import './PlaylistIntro.css';

/**
 * RC/Common/PlaylistIntro (proposed, #138; Ready frame 合集页 19949:220274, #150): the playlist page intro panel — back
 * button, blurred cover behind a translucent layer, the cover in a square from its top, title, two stats (words / entries +
 * level or CEFR band), description and an action row (ui/StatsButton + ui/FavoriteButton). ≥ 1024px: the first of three
 * columns, as tall as its content (at least 800px); a compact grid card on narrow screens. Keeps the `.playlist-intro*` /
 * `.playlist-back` classes.
 */
export function PlaylistIntro({
  cover,
  title,
  stats,
  description,
  backLabel,
  onBack,
  actions,
}: {
  /** blurred background image */
  cover: string;
  title: string;
  stats: [ReactNode, ReactNode];
  description: ReactNode;
  backLabel: string;
  onBack: () => void;
  /** the button row under the description */
  actions?: ReactNode;
}) {
  return (
    <aside className="playlist-intro">
      <button className="back-button playlist-back" onClick={onBack} aria-label={backLabel}>
        <BackArrow />
      </button>
      <div className="playlist-intro-panel" style={{ '--cover': `url("${cover}")` } as CSSProperties}>
        <img className="playlist-intro-cover" src={cover} alt="" />
        <h1 className="playlist-intro-title">{title}</h1>
        <div className="playlist-intro-stats">
          <span>{stats[0]}</span>
          <span>{stats[1]}</span>
        </div>
        <p className="playlist-intro-desc">{description}</p>
        {actions && <div className="playlist-intro-actions">{actions}</div>}
      </div>
    </aside>
  );
}
