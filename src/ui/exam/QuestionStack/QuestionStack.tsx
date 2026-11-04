import type { ReactNode } from 'react';
import { OptionSizeContext } from '../../quiz/OptionItem/OptionItem';
import './QuestionStack.css';

export type StackDensity = 'default' | 'compact';

/**
 * rc/Exam/QuestionStack (proposed, RC · Proposed — issue #138, screen 2.09): every question of an exam Part on one page
 * (KET / PET Listening parts with one continuous recording), stacked with their options as printed. Variants: Density
 * default / compact — compact tightens the gaps, sets the prompt at 2xl and gives the ui/quiz/OptionItem rows inside
 * Size compact (through OptionSizeContext). Keeps the classes `part-stack` / `part-stack-q` the tests select.
 */
export function QuestionStack({ density = 'compact', children }: { density?: StackDensity; children: ReactNode }) {
  return (
    <OptionSizeContext.Provider value={density}>
      <div className={['part-stack', density === 'compact' ? 'is-compact' : ''].filter(Boolean).join(' ')}>{children}</div>
    </OptionSizeContext.Provider>
  );
}

/** one question of the stack: a labelled section around its QuestionPrompt and options */
export function QuestionStackItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="part-stack-q" aria-label={label}>
      {children}
    </section>
  );
}
