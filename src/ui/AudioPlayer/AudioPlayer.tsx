import type { CSSProperties, ReactNode } from 'react';
import previousIcon from '@/assets/icons/audio-previous.svg';
import { PlayButton } from '@/ui/PlayButton/PlayButton';
import './AudioPlayer.css';

export const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * ui/AudioPlayer — extends UniRead UIkit-Read · player (11728:110946) (`ui/AudioPlayer`, issue #138; restyled to the
 * designer's Player box in RC/Exam/ListeningPart 19496:1147 — a grey box with 40-high buttons): the listening recording
 * player. Variant Mode practice (progress row, then back 5 s / play·pause (ui/PlayButton Size=player) /
 * forward 5 s; the track seeks) / exam (progress only, locked — `.player.is-locked`). Presentational: the caller owns
 * the <audio> element (pass it as `children`) and its state. Keeps .player / .player-progress / .player-actions.
 */
export function AudioPlayer({
  mode = 'practice',
  time,
  duration,
  playing = false,
  labels,
  onToggle,
  onSkip,
  onSeek,
  children,
}: {
  mode?: 'practice' | 'exam';
  time: number;
  duration: number;
  playing?: boolean;
  labels: { progress: string; play?: string; pause?: string; back?: string; forward?: string };
  onToggle?: () => void;
  onSkip?: (direction: 'back' | 'forward') => void;
  /** practice only: the track seeks */
  onSeek?: (t: number) => void;
  children?: ReactNode;
}) {
  if (mode === 'exam')
    return (
      <div className="player is-locked">
        {children}
        <AudioProgress time={time} duration={duration} label={labels.progress} />
      </div>
    );
  return (
    <div className="player">
      {children}
      <AudioProgress time={time} duration={duration} label={labels.progress} onSeek={onSeek} />
      <div className="player-actions">
        <SkipButton direction="back" label={labels.back ?? ''} onClick={() => onSkip?.('back')} />
        <PlayButton size="player" playing={playing} label={(playing ? labels.pause : labels.play) ?? ''} onPlay={() => onToggle?.()} />
        <SkipButton direction="forward" label={labels.forward ?? ''} onClick={() => onSkip?.('forward')} />
      </div>
    </div>
  );
}

/**
 * back / forward 5 s — UniRead UIkit-Read · btn-before (3221:7318); Direction back / forward (forward = mirrored,
 * extension). Square .player-btn.is-square, forward adds .is-forward.
 */
export function SkipButton({ direction, label, onClick }: { direction: 'back' | 'forward'; label: string; onClick: () => void }) {
  return (
    <button type="button" className={`player-btn is-square${direction === 'forward' ? ' is-forward' : ''}`} onClick={onClick} aria-label={label}>
      <img src={previousIcon} alt="" width={32} height={32} />
    </button>
  );
}

/** time · track · duration; the track seeks unless onSeek is absent (exam mode) */
export function AudioProgress({ time, duration, label, onSeek }: { time: number; duration: number; label: string; onSeek?: (t: number) => void }) {
  return (
    <div className="player-progress">
      <span className="player-time">{fmtTime(time)}</span>
      <input
        className="player-track"
        type="range"
        min={0}
        max={Math.max(1, Math.round(duration))}
        step={1}
        value={Math.round(time)}
        disabled={!onSeek}
        aria-label={label}
        style={{ '--progress': `${(time / Math.max(1, duration)) * 100}%` } as CSSProperties}
        onChange={(e) => onSeek?.(Number(e.target.value))}
      />
      <span className="player-time">{fmtTime(duration)}</span>
    </div>
  );
}
