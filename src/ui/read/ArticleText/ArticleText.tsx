import type { HTMLAttributes, ReactNode } from 'react';
import './ArticleText.css';

export type ArticleTextSize = 'reading' | 'paper';

/**
 * RC/Read/ArticleText (proposed text styles "Article Text/*", issue #138): the article column — body size, width and
 * the rich-text styles (.rt-*) that `Rich` and `Block` render inside it. Styles: Body · Heading · List · Vocab ·
 * Underline · Note · Table · Callout. Keeps the legacy class `article` (exam panes render it directly).
 * Size `reading` = the 时文 article, the designer's `正文` (Figma 19834:169249): 18 px on a double line, paragraphs 24 px
 * apart, glosses at body size in text/secondary, key words bold on a brand/2 band. Size `paper` (default) = the exam
 * paper's material (Article Text / paragraph, 22 / 32).
 */
export function ArticleText({ size = 'paper', className = '', children, ...rest }: { size?: ArticleTextSize; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <article className={['article', size === 'reading' ? 'is-reading' : '', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </article>
  );
}

/** the article's body: the blocks, spaced one line apart */
export function ArticleBody({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={['article-body', className].filter(Boolean).join(' ')}>{children}</div>;
}
