import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { staticContent } from '@/lib/content';
import { AudioPlayer as AudioPlayerView } from '@/ui/AudioPlayer/AudioPlayer';

const SKIP = 5;

/**
 * Practice-mode recording for one Listening Part — ui/AudioPlayer Mode=practice (Figma UIkit-Read `player`
 * 11728:110946): progress row, then back 5 s / play·pause / forward 5 s; the track seeks. Only one Part plays at a time
 * (`active` false pauses it); a finished Part never starts the next one (GitHub #72). Exam mode uses
 * ExamAudioSequence instead. This wrapper owns the <audio> element and its state.
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
    <AudioPlayerView
      mode="practice"
      time={time}
      duration={duration}
      playing={playing}
      labels={{ progress: t('audio.progress'), play: t('audio.play'), pause: t('audio.pause'), back: t('audio.back', { s: SKIP }), forward: t('audio.forward', { s: SKIP }) }}
      onToggle={toggle}
      onSkip={(dir) => skip(dir === 'back' ? -SKIP : SKIP)}
      onSeek={(s) => audio.current && (audio.current.currentTime = s)}
    >
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
    </AudioPlayerView>
  );
}
