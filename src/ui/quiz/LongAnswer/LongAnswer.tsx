import { useEffect, useRef } from 'react';
import './LongAnswer.css';

/**
 * rc/Quiz/LongAnswer (proposed, RC · Proposed — issue #138): the long answer box of 回答问题 and writing tasks; grows
 * with its text. Variants: State Empty / Focus / Filled (value, :focus); Locked no / yes (read-only in review);
 * Rows short (3) / long (6, writing); Counter BOOLEAN (the live word count under the box, Enough no / yes).
 * Keeps the classes `long-answer` / `word-count` the tests and rc/Vocab/TranslateRow use.
 */
export function LongAnswer({
  value,
  onChange,
  locked,
  rows = 'short',
  placeholder,
  counter,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  rows?: 'short' | 'long';
  placeholder?: string;
  /** Counter: the live word count text and whether the minimum is reached */
  counter?: { text: string; enough: boolean };
  className?: string;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ta.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  return (
    <>
      <textarea
        ref={ta}
        className={['long-answer', className].filter(Boolean).join(' ')}
        value={value}
        readOnly={locked}
        placeholder={placeholder}
        rows={rows === 'long' ? 6 : 3}
        autoCapitalize="sentences"
        onChange={(e) => onChange(e.target.value)}
      />
      {counter && (
        <p className={`word-count ${counter.enough ? 'is-enough' : ''}`} aria-live="polite">
          {counter.text}
        </p>
      )}
    </>
  );
}
