import type { ReactNode } from 'react';
import { PlayButton } from '@/ui/PlayButton/PlayButton';
import './ScanCard.css';

export type Marked = 'none' | 'known' | 'unknown';

/**
 * RC/Vocab/ScanCard (proposed, Figma RC · Proposed 19443:488; laid out by the UniRead designer in RC · Screens 3.03–3.05,
 * Ready for dev): 速览 — one word a page. previous | n/total, headword + IPA, btn-play, the two MarkButtons | next.
 * Variant Marked = none / known / unknown colours the headword like Study does.
 */
export function ScanCard({
  word,
  ipa,
  marked,
  playLabel,
  onPlay,
  count,
  countLabel,
  label,
  prev,
  next,
  actions,
}: {
  word: string;
  ipa: string[];
  marked: Marked;
  playLabel: string;
  onPlay: () => void;
  /** "n/total" */
  count: string;
  countLabel: string;
  /** names the card for assistive tech (it holds the word pager) */
  label: string;
  /** the ui/ArrowButton on either side */
  prev: ReactNode;
  next: ReactNode;
  /** the two ui/vocab/MarkButton */
  actions: ReactNode;
}) {
  return (
    <div className="scan-card" role="group" aria-label={label}>
      {prev}
      <div className="scan-area">
        <span className="scan-count" aria-label={countLabel}>
          {count}
        </span>
        <div className="scan-stage" aria-live="polite">
          <div className="scan-headword">
            <h2 className={`scan-word is-${marked}`} lang="en">
              {word}
            </h2>
            {!!ipa.length && (
              <p className="scan-ipa">
                {ipa.map((p) => (
                  <span key={p}>/{p}/</span>
                ))}
              </p>
            )}
          </div>
          <PlayButton size="card" label={playLabel} onPlay={onPlay} />
        </div>
        <div className="scan-actions">{actions}</div>
      </div>
      {next}
    </div>
  );
}
