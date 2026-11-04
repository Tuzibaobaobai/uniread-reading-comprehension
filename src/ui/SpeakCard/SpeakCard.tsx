import type { ReactNode } from 'react';
import { Tag } from '../common/Tag/Tag';
import './SpeakCard.css';

export type SpeakRole = 'examiner' | 'partner';

/** the list the speak cards sit in (`ol.speak-turns`) */
export function SpeakTurns({ children }: { children: ReactNode }) {
  return <ol className="speak-turns">{children}</ol>;
}

/**
 * ui/SpeakCard — UniRead UIkit-Speak subtitle-SpeakMode (9017:40624), extended (design-system/components.registry.json
 * `ui/SpeakCard`): one card per examiner / partner line — n/N, the role, the line, the learner's transcript, an error
 * and the action row (ui/ListenButton, ui/SpeakButton, ui/PlaybackButton).
 * Variants: Prompt shown / hidden (`promptHidden`: exam mode, `prompt` is then the 「请听…」 note); Answer none /
 * transcript (`answer`); Role examiner / partner (rc/Common/Tag neutral / accent, class `.speak-role` [.is-partner]).
 * `active` = recording or recognising on this card (accent border), `done` = has a transcript.
 */
export function SpeakCard({
  index,
  total,
  role,
  roleLabel,
  prompt,
  promptHidden = false,
  answer,
  answerLabel,
  active = false,
  notice,
  actions,
}: {
  index: number;
  total: number;
  role: SpeakRole;
  roleLabel: string;
  prompt: ReactNode;
  promptHidden?: boolean;
  answer?: string;
  answerLabel: string;
  active?: boolean;
  notice?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <li className={['speak-card', active && 'is-active', answer && 'is-done'].filter(Boolean).join(' ')}>
      <p className="speak-count">
        {index}/{total}
        <Tag tone={role === 'partner' ? 'accent' : 'neutral'} className={role === 'partner' ? 'speak-role is-partner' : 'speak-role'}>
          {roleLabel}
        </Tag>
      </p>
      <p className={promptHidden ? 'speak-line is-hidden' : 'speak-line'}>{prompt}</p>
      {answer && (
        <p className="speak-said">
          <span className="speak-said-label">{answerLabel}</span>
          {answer}
        </p>
      )}
      {notice}
      <div className="speak-actions">{actions}</div>
    </li>
  );
}
