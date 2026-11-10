import type { ReactNode } from 'react';
import './WordProfileRow.css';

/**
 * RC/Vocab/WordProfileRow (proposed, Figma RC · Proposed 19446:693; the designer's rows in 词汇 › 测验 19459:535…): 一 (#117)
 * — a white card: the number and the IPA at the left, "英文单词：" + line and "中文释义：" + line on one row, "词性：" + the
 * chips below. A layout container: the fields come in as slots (LineInput ×2, PosChips). Variants Result none / correct /
 * wrong / partial and Locked no / yes are carried by those fields and by the question row (after submitting the row gets
 * a border and the answer box below).
 */
export function WordProfileRow({
  num,
  ipa,
  word,
  zh,
  wordLabel,
  zhLabel,
  posLabel,
  pos,
}: {
  num: string;
  ipa: ReactNode;
  word: ReactNode;
  zh: ReactNode;
  wordLabel: string;
  zhLabel: string;
  posLabel: string;
  pos: ReactNode;
}) {
  return (
    <div className="vq-profile">
      <span className="vq-num">{num}</span>
      <span className="vq-ipa">{ipa}</span>
      <div className="vq-profile-fields">
        <div className="vq-line-row">
          <label className="vq-field">
            <span className="vq-field-label">{wordLabel}</span>
            {word}
          </label>
          <label className="vq-field">
            <span className="vq-field-label">{zhLabel}</span>
            {zh}
          </label>
        </div>
        <div className="vq-pos-row">
          <span className="vq-pos-label">{posLabel}</span>
          {pos}
        </div>
      </div>
    </div>
  );
}
