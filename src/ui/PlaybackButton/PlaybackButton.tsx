import playbackIcon from '@/assets/icons/speak-playback.svg';
import { SpeakAction } from '../SpeakButton/SpeakButton';

/**
 * ui/PlaybackButton — UniRead UIkit-Speak btn-playback (9017:39283), reused (design-system/components.registry.json
 * `ui/PlaybackButton`): 回放 the learner's own recording. Disabled until there is a clip. The source's
 * `Generating Score` BOOLEAN is not used by RC (scoring happens after submitting). The frame is ui/SpeakButton's
 * `.speak-btn`.
 */
export function PlaybackButton({ label, disabled, onPlay }: { label: string; disabled?: boolean; onPlay: () => void }) {
  return (
    <SpeakAction icon={playbackIcon} onClick={onPlay} disabled={disabled}>
      {label}
    </SpeakAction>
  );
}
