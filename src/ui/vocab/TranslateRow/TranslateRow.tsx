import type { ReactNode, TextareaHTMLAttributes } from 'react';
import './TranslateRow.css';

/**
 * RC/Vocab/TranslateRow (proposed, Figma RC · Proposed 19446:765): 中译英 — the Chinese sentence, the word to use in
 * brackets, a multi-line answer (the shared reader `.long-answer`). Variants: State Empty / Filled (the value), Result
 * none / judged (the judge's verdict shows below, in AnswerFeedback).
 */
export function TranslateRow({
  prompt,
  requiredWord,
  value,
  onChange,
  locked,
  label,
  placeholder,
  textareaAttrs,
}: {
  prompt: ReactNode;
  requiredWord?: string;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  label: string;
  placeholder: string;
  textareaAttrs?: TextareaHTMLAttributes<HTMLTextAreaElement> & Record<`data-${string}`, string>;
}) {
  return (
    <div className="vq-translate">
      <p className="vq-zh-sentence">
        {prompt}
        {requiredWord && <span className="vq-required" lang="en">（{requiredWord}）</span>}
      </p>
      <textarea
        {...textareaAttrs}
        className="long-answer vq-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        rows={2}
        lang="en"
        aria-label={label}
        placeholder={placeholder}
        autoCapitalize="sentences"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
}
