import type { ReactNode } from 'react';
import './WordFamilyRow.css';

/**
 * RC/Vocab/WordFamilyRow (proposed, Figma RC · Proposed 19446:726): 三 (#120) — the given word | one line per form
 * (part of speech, word, meaning) in aligned columns. A layout container: each slot's word / meaning fields come in as
 * LineInputs. Variants Result none / correct / wrong / partial and Locked no / yes are carried by those fields and the row.
 */
export function WordFamilyRow({ base, slots }: { base: string; slots: { id: string; pos: string; word: ReactNode; zh: ReactNode }[] }) {
  return (
    <div className="vq-family">
      <b className="vq-base" lang="en">
        {base}
      </b>
      <div className="vq-slots">
        {slots.map((s) => (
          <div key={s.id} className="vq-slot">
            <span className="vq-slot-pos">{s.pos}</span>
            {s.word}
            {s.zh}
          </div>
        ))}
      </div>
    </div>
  );
}
