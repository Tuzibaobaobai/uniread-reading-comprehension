import { Check } from '@/components/Icons';
import { Chip } from '../../common/Chip/Chip';
import './SelfAssess.css';

/**
 * rc/Quiz/SelfAssess (proposed, RC · Proposed — issue #138): "did you get it right?" after an answer the judge could not
 * score. Variants: Answer none / yes / no (the chosen rc/Common/Chip turns correct / wrong). Keeps the class
 * `self-assess` the tests select.
 */
export function SelfAssess({
  answer,
  question,
  yesLabel,
  noLabel,
  onAnswer,
}: {
  /** undefined = Answer none */
  answer?: boolean;
  question: string;
  yesLabel: string;
  noLabel: string;
  onAnswer: (right: boolean) => void;
}) {
  return (
    <div className="self-assess">
      <span>{question}</span>
      <Chip tone={answer === true ? 'correct' : 'neutral'} icon={<Check />} onClick={() => onAnswer(true)}>
        {yesLabel}
      </Chip>
      <Chip tone={answer === false ? 'wrong' : 'neutral'} onClick={() => onAnswer(false)}>
        {noLabel}
      </Chip>
    </div>
  );
}
