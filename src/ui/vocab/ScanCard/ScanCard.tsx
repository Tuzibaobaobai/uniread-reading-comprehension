import { PlayButton } from '@/ui/PlayButton/PlayButton';
import './ScanCard.css';

export type Marked = 'none' | 'known' | 'unknown';

/**
 * RC/Vocab/ScanCard (proposed, Figma RC · Proposed 19443:488): 速览 — one word a page, headword + IPA + play.
 * Variant Marked = none / known / unknown colours the headword like Study does.
 */
export function ScanCard({ word, ipa, marked, playLabel, onPlay }: { word: string; ipa: string[]; marked: Marked; playLabel: string; onPlay: () => void }) {
  return (
    <div className="scan-stage" aria-live="polite">
      <div className="scan-word-row">
        <h2 className={`scan-word is-${marked}`} lang="en">
          {word}
        </h2>
        <PlayButton label={playLabel} onPlay={onPlay} />
      </div>
      {!!ipa.length && (
        <p className="scan-ipa">
          {ipa.map((p) => (
            <span key={p}>/{p}/</span>
          ))}
        </p>
      )}
    </div>
  );
}
