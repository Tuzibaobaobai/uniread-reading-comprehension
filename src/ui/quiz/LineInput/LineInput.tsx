import type { InputHTMLAttributes } from 'react';
import './LineInput.css';

export type LineResult = 'none' | 'correct' | 'wrong';

/**
 * RC/Quiz/LineInput (proposed, Figma RC · Proposed 19446:589): a standalone answer line (word / Chinese meaning) in the
 * KET / PET underlined-blank style (#121 #122). Variants: State Empty / Focus / Filled (CSS), Result none / correct /
 * wrong, Locked no / yes (read-only), Lang en / zh. `inputAttrs` carries the page's field behaviour (Enter → next).
 */
export function LineInput({
  value,
  onChange,
  locked,
  label,
  placeholder,
  result = 'none',
  lang,
  inputAttrs,
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  label: string;
  placeholder: string;
  result?: LineResult;
  lang: 'en' | 'zh';
  inputAttrs?: InputHTMLAttributes<HTMLInputElement> & Record<`data-${string}`, string>;
}) {
  const en = lang === 'en';
  return (
    <span className={`blank-input vq-line ${en ? '' : 'is-zh'} ${result === 'none' ? '' : `is-${result}`}`}>
      <input
        {...inputAttrs}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        aria-label={label}
        placeholder={placeholder}
        lang={en ? 'en' : 'zh-CN'}
        enterKeyHint="next"
        autoComplete="off"
        {...(en ? { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false } : {})}
      />
    </span>
  );
}
