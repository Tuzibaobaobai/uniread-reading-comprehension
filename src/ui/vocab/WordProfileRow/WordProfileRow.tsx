import type { ReactNode } from 'react';
import './WordProfileRow.css';

/**
 * RC/Vocab/WordProfileRow (proposed, Figma RC · Proposed 19446:693): 一 (#117) — IPA | word + meaning on one line, the
 * 词性 label and chips below, the label in line with the word. A layout container: the fields come in as slots
 * (LineInput ×2, PosChips). Variants Result none / correct / wrong / partial and Locked no / yes are carried by those
 * fields and by the question row.
 */
export function WordProfileRow({ ipa, word, zh, posLabel, pos }: { ipa: ReactNode; word: ReactNode; zh: ReactNode; posLabel: string; pos: ReactNode }) {
  return (
    <div className="vq-profile">
      <span className="vq-ipa">{ipa}</span>
      <div className="vq-profile-fields">
        <div className="vq-line-row">
          {word}
          {zh}
        </div>
        <div className="vq-pos-row">
          <span className="vq-pos-label">{posLabel}</span>
          {pos}
        </div>
      </div>
    </div>
  );
}
