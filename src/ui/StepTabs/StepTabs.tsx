import { Fragment } from 'react';
import sepLine from '@/assets/icons/step-line.svg';
import { StepIcon, type Step } from '@/ui/StepIcon/StepIcon';
import './StepTabs.css';

/**
 * ui/StepTabs — extends UniRead UIKit-LearnNav `Tabs` (15476:221046; proposal RC · Proposed 19447:773), Figma Header ·
 * Read/Speak/Quiz (7762-32671). Variants: Flow Learn / Vocab (here Vocab: 速览 / 学习 / 测验, #133) × Step 1 / 2 / 3
 * (`current`); each item (7805:90511) has Text, Selected and State (Default / Hover, CSS), dotted separators between.
 */
export function StepTabs<T extends Step>({ label, steps, current, onSelect }: { label: string; steps: { id: T; label: string }[]; current: T; onSelect: (id: T) => void }) {
  return (
    <div className="mode-tabs" role="tablist" aria-label={label}>
      {steps.map((d, i) => (
        <Fragment key={d.id}>
          {i > 0 && <img className="mode-tab-sep" src={sepLine} alt="" />}
          <button role="tab" aria-selected={current === d.id} className={`mode-tab ${current === d.id ? 'is-active' : ''}`} onClick={() => onSelect(d.id)}>
            <StepIcon icon={d.id} /> {d.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
