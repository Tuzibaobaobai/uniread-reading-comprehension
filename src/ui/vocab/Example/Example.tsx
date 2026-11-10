import type { ReactNode } from 'react';
import { PlayButton } from '@/ui/PlayButton/PlayButton';
import './Example.css';

/** RC/Vocab/Example (proposed, 19445:484): English (headword highlighted) + speaker (Audio=yes) + Chinese. */
export function Example({ en, zh, play }: { en: ReactNode; zh: string; play?: { label: string; onPlay: () => void } }) {
  return (
    <li className="entry-example">
      <div className="entry-en-row">
        <p className="entry-en">{en}</p>
        {play && <PlayButton inline label={play.label} onPlay={play.onPlay} />}
      </div>
      <p className="entry-zh">{zh}</p>
    </li>
  );
}
