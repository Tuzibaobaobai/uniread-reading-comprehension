import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Tag } from '@/ui/common/Tag/Tag';
import './ListeningPart.css';

export type ListeningMode = 'practice' | 'exam';

/**
 * RC/Exam/ListeningPart (proposed, issue #138; Figma: RC · Proposed): one Part of a listening paper — title with the
 * 正在播放 / 播放中 badge (rc/Common/Tag, Tone solid), instruction, the mode note, then the controls (ui/AudioPlayer in
 * practice, the exam progress / start button / state line in exam mode) and, for the current question's Part, its
 * material and transcript (`children`).
 * Variants: Playing no / yes; Mode practice / exam (decides the note and the badge text the caller passes);
 * Current (the current question's Part, accent border). The ref is the <section> (scrolled into view).
 * Keeps the legacy classes (.part-audio, .is-current, .is-playing, .part-audio-title, .part-audio-badge) and the
 * section's aria-label that e2e/ket.spec.ts and e2e/pet.spec.ts use. The Parts stack in the pane's
 * `.listening-stack` (rc/Read/ArticleText with that class, GitHub #72).
 */
export const ListeningPart = forwardRef<
  HTMLElement,
  {
    title: string;
    instruction: ReactNode;
    /** the mode's rule line (exam: plays once; practice: pause / seek freely) */
    note: ReactNode;
    mode?: ListeningMode;
    playing?: boolean;
    /** badge text while playing (正在播放 in exam mode, 播放中 in practice) */
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
      <p className="player-note">{note}</p>
      {children}
    </section>
  );
});

/** a status line inside a Part: recording missing / finished / waiting for its turn */
export function ListeningPartState({ children }: { children: ReactNode }) {
  return <p className="part-audio-state">{children}</p>;
}

/** exam mode: the button that starts (or continues) the one-time recording */
export function ListeningPartStart({ icon, children, ...rest }: { icon: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="part-audio-start" {...rest}>
      <img src={icon} alt="" className="part-audio-start-icon" />
      {children}
    </button>
  );
}
