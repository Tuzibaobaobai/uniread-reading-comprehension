import './PhraseBank.css';

/**
 * RC/Vocab/PhraseBank (proposed, Figma RC · Proposed 19446:770): 词组日二 — the boxed Chinese phrases; tapping one
 * crosses it off (only a note for the learner). Variant Used no / yes per phrase; the page keeps the used set.
 */
export function PhraseBank({ items, used, onToggle, label }: { items: string[]; used: ReadonlySet<number>; onToggle: (i: number) => void; label: string }) {
  return (
    <div className="vq-bank" role="group" aria-label={label}>
      {items.map((x, i) => (
        <button key={i} type="button" className={`vq-bank-item ${used.has(i) ? 'is-used' : ''}`} aria-pressed={used.has(i)} onClick={() => onToggle(i)}>
          {x}
        </button>
      ))}
    </div>
  );
}
