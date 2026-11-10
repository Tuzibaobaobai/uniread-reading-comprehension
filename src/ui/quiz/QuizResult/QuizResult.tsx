import { QuizButton } from '@/ui/QuizButton/QuizButton';
import './QuizResult.css';

export interface ResultPart {
  key: string;
  /** the kicker: "P1" */
  kicker: string;
  /** the question range: "Q1–Q5" */
  range: string;
  /** questions right / questions: "3/5" */
  points: string;
  /** one mark per question, in order: right (green) / wrong (red) — the correctness bar */
  marks: boolean[];
  /** the spoken label of the whole card */
  label: string;
}
export interface ResultAction {
  key: string;
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  /** Emphasis yes: the card the learner is steered to (brand border) */
  recommended?: boolean;
}

/**
 * ui/QuizResult — extends UniRead UIKit-Quiz `Result` (12409:145740; proposal RC · Proposed 19448:796, the designer's
 * Ready-for-dev frames 3.24 / 3.25, DS-2026-11-03): passed / not passed, the score line, one card per Part (kicker, question
 * range, a bar of right / wrong questions, questions right / total), then the actions. Variants: Pass yes / no;
 * Actions 1 (an outline 查看答案 button — nothing to retry) / 3 (two cards + the 全部重做 button, `secondary`).
 */
export function QuizResult({
  pass,
  title,
  score,
  pending,
  parts,
  actions,
  primary,
  secondary,
}: {
  pass: boolean;
  title: string;
  score: string;
  pending?: string;
  parts: ResultPart[];
  /** Actions 3: the cards (查看答案 / 只练错题) */
  actions?: ResultAction[];
  /** Actions 1: the single outline button (查看答案) */
  primary?: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`question-card vq-result ${pass ? 'is-pass' : 'is-fail'}`}>
      <div className="vq-result-area">
        <h2 className="vq-result-title">{title}</h2>
        <p className="vq-result-score">
          {score}
          {pending && <span className="vq-result-pending"> {pending}</span>}
        </p>
        <ul className="vq-result-sections">
          {parts.map((p) => (
            <li key={p.key} className="vq-result-part" aria-label={p.label}>
              <span className="vq-result-label">{p.kicker}</span>
              <span className="vq-result-range">{p.range}</span>
              <span className={`vq-result-bar${p.marks.length > 10 ? ' is-dense' : ''}`} aria-hidden>
                {p.marks.map((ok, i) => (
                  <i key={i} className={ok ? 'is-right' : 'is-wrong'} />
                ))}
              </span>
              <span className="vq-result-points">{p.points}</span>
            </li>
          ))}
        </ul>
        {actions && actions.length > 0 && (
          <div className="vq-result-actions">
            {actions.map((a) => (
              <button key={a.key} className={`vq-result-card${a.recommended ? ' is-recommended' : ''}`} onClick={a.onClick} disabled={a.disabled}>
                <b>{a.title}</b>
                <span>{a.hint}</span>
              </button>
            ))}
          </div>
        )}
        {primary && (
          <QuizButton className="vq-result-view" onClick={primary.onClick} disabled={primary.disabled}>
            {primary.label}
          </QuizButton>
        )}
        {secondary && (
          <QuizButton variant="primary" className="vq-result-all" onClick={secondary.onClick}>
            {secondary.label}
          </QuizButton>
        )}
      </div>
    </div>
  );
}
