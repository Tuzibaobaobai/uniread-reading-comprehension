import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import OverflowTip from '@/components/OverflowTip';
import './PlaylistCard.css';

/**
 * ui/PlaylistCard — extends UniRead UIKit-学生-首页 `Web-card` (6583:11904, #138): the home page playlist card — cover,
 * title, info line, the question-type icons. Variants: Locale zh-CN / en-US (meta text from i18next), Icons
 * (INSTANCE_SWAP slot, ui/StepIcon). Keeps `.playlist-card` / `.playlist-card-meta` that e2e selects.
 */
export function PlaylistCard({
  to,
  cover,
  title,
  meta,
  icons,
  iconsLabel,
}: {
  to: string;
  cover: string;
  title: string;
  meta: ReactNode;
  icons?: ReactNode;
  iconsLabel?: string;
}) {
  return (
    <Link to={to} className="playlist-card">
      <img className="playlist-card-cover" src={cover} alt="" />
      <div className="playlist-card-body">
        <OverflowTip className="playlist-card-title">{title}</OverflowTip>
        <div className="playlist-card-meta">{meta}</div>
        {icons && (
          <div className="playlist-card-icons" aria-label={iconsLabel}>
            {icons}
          </div>
        )}
      </div>
    </Link>
  );
}
