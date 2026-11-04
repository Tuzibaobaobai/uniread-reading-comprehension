import type { ReactNode } from 'react';
import './ArticleHeader.css';

export interface ArticleInfoRow {
  label: string;
  value: ReactNode;
  /** spans both columns (the article's introduction) */
  wide?: boolean;
}

/**
 * RC/Read/ArticleHeader (proposed, issue #138; merges RC/Read/ArticleInfo and RC/Exam/PartHeading): the head of the
 * material pane — optional kicker (the paper's name), the article / Part title, optional instruction, optional info
 * box (体裁 / 词数 / 难度 / 建议用时 …). Variants: Kicker, Info, Instruction (BOOLEAN — shown when given); the
 * listening stack shows the kicker alone (no title).
 * Keeps the legacy classes (.article-title, .info-box, .info-box-row, .exam-part-kicker, .exam-instruction).
 */
export function ArticleHeader({ kicker, title, instruction, info }: { kicker?: ReactNode; title?: ReactNode; instruction?: ReactNode; info?: ArticleInfoRow[] }) {
  return (
    <header className="article-header">
      {kicker && <p className="exam-part-kicker">{kicker}</p>}
      {title && <h1 className="article-title">{title}</h1>}
      {instruction && <p className="exam-instruction">{instruction}</p>}
      {info && info.length > 0 && (
        <dl className="info-box">
          {info.map((r) => (
            <div key={r.label} className={['info-box-row', r.wide ? 'info-box-intro' : ''].filter(Boolean).join(' ')}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
