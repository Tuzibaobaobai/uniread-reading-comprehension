import { createContext, useContext, type ReactNode } from 'react';
import { HintText } from '../../common/HintText/HintText';
import './QuestionPrompt.css';

/**
 * Something drawn at the end of one question's title row — 真题 exam mode 标记本题 (ui/quiz/FlagToggle, #152). The page
 * provides it with the number of the question it belongs to; only that question's prompt draws it.
 */
export const PromptAside = createContext<{ number: number | string; node: ReactNode } | null>(null);

/**
 * rc/Quiz/QuestionPrompt (proposed, RC · Proposed — issue #138): the question number + stem, shared by 时文阅读 and
 * KET/PET. Variants: Number (text); Stem BOOLEAN (exam notice questions print the number only — pass no children);
 * Hint BOOLEAN (rc/Common/HintText right under the prompt); aside (PromptAside: number | stem | flag, as in the Ready
 * frame 考试模式-标记 20000:222105 — after the number when there is no stem). Keeps the classes `q-prompt` / `q-num`.
 */
export function QuestionPrompt({ number, hint, children }: { number: number | string; hint?: ReactNode; children?: ReactNode }) {
  const aside = useContext(PromptAside);
  const stem = children !== undefined && children !== null && children !== false && children !== '';
  return (
    <>
      <h2 className="q-prompt">
        <span className="q-num">{number}.</span>
        {stem && <span className="q-stem">{children}</span>}
        {aside && String(aside.number) === String(number) && <span className="q-prompt-aside">{aside.node}</span>}
      </h2>
      {hint !== undefined && <HintText>{hint}</HintText>}
    </>
  );
}
