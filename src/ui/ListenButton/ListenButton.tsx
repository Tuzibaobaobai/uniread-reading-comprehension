import listenIcon from '@/assets/icons/speak-listen.svg';
import { SpeakAction } from '../SpeakButton/SpeakButton';

/**
 * ui/ListenButton — UniRead UIkit-Speak btn-listen (9017:35320), reused (design-system/components.registry.json
 * `ui/ListenButton`): 听题 / 听搭档. Variants: state Default / Hover / Disabled (`disabled`). The frame is
 * ui/SpeakButton's `.speak-btn`.
 */
export function ListenButton({ label, disabled, onListen }: { label: string; disabled?: boolean; onListen: () => void }) {
  return (
    <SpeakAction icon={listenIcon} onClick={onListen} disabled={disabled}>
      {label}
    </SpeakAction>
  );
}
