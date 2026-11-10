import type { ReactNode } from 'react';
import './WordFamilyRow.css';

/**
 * RC/Vocab/WordFamilyRow (proposed, Figma RC · Proposed 19446:726; the designer's rows 19459:749…): 三 (#120) — a white
 * card: "21. enable" (number + the given word, bold) and one line per target part of speech: "adj." + "英文单词：" line +
 * "中文释义：" line. A layout container: each slot's word / meaning fields come in as LineInputs. Variants Result none /
 * correct / wrong / partial and Locked no / yes are carried by those fields and the row.
 */
export function WordFamilyRow({
  num,
  base,
  wordLabel,
  zhLabel,
  slots,
}: {
  num: string;
  base: string;
  wordLabel: string;
  zhLabel: string;
  slots: { id: string; pos: string; word: ReactNode; zh: ReactNode }[];
}) {
  return (
    <div className="vq-family">
      <div className="vq-family-head">
        <span className="vq-num">{num}</span>
        <b className="vq-base" lang="en">
          {base}
        </b>
      </div>
      <div className="vq-slots">
        {slots.map((s) => (
          <div key={s.id} className="vq-slot">
            <span className="vq-slot-pos">{s.pos}</span>
            <label className="vq-field">
              <span className="vq-field-label">{wordLabel}</span>
              {s.word}
            </label>
            <label className="vq-field">
              <span className="vq-field-label">{zhLabel}</span>
              {s.zh}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
