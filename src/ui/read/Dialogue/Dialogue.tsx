import type { HTMLAttributes, ReactNode } from 'react';
import './Dialogue.css';

export interface DialogueTurn {
  speaker: string;
  content: ReactNode;
}

/**
 * RC/Read/Dialogue (proposed, issue #138): a conversation block in an article or a listening transcript — an optional
 * legend, then one line per turn with the speaker in bold. Variants: Speaker (TEXT); Side a / b is not drawn yet (all
 * turns read left-aligned as printed). Extra attributes (data-block, the evidence class) go on the block. Keeps the
 * legacy classes (.rt-dialogue, .rt-turn, .rt-speaker).
 */
export function Dialogue({ legend, turns, className = '', ...rest }: { legend?: string; turns: DialogueTurn[] } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['rt-dialogue', className].filter(Boolean).join(' ')} {...rest}>
      {legend && <p className="rt-dialogue-legend">{legend}</p>}
      {turns.map((t, i) => (
        <p key={i} className="rt-turn">
          <span className="rt-speaker">{t.speaker}:</span>
          <span>{t.content}</span>
        </p>
      ))}
    </div>
  );
}
