import { createContext, useContext, type ReactNode } from 'react';
import tipIcon from '@/assets/icons/tip.svg';
import { Locate } from '@/components/Icons';
import { Chip } from '../../common/Chip/Chip';
import { RadioMark } from '../RadioMark/RadioMark';
import './OptionItem.css';

export type OptionState = 'default' | 'selected' | 'wrong' | 'correct';

const RADIO_TONE = { default: 'neutral', selected: 'accent', wrong: 'danger', correct: 'success' } as const;

/** Size default / compact (new — five questions on one page, exam notices) */
export type OptionSize = 'default' | 'compact';
/**
 * The Size a container gives the option rows inside it (rc/Exam/QuestionStack provides compact), so a shared option
 * list does not need the prop threaded through. An explicit `size` prop wins.
 */
export const OptionSizeContext = createContext<OptionSize>('default');

/**
 * ui/quiz/OptionItem — extends UniRead UIKit-Quiz `option-text-item` (7301:61934): one option row of a single choice /
 * true-false / picture question. Variants: State default / (hover) / selected / wrong / correct (+ correct-expanded when
 * `explain` is given); Checked no / yes (the RadioMark dot); Media text / image (new); Locked no / yes (new — review is
 * read-only, rendered as a div); Locate BOOLEAN (new — the 定位原文 Chip in the explanation); Size default / compact
 * (new — `size`, or OptionSizeContext from rc/Exam/QuestionStack). Keeps the classes `option`, `option-text`, `option-image`, `option-explain-text`.
 */
export function OptionItem({
  state = 'default',
  selected,
  checked,
  locked,
  letter,
  image,
  ariaLabel,
  onSelect,
  explain,
  size,
  children,
}: {
  state?: OptionState;
  /** the learner's choice (aria-checked) */
  selected: boolean;
  /** the radio dot: the choice while answering; the choice and the right answer in review */
  checked: boolean;
  locked: boolean;
  /** the letter before the text ("A. "); omitted for T / F */
  letter?: string;
  /** Media image: the picture replaces the text */
  image?: { src: string; alt: string };
  ariaLabel?: string;
  onSelect?: () => void;
  /** correct-expanded: explanation text and the 定位原文 chip (only shown when locked) */
  explain?: { text?: string; locateLabel?: string; onLocate?: () => void };
  /** Size; defaults to the surrounding OptionSizeContext */
  size?: OptionSize;
  /** Media text: the option's content */
  children?: ReactNode;
}) {
  const contextSize = useContext(OptionSizeContext);
  const stateClass = [state === 'default' ? '' : `is-${state}`, (size ?? contextSize) === 'compact' ? 'is-compact' : ''].filter(Boolean).join(' ');
  const row = (
    <span className="option-row">
      <span className="option-radio-box" aria-hidden>
        <RadioMark checked={checked} tone={RADIO_TONE[state]} />
      </span>
      <span className="option-text">
        {letter && <span className="option-letter">{letter}. </span>}
        {image ? <img className="option-image" src={image.src} alt={image.alt} /> : children}
      </span>
    </span>
  );
  if (!locked) {
    return (
      <button role="radio" aria-checked={selected} aria-label={ariaLabel} className={`option ${stateClass}`} onClick={onSelect}>
        {row}
      </button>
    );
  }
  return (
    <div role="radio" aria-checked={selected} aria-label={ariaLabel} className={`option ${stateClass}`}>
      {row}
      {explain && (
        <div className="option-explain">
          <img className="option-explain-icon" src={tipIcon} alt="" />
          <div className="option-explain-body">
            {explain.text && <p className="option-explain-text">{explain.text}</p>}
            {explain.onLocate && (
              <Chip icon={<Locate />} onClick={explain.onLocate}>
                {explain.locateLabel}
              </Chip>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** the radiogroup around the option rows; Media image lays the picture options side by side */
export function OptionGroup({ images, imageList, locked, size, children }: { images?: boolean; imageList?: boolean; locked: boolean; size?: OptionSize; children: ReactNode }) {
  const contextSize = useContext(OptionSizeContext);
  const cls = ['options', images ? 'has-images' : '', images && imageList ? 'is-image-list' : '', (size ?? contextSize) === 'compact' ? 'is-compact' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls} role="radiogroup" aria-readonly={locked || undefined}>
      {children}
    </div>
  );
}
