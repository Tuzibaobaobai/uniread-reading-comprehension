import type { ReactNode } from 'react';
import './TableFill.css';

/**
 * RC/Quiz/TableFill (proposed, Figma RC · Proposed 19446:779): 第69–70天 — a table printed with answer lines, a typed
 * blank in each answer cell. Variant Cell header / text / blank: the cells are the reader's table blocks (.rt-table),
 * the blank cells the shared BlankInput (rc/Quiz/BlankInput) — both passed in as children.
 */
export function TableFill({ children }: { children: ReactNode }) {
  return <div className="vq-table stimulus">{children}</div>;
}

/**
 * RC/Quiz/TableFill · Cell=score (extension, issue #138; looks like UIKit-Report · cell 13415:104976): a plain
 * label · score table for the exam score report and the conversion table (rc/Exam/ScoreReport, rc/Exam/ScaleTable).
 * Caption BOOLEAN (`caption`); `head` adds the header row. The last column is right-aligned with tabular figures.
 * Keeps the legacy class `.report-table`.
 */
export function ScoreTable({
  caption,
  head,
  rows,
  className = '',
}: {
  caption?: ReactNode;
  head?: [ReactNode, ReactNode];
  rows: { key: string | number; cells: [ReactNode, ReactNode] }[];
  className?: string;
}) {
  return (
    <table className={['report-table', className].filter(Boolean).join(' ')}>
      {caption && <caption>{caption}</caption>}
      {head && (
        <thead>
          <tr>
            <th>{head[0]}</th>
            <th>{head[1]}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.cells[0]}</td>
            <td>{r.cells[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
