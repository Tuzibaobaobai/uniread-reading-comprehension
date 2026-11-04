import './RadioMark.css';

export type RadioTone = 'neutral' | 'accent' | 'success' | 'danger';

/**
 * ui/quiz/RadioMark — extends UniRead UIKit-Quiz `Type` (6759:44371): the single-choice circle on its own (option rows,
 * the KET Reading Part 2 grid). Variants: Type 单选; Check no / yes (the dot); Tone accent / success / danger (new —
 * selected / correct / wrong; neutral = grey ring). Keeps the class `option-radio` (+ `is-on`) that tests and the
 * exam grid (.part-grid-cell) select.
 */
export function RadioMark({ checked, tone = 'neutral' }: { checked: boolean; tone?: RadioTone }) {
  return <span className={['option-radio', checked ? 'is-on' : '', tone === 'neutral' ? '' : `is-${tone}`].filter(Boolean).join(' ')} />;
}
