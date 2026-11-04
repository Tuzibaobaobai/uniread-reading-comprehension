import type { HTMLAttributes, ReactNode } from 'react';
import './ArticleText.css';

/**
 * RC/Read/ArticleText (proposed text styles "Article Text/*", issue #138): the article column — body size, width and
 * the rich-text styles (.rt-*) that `Rich` and `Block` render inside it. Styles: Body · Heading · List · Vocab ·
 * Underline · Note · Table · Callout. Keeps the legacy class `article` (exam panes render it directly).
 */
export function ArticleText({ className = '', children, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <article className={['article', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </article>
  );
}

/** the article's body: the blocks, spaced one line apart */
export function ArticleBody({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={['article-body', className].filter(Boolean).join(' ')}>{children}</div>;
}
