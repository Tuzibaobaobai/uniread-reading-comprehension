import type { ReactNode } from 'react';
import { HintText } from '../../common/HintText/HintText';
import './QuestionPrompt.css';

/**
 * rc/Quiz/QuestionPrompt (proposed, RC · Proposed — issue #138): the question number + stem, shared by 时文阅读 and
 * KET/PET. Variants: Number (text); Stem BOOLEAN (exam notice questions print the number only — pass no children);
 * Hint BOOLEAN (rc/Common/HintText right under the prompt). Keeps the classes `q-prompt` / `q-num` the tests select.
 */
export function QuestionPrompt({ number, hint, children }: { number: number | string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <>
      <h2 className="q-prompt">
        <span className="q-num">{number}.</span>
        <span>{children}</span>
      </h2>
      {hint !== undefined && <HintText>{hint}</HintText>}
    </>
  );
}
