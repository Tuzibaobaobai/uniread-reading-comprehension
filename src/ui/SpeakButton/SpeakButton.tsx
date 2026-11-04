import type { ButtonHTMLAttributes, ReactNode } from 'react';
import micIcon from '@/assets/icons/speak-mic.svg';
import respeakIcon from '@/assets/icons/speak-respeak.svg';
import submitIcon from '@/assets/icons/speak-submit.svg';
import loadingIcon from '@/assets/icons/speak-loading.svg';
import './SpeakButton.css';

/**
 * The speak-card action frame (round icon + label, class `.speak-btn`) shared by ui/SpeakButton, ui/ListenButton and
 * ui/PlaybackButton. `iconClass` is an icon-state modifier (is-submit / is-loading).
 */
export function SpeakAction({ icon, iconClass = '', className = '', children, ...rest }: { icon: string; iconClass?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={['speak-btn', className].filter(Boolean).join(' ')} {...rest}>
      <span className={['speak-btn-icon', iconClass].filter(Boolean).join(' ')}>
        <img src={icon} alt="" width={40} height={40} />
      </span>
      {children}
    </button>
  );
}

export type SpeakButtonState = 'idle' | 'recording' | 'recognising';

/**
 * ui/SpeakButton — UniRead UIkit-Speak btn-speak (9017:38080), extended (design-system/components.registry.json
 * `ui/SpeakButton`). Variants: state (disabled via `disabled`); Recording yes (✓ icon, `label` carries the countdown,
 * tapping stops — `stopLabel` is its aria-label); Recognising yes (spinning icon, a role="status" span, not a button).
 * Idle shows 回答, or 重录 with the respeak icon when `again`.
 */
export function SpeakButton({
  state = 'idle',
  again = false,
  label,
  stopLabel,
  disabled,
  onStart,
  onStop,
}: {
  state?: SpeakButtonState;
  again?: boolean;
  label: string;
  stopLabel: string;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  if (state === 'recording')
    return (
      <SpeakAction icon={submitIcon} iconClass="is-submit" className="is-recording" onClick={onStop} aria-label={stopLabel}>
        {label}
      </SpeakAction>
    );
  if (state === 'recognising')
    return (
      <span className="speak-btn" role="status">
        <span className="speak-btn-icon is-loading">
          <img src={loadingIcon} alt="" width={40} height={40} />
        </span>
        {label}
      </span>
    );
  return (
    <SpeakAction icon={again ? respeakIcon : micIcon} onClick={onStart} disabled={disabled}>
      {label}
    </SpeakAction>
  );
}
