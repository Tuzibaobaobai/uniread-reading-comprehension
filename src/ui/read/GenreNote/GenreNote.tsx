import type { HTMLAttributes, ReactNode } from 'react';
import './GenreNote.css';

export type GenreNoteStyle = 'plain' | 'email' | 'notice';

export interface GenreNoteField {
  /** "From:" / "To:" / "Subject:" — omitted for an unlabelled header line */
  label?: string;
  value: ReactNode;
}

/**
 * RC/Read/GenreNote (proposed, issue #138; merges RC/Read/NoteCard, GenreNote and EmailField): printed exam material
 * — a note / letter (plain), an email (dark title bar, grey header band with From / To / Subject field boxes) or a
 * notice (title bar, centred big heading). Variants: Style plain / email / notice; Header (BOOLEAN — `header`
 * fields given); Signature (BOOLEAN). Extra attributes (data-block, the evidence class) go on the block.
 * Keeps the legacy classes (.rt-note, .is-email / .is-notice, .rt-note-title, .rt-note-header, .rt-note-field,
 * .rt-note-field-label, .rt-note-field-value, .rt-note-heading, .rt-note-sign) that e2e/ket.spec.ts and
 * e2e/pet.spec.ts use.
 */
export function GenreNote({
  noteStyle = 'plain',
  title,
  header,
  heading,
  paragraphs,
  signature,
  className = '',
  ...rest
}: {
  noteStyle?: GenreNoteStyle;
  title?: ReactNode;
  header?: GenreNoteField[];
  heading?: ReactNode;
  paragraphs: ReactNode[];
  signature?: ReactNode[];
} & Omit<HTMLAttributes<HTMLDivElement>, 'title'>) {
  return (
    <div className={['rt-note', noteStyle !== 'plain' && `is-${noteStyle}`, className].filter(Boolean).join(' ')} {...rest}>
      {title && <p className="rt-note-title">{title}</p>}
      {header && header.length > 0 && (
        <div className="rt-note-header">
          {header.map((f, i) => (
            <div key={i} className="rt-note-field">
              {f.label && <span className="rt-note-field-label">{f.label}</span>}
              <span className="rt-note-field-value">{f.value}</span>
            </div>
          ))}
        </div>
      )}
      {heading && <p className="rt-note-heading">{heading}</p>}
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {signature?.map((s, i) => (
        <p key={`s${i}`} className="rt-note-sign">
          {s}
        </p>
      ))}
    </div>
  );
}
