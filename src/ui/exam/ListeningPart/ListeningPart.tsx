import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Tag } from '@/ui/common/Tag/Tag';
import './ListeningPart.css';

export type ListeningMode = 'practice' | 'exam';

/**
 * RC/Exam/ListeningPart (proposed, issue #138; the designer's Ready-for-dev frames 2.03–2.13, Figma 19496:1147): one Part
 * of a listening paper — a white card with the title and the 正在播放 badge (rc/Common/Tag, Tone solid), the
 * instruction, an optional rule note (exam mode, next to the start button), then the controls (ui/AudioPlayer Size=compact in
 * practice; in exam mode the progress, the start button or a state line) and, for the current question's Part, its
 * material and transcript (`children`).
 * Variants: Playing no / yes (brand border); Mode practice / exam. `current` (the current question's Part) only adds
 * the class: the designer's frames mark the playing Part, not the current one. The ref is the <section> (scrolled
 * into view).
 * Keeps the legacy classes (.part-audio, .is-current, .is-playing, .part-audio-title, .part-audio-badge) and the
 * section's aria-label that e2e/ket.spec.ts and e2e/pet.spec.ts use. The Parts stack in the pane's
 * `.listening-stack` (rc/Read/ArticleText with that class, GitHub #72).
 */
export const ListeningPart = forwardRef<
  HTMLElement,
  {
    title: string;
    instruction: ReactNode;
    /** the mode's rule line (exam: plays once), shown under the instruction */
    note?: ReactNode;
    mode?: ListeningMode;
    playing?: boolean;
    /** badge text while playing (正在播放) */
    playingLabel?: ReactNode;
    current?: boolean;
    children?: ReactNode;
  }
>(function ListeningPart({ title, instruction, note, mode = 'practice', playing = false, playingLabel, current = false, children }, ref) {
  return (
    <section
      ref={ref}
      className={['part-audio', `is-${mode}`, current ? 'is-current' : '', playing ? 'is-playing' : ''].filter(Boolean).join(' ')}
      aria-label={title}
    >
      <h2 className="part-audio-title">
        {title}
        {playing && playingLabel && (
          <Tag tone="solid" className="part-audio-badge">
            {playingLabel}
          </Tag>
        )}
      </h2>
      <p className="exam-instruction">{instruction}</p>
      {note && <p className="player-note">{note}</p>}
      {children}
    </section>
  );
});

/** a status line inside a Part: recording missing / finished / waiting for its turn */
export function ListeningPartState({ children }: { children: ReactNode }) {
  return <p className="part-audio-state">{children}</p>;
}

/** exam mode: the button that starts (or continues) the one-time recording, in the player's grey box */
export function ListeningPartStart({ icon, children, ...rest }: { icon: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="part-audio-start-box">
      <button type="button" className="part-audio-start" {...rest}>
        <img src={icon} alt="" className="part-audio-start-icon" />
        {children}
      </button>
    </div>
  );
}
