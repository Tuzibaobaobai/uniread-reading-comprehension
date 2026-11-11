import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import OverflowTip from '@/components/OverflowTip';
import checkListIcon from '@/assets/icons/card-checklist.svg';
import './PlaylistCard.css';

/**
 * ui/PlaylistCard — the home page playlist card, drawn by the UniRead designer as `合集类型` (Figma RC · Screens ·
 * DS-2026-11-03 19834:233509; variant Property 1=时文 19834:233510 extends UIKit-学生-首页 `Web-card` 18162:297865,
 * Ready for dev in 0.01 / 0.02): cover with the progress badge "≔ done/total" in its top-left corner, the 4 px total
 * progress bar under the cover, title (one line), the info line (parts separated by 2 px dots) and the grey learning-mode
 * icons. Web-card's "3天前更新" line is hidden in the RC variant. Keeps `.playlist-card` / `.playlist-card-meta` that e2e
 * selects.
 */
export function PlaylistCard({
  to,
  cover,
  title,
  meta,
  progress,
  icons,
  iconsLabel,
}: {
  to: string;
  cover: string;
  title: string;
  /** the info line's parts: "共60篇", "L3" */
  meta: string[];
  /** items completed / items, with the badge's aria-label */
  progress: { done: number; total: number; label: string };
  icons?: ReactNode;
  iconsLabel?: string;
}) {
  const pct = progress.total ? Math.min(progress.done / progress.total, 1) * 100 : 0;
  return (
    <Link to={to} className="playlist-card">
      <span className="playlist-card-cover-box">
        <img className="playlist-card-cover" src={cover} alt="" />
        <span className="playlist-card-badge" aria-label={progress.label}>
          <span className="playlist-card-badge-icon" aria-hidden>
            <img src={checkListIcon} alt="" />
          </span>
          <span aria-hidden>
            {progress.done}/{progress.total}
          </span>
        </span>
      </span>
      <span className="playlist-card-progress" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="playlist-card-body">
        <OverflowTip className="playlist-card-title">{title}</OverflowTip>
        <span className="playlist-card-meta">
          {meta.map((m, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="playlist-card-dot" aria-hidden />}
              <span>{m}</span>
            </Fragment>
          ))}
        </span>
        {icons && (
          <span className="playlist-card-icons" role="img" aria-label={iconsLabel}>
            {icons}
          </span>
        )}
      </span>
    </Link>
  );
}
