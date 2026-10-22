import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { staticContent } from '@/lib/content';
import playIcon from '@/assets/icons/audio-play.svg';
import pauseIcon from '@/assets/icons/audio-pause.svg';
import previousIcon from '@/assets/icons/audio-previous.svg';

const SKIP = 5;
export const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Practice-mode recording for one Listening Part — Figma UIkit-Read `player` (11728:110946): progress row,
 * then back 5 s / play·pause / forward 5 s; the track seeks. Only one Part plays at a time (`active` false
 * pauses it); a finished Part never starts the next one (GitHub #72). Exam mode uses ExamAudioSequence instead.
 */
export function AudioPlayer({
  src,
  seconds,
  active,
  onPlay,
}: {
  src: string;
  seconds: number;
  /** another Part started playing: pause this one */
  active: boolean;
  onPlay: () => void;
}) {
  const { t } = useTranslation();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(seconds);

  useEffect(() => {
    if (!active) audio.current?.pause();
  }, [active]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const skip = (d: number) => {
    const a = audio.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || duration, a.currentTime + d));
  };

  return (
    <div className="player">
      <audio
        ref={audio}
        src={staticContent.assetUrl(src)}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          onPlay();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />
      <Progress time={time} duration={duration} onSeek={(t) => audio.current && (audio.current.currentTime = t)} />
      <div className="player-actions">
        <button className="player-btn is-square" onClick={() => skip(-SKIP)} aria-label={t('audio.back', { s: SKIP })}>
          <img src={previousIcon} alt="" width={32} height={32} />
        </button>
        <button className="player-btn" onClick={toggle} aria-label={playing ? t('audio.pause') : t('audio.play')}>
          <img src={playing ? pauseIcon : playIcon} alt="" width={44} height={44} />
        </button>
        <button className="player-btn is-square is-forward" onClick={() => skip(SKIP)} aria-label={t('audio.forward', { s: SKIP })}>
          <img src={previousIcon} alt="" width={32} height={32} />
        </button>
      </div>
    </div>
  );
}

/** time · track · duration; the track seeks unless onSeek is absent (exam mode) */
export function Progress({ time, duration, onSeek }: { time: number; duration: number; onSeek?: (t: number) => void }) {
  const { t } = useTranslation();
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
        aria-label={t('audio.progress')}
        style={{ '--progress': `${(time / Math.max(1, duration)) * 100}%` } as React.CSSProperties}
        onChange={(e) => onSeek?.(Number(e.target.value))}
      />
      <span className="player-time">{fmtTime(duration)}</span>
    </div>
  );
}
