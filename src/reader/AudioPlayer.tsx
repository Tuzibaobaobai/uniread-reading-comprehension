import { useEffect, useRef, useState } from 'react';
import { staticContent } from '@/lib/content';
import playIcon from '@/assets/icons/audio-play.svg';
import pauseIcon from '@/assets/icons/audio-pause.svg';
import previousIcon from '@/assets/icons/audio-previous.svg';

const SKIP = 5;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Listening recording for one Part — Figma UIkit-Read `player` (11728:110946): progress row, then back / play / forward.
 * practice: play, pause, skip ±5 s, seek on the track.
 * exam (locked): the recording already contains both plays, so it can be started once and then runs to the end —
 * no pause, no seeking, no replay (Cambridge Listening rules).
 */
export function AudioPlayer({
  src,
  seconds,
  locked,
  played,
  onPlayed,
}: {
  src: string;
  seconds: number;
  locked: boolean;
  /** exam mode: this Part's recording has already been played */
  played: boolean;
  onPlayed: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(seconds);

  // a new Part: stop the previous recording
  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDuration(seconds);
  }, [src, seconds]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else if (!locked) a.pause();
  };
  const skip = (d: number) => {
    const a = audio.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || duration, a.currentTime + d));
  };
  const exhausted = locked && played && !playing;

  return (
    <div className={`player ${locked ? 'is-locked' : ''}`} aria-label="听力录音">
      <audio
        ref={audio}
        src={staticContent.assetUrl(src)}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onPlayed();
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />
      <div className="player-progress">
        <span className="player-time">{fmt(time)}</span>
        <input
          className="player-track"
          type="range"
          min={0}
          max={Math.max(1, Math.round(duration))}
          step={1}
          value={Math.round(time)}
          disabled={locked}
          aria-label="播放进度"
          style={{ '--progress': `${(time / Math.max(1, duration)) * 100}%` } as React.CSSProperties}
          onChange={(e) => {
            const a = audio.current;
            if (a) a.currentTime = Number(e.target.value);
          }}
        />
        <span className="player-time">{fmt(duration)}</span>
      </div>
      <div className="player-actions">
        {!locked && (
          <button className="player-btn is-square" onClick={() => skip(-SKIP)} aria-label={`后退 ${SKIP} 秒`}>
            <img src={previousIcon} alt="" width={32} height={32} />
          </button>
        )}
        <button
          className="player-btn"
          onClick={toggle}
          disabled={exhausted || (locked && playing)}
          aria-label={playing ? (locked ? '正在播放' : '暂停') : '播放'}
        >
          <img src={playing ? pauseIcon : playIcon} alt="" width={44} height={44} />
        </button>
        {!locked && (
          <button className="player-btn is-square is-forward" onClick={() => skip(SKIP)} aria-label={`前进 ${SKIP} 秒`}>
            <img src={previousIcon} alt="" width={32} height={32} />
          </button>
        )}
      </div>
      {locked && (
        <p className="player-note">
          {exhausted ? '本部分录音已播放完毕。' : playing ? '录音播放中（每段播放两遍，不能暂停）。' : '考试模式：录音只能播放一次（已含两遍），开始后不能暂停或拖动。'}
        </p>
      )}
    </div>
  );
}
