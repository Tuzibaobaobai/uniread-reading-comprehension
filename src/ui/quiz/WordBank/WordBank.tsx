import type { ReactNode } from 'react';
import { LetterBadge } from '../../LetterBadge/LetterBadge';
import './WordBank.css';

export type BankUse = 'no' | 'here' | 'elsewhere';

/**
 * rc/Quiz/WordBank (proposed, RC · Proposed — issue #138): the word / sentence bank of 选词填空 and PET Reading Part 4.
 * Variants: Layout word (grid) / sentence (one per row); per entry Used no / here / elsewhere (with the 第 n 题 tag),
 * Result none / correct, Locked no / yes. The entry letter is ui/LetterBadge. Keeps the classes `bank` /
 * `bank-entry` (+ is-here / is-used / is-correct) the tests select.
 */
export function WordBank({ layout = 'word', children }: { layout?: 'word' | 'sentence'; children: ReactNode }) {
  return <div className={`bank ${layout === 'sentence' ? 'bank-sentences' : ''}`}>{children}</div>;
}

export function WordBankEntry({
  letter,
  used = 'no',
  usedLabel,
  correct = false,
  locked,
  onClick,
  children,
}: {
  letter: string;
  used?: BankUse;
  /** Used elsewhere: the tag naming the question that holds the entry */
  usedLabel?: string;
  /** Result correct (review: the right answer) */
  correct?: boolean;
  locked: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const usedClass = used === 'here' ? 'is-here' : used === 'elsewhere' ? 'is-used' : '';
  return (
    <button className={`bank-entry ${usedClass} ${correct ? 'is-correct' : ''}`} disabled={locked} onClick={onClick}>
      <LetterBadge className="bank-letter" filled={used === 'here'} tone={used === 'here' ? 'accent' : 'neutral'}>
        {letter}
      </LetterBadge>
      <span className="bank-text">{children}</span>
      {used === 'elsewhere' && usedLabel && <span className="bank-used">{usedLabel}</span>}
    </button>
  );
}
