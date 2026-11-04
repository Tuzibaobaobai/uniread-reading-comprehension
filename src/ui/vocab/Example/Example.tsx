import type { ReactNode } from 'react';
import { PlayButton } from '@/ui/PlayButton/PlayButton';
import './Example.css';

/** RC/Vocab/Example (proposed, 19445:495): English (headword underlined) + play (Audio=yes) + Chinese. */
export function Example({ en, zh, play }: { en: ReactNode; zh: string; play?: { label: string; onPlay: () => void } }) {
  return (
    <li className="entry-example">
      <p className="entry-en">
        {en}
        {play && <PlayButton inline label={play.label} onPlay={play.onPlay} />}
      </p>
      <p className="entry-zh">{zh}</p>
    </li>
  );
}
