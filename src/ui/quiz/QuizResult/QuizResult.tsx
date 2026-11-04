import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import { QuizButton } from '@/ui/QuizButton/QuizButton';
import './QuizResult.css';

export interface ResultPart {
  key: string;
  label: string;
  points: string;
  ok: boolean;
  /** alt text of the correct / wrong icon */
  iconLabel: string;
}
export interface ResultAction {
  key: string;
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * ui/QuizResult — extends UniRead UIKit-Quiz `Result` (12409:145740; proposal RC · Proposed 19448:796), Figma Quiz
 * 完成结果 (15643-204521): passed / not passed, the score line, each Part with the quiz result icon (12409:123905),
 * the action cards (查看答案 / 只练错题 or 全部重做). Variants: Pass yes / no; Actions 2 (two cards) / 3 (+ the
 * 全部重做 button, `secondary`).
 */
export function QuizResult({
  pass,
  title,
  score,
  pending,
  parts,
  actions,
  secondary,
}: {
  pass: boolean;
  title: string;
  score: string;
  pending?: string;
  parts: ResultPart[];
  actions: ResultAction[];
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`question-card vq-result ${pass ? 'is-pass' : 'is-fail'}`}>
      <h2 className="vq-result-title">{title}</h2>
      <p className="vq-result-score">
        {score}
        {pending && <span className="vq-result-pending"> {pending}</span>}
      </p>
      <ul className="vq-result-sections">
        {parts.map((p) => (
          <li key={p.key}>
            <img src={p.ok ? correctIcon : wrongIcon} alt={p.iconLabel} />
            <span className="vq-result-label">{p.label}</span>
            <span className="vq-result-points">{p.points}</span>
          </li>
        ))}
      </ul>
      <div className="vq-result-actions">
        {actions.map((a) => (
          <button key={a.key} className="vq-result-card" onClick={a.onClick} disabled={a.disabled}>
            <b>{a.title}</b>
            <span>{a.hint}</span>
          </button>
        ))}
      </div>
      {secondary && (
        <QuizButton className="vq-result-all" onClick={secondary.onClick}>
          {secondary.label}
        </QuizButton>
      )}
    </div>
  );
}
