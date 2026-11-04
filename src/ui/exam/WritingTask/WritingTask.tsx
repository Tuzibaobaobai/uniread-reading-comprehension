import type { HTMLAttributes, ReactNode } from 'react';
import './WritingTask.css';

export type WritingKind = 'email' | 'story' | 'choose-one';

/**
 * RC/Exam/WritingTask (proposed, issue #138): the writing task block under the prompt — the printed text in its
 * genre layout (`stimulus`, .task-stimulus, #96), the closing instruction (`task`, .task-line), then the answer
 * (rc/Quiz/LongAnswer etc., `children`). Variant Kind email / story / choose-one (choose-one: PET Writing Part 2,
 * the ui/ChoiceCard task cards and the switch confirm, rc/Common/InlineNotice with class .task-switch).
 */
export function WritingTask({ kind, stimulus, task, children }: { kind: WritingKind; stimulus?: ReactNode; task?: ReactNode; children?: ReactNode }) {
  return (
    <>
      {stimulus && <div className={`task-stimulus is-${kind}`}>{stimulus}</div>}
      {task && <p className="task-line">{task}</p>}
      {children}
    </>
  );
}

/** printed material above typed blanks or a writing task (a section's stimulus); keeps the class .stimulus */
export function Stimulus({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['stimulus', className].filter(Boolean).join(' ')} {...rest} />;
}

