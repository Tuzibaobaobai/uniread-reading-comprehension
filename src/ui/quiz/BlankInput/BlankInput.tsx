import type { InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { BlankNode } from '@/components/Rich';
import './BlankInput.css';

/**
 * rc/Quiz/BlankInput (proposed, Figma RC · Proposed 19446:609): a typed blank inside a sentence — first-letter prefix,
 * the input on one underline, the base word in brackets. Shared by 词汇天天练, 时文阅读 and KET/PET. Variants:
 * Prefix none / first-letter (n.hint.firstLetter); Base none / word (n.hint.baseWord); State Empty / Focus / Filled
 * (value, :focus-within); Result none / correct / wrong (`ok`); Answer none / shown (`correctText` when wrong).
 * Keeps the classes `blank-input`, `blank-input-prefix`, `blank-input-base` that tests and vocab rows select.
 */
export function BlankInput({
  n,
  value,
  onChange,
  ok,
  correctText,
  locked,
  autoFocus,
  baseOutside = false,
  inputAttrs,
}: {
  n: BlankNode;
  value: string;
  onChange: (v: string) => void;
  ok: boolean | null;
  correctText?: string;
  locked: boolean;
  autoFocus?: boolean;
  /** Base outside (词汇测验, Figma 3.14): the base word in brackets stands after the underline, not under it */
  baseOutside?: boolean;
  /** extra attributes for the input (词汇天天练: Enter moves to the next blank, #121 #122) */
  inputAttrs?: InputHTMLAttributes<HTMLInputElement> & Record<`data-${string}`, string>;
}) {
  const { t } = useTranslation();
  const input = (
    <>
      {n.hint?.firstLetter && <span className="blank-input-prefix">{n.hint.firstLetter}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        autoFocus={autoFocus}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="next"
        aria-label={`${t('interaction.slot', { n: n.number ?? '' })}${n.hint?.firstLetter ? t('interaction.firstLetter', { letter: n.hint.firstLetter }) : ''}`}
        placeholder={n.number !== undefined ? String(n.number) : undefined}
        size={Math.max(6, value.length + 1)}
        {...inputAttrs}
      />
    </>
  );
  const result = ok === true ? 'is-correct' : ok === false ? 'is-wrong' : '';
  if (baseOutside)
    return (
      <span className="blank-input-wrap">
        <span className={`blank-input ${result}`}>{input}</span>
        {n.hint?.baseWord && <span className="blank-input-base">({n.hint.baseWord})</span>}
        {ok === false && correctText && <span className="blank-input-answer">{correctText}</span>}
      </span>
    );
  return (
    <span className={`blank-input ${result}`}>
      {input}
      {n.hint?.baseWord && <span className="blank-input-base">({n.hint.baseWord})</span>}
      {ok === false && correctText && <span className="blank-input-answer">{correctText}</span>}
    </span>
  );
}
