import pin from '@/assets/icons/flag-toggle.svg';
import pinOn from '@/assets/icons/flag-toggle-on.svg';
import './FlagToggle.css';

/**
 * ui/quiz/FlagToggle — designer component `flag-toggle` (Figma 19834:178047; Ready frame 考试模式-标记 20000:222105, #152):
 * 真题 exam mode 标记本题, in the question's title row after the stem (after the number when there is no stem;
 * rc/Quiz/QuestionPrompt `aside`). Variant 标记 no: a 32 pill, light gradient, orange pin; yes: orange gradient, white
 * pin — no text. A toggle (aria-pressed); drawn 32 × 28, the tap target 44.
 */
export function FlagToggle({ flagged, label, flaggedLabel, onToggle }: { flagged: boolean; label: string; flaggedLabel: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`flag-toggle ${flagged ? 'is-flagged' : ''}`}
      aria-pressed={flagged}
      aria-label={label}
      title={flagged ? flaggedLabel : label}
      onClick={onToggle}
    >
      <img src={flagged ? pinOn : pin} alt="" />
    </button>
  );
}
