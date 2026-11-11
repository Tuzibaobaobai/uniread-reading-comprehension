import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import micIcon from '@/assets/icons/speak-mic.svg';
import respeakIcon from '@/assets/icons/speak-respeak.svg';
import submitIcon from '@/assets/icons/speak-submit.svg';
import cancelIcon from '@/assets/icons/speak-x.svg';
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
 * `ui/SpeakButton`). Variants: state (disabled via `disabled`); Recording yes (the designer's recording pill, 19508:7558:
 * cancel ×, restart ↻, the waveform whose green share is the elapsed time — `label` carries the countdown as its
 * accessible name — and the green ✓ that finishes the answer, `stopLabel` its aria-label); Recognising yes (spinning
 * icon, a role="status" span, not a button). Idle shows 回答, or 重录 when `again` (the caller's label); both keep the mic icon (Ready frame 2.27).
 */
export function SpeakButton({
  state = 'idle',
  again: _again = false,
  label,
  stopLabel,
  disabled,
  onStart,
  onStop,
  elapsed = 0,
  cancel,
  restart,
}: {
  state?: SpeakButtonState;
  again?: boolean;
  label: string;
  stopLabel: string;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  /** recording: the share of the longest answer already used (0–1) */
  elapsed?: number;
  /** recording: discard it (×) / discard it and record again (↻); the buttons appear when given */
  cancel?: { label: string; onClick: () => void };
  restart?: { label: string; onClick: () => void };
}) {
  if (state === 'recording')
    return (
      <div className="speak-rec is-recording" style={{ '--done': `${Math.round(Math.min(1, Math.max(0, elapsed)) * 100)}%` } as CSSProperties}>
        <span className="speak-rec-tools">
          {cancel && (
            <button type="button" className="speak-rec-btn" onClick={cancel.onClick} aria-label={cancel.label}>
              <img src={cancelIcon} alt="" width={28} height={28} />
            </button>
          )}
          {restart && (
            <button type="button" className="speak-rec-btn" onClick={restart.onClick} aria-label={restart.label}>
              <img src={respeakIcon} alt="" width={28} height={28} />
            </button>
          )}
        </span>
        <span className="speak-rec-wave" role="timer" aria-label={label}>
          <WaveBars />
          <WaveBars done />
        </span>
        <button type="button" className="speak-rec-btn is-submit" onClick={onStop} aria-label={stopLabel}>
          <img src={submitIcon} alt="" width={28} height={28} />
        </button>
      </div>
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
  // Ready frame 2.27: 重录 keeps the mic icon (the ↻ icon is the recording bar's 重新录音)
  return (
    <SpeakAction icon={micIcon} onClick={onStart} disabled={disabled}>
      {label}
    </SpeakAction>
  );
}

/** the waveform of the recording pill (UIkit-Speak audio wave: 17 bars, small / medium / large) */
const WAVE = 'smlmslsmlmlsmssms';
function WaveBars({ done = false }: { done?: boolean }) {
  return (
    <span className={done ? 'speak-rec-bars is-done' : 'speak-rec-bars'} aria-hidden>
      {[...WAVE].map((h, i) => (
        <i key={i} className={h === 'm' ? 'is-m' : h === 'l' ? 'is-l' : undefined} />
      ))}
    </span>
  );
}
