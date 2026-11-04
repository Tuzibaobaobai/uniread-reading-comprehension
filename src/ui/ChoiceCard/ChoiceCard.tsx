import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Tag } from '@/ui/common/Tag/Tag';
import './ChoiceCard.css';

/**
 * ui/ChoiceCard — extends UniRead UIKit-Quiz · item (12409:145227) (`ui/ChoiceCard`, issue #138): a tappable card with
 * a title and a description — 练习 / 考试模式 (ModeDialog) and the PET Writing Part 2 task cards (choose one).
 * Variants: Selected no / yes; Tag BOOLEAN (the 未选择 label, rc/Common/Tag neutral); Disabled no / yes (`dim`: an
 * unchosen task after submitting). `size` l = the mode options' 2xl title, m = the task cards' l title with the tag
 * (not yet a Figma variant — reported to the registry). Callers keep their legacy hooks via `className`
 * (.mode-option, .task-card) and the title / text classes via `titleClassName` / `textClassName`.
 */
export function ChoiceCard({
  title,
  tag,
  selected = false,
  dim = false,
  size = 'm',
  className = '',
  titleClassName = '',
  textClassName = '',
  children,
  ...rest
}: {
  title: ReactNode;
  tag?: ReactNode;
  selected?: boolean;
  dim?: boolean;
  size?: 'l' | 'm';
  titleClassName?: string;
  textClassName?: string;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'>) {
  return (
    <button
      type="button"
      className={['choice-card', `is-${size}`, selected ? 'is-selected' : '', dim ? 'is-unchosen' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className={['choice-card-title', titleClassName].filter(Boolean).join(' ')}>
        {title}
        {tag && <Tag tone="neutral">{tag}</Tag>}
      </span>
      {children && <span className={['choice-card-text', textClassName].filter(Boolean).join(' ')}>{children}</span>}
    </button>
  );
}

/** the cards' container: `list` stacks them (mode options), `columns` wraps them side by side (task cards) */
export function ChoiceCardGroup({ layout = 'list', className = '', ...rest }: { layout?: 'list' | 'columns' } & HTMLAttributes<HTMLDivElement>) {
  return <div className={['choice-card-group', `is-${layout}`, className].filter(Boolean).join(' ')} {...rest} />;
}
