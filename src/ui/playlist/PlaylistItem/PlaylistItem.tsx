import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import OverflowTip from '@/components/OverflowTip';
import { ProgressBar } from '@/ui/playlist/ProgressBar/ProgressBar';
import './PlaylistItem.css';

/**
 * ui/PlaylistItem — extends UniRead UIKit-Playlist `video list item` (6587:2549, #138): one row of a playlist — number,
 * thumbnail, title, info line, progress bar. Variants: Thumb image / text (slot; text = rc/Common/TextThumb), Score
 * (the result / exam status inside the info line), State Default / Hover (title in the accent) / Done (`done`).
 * Keeps the classes `.item-row*` that e2e selects.
 */
export function PlaylistItem({
  to,
  number,
  thumb,
  title,
  meta,
  progress,
  progressLabel,
  done = false,
}: {
  to: string;
  number: ReactNode;
  /** the cover: an element with the class `item-row-thumb` (e.g. <TextThumb className="item-row-thumb" />) */
  thumb: ReactNode;
  title: string;
  /** "Type · 12 questions · 15 min · score" */
  meta: string;
  /** 0–1 */
  progress: number;
  progressLabel: string;
  done?: boolean;
}) {
  return (
    <Link to={to} className={`item-row${done ? ' is-done' : ''}`}>
      <span className="item-row-num">{number}</span>
      {thumb}
      <span className="item-row-text">
        <OverflowTip className="item-row-title">{title}</OverflowTip>
        <span className="item-row-meta">{meta}</span>
        <ProgressBar className="item-row-progress" value={progress} label={progressLabel} />
      </span>
    </Link>
  );
}
