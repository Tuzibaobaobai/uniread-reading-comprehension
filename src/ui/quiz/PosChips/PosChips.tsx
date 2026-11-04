import './PosChips.css';

/**
 * RC/Quiz/PosChips (proposed, Figma RC · Proposed 19446:620): 词性 choice as tap chips (no native select).
 * Variants: Selected no / yes (per chip), State Default / Hover (CSS), Result none / correct / wrong (the group).
 */
export function PosChips({
  options,
  value,
  onChange,
  disabled,
  label,
  result = 'none',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  label: string;
  result?: 'none' | 'correct' | 'wrong';
}) {
  return (
    <span className={`vq-pos ${result === 'none' ? '' : `is-${result}`}`} role="radiogroup" aria-label={label}>
      {options.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={value === p} className={`vq-pos-chip ${value === p ? 'is-on' : ''}`} disabled={disabled} onClick={() => onChange(value === p ? '' : p)}>
          {p}
        </button>
      ))}
    </span>
  );
}
