import type { ReactNode } from 'react';
import { Check, Cross } from '@/components/Icons';
import { Tag } from '../../common/Tag/Tag';
import './JudgeResult.css';

export type JudgeMet = 'yes' | 'partial' | 'no';

export interface JudgeCriterion {
  id: string;
  name: string;
  band: number;
  weight: number;
}

/**
 * rc/Quiz/JudgeResult (proposed, Figma RC · Proposed 19446:739): the LLM judge's verdict (docs/09) — score, key points
 * or Cambridge criteria, feedback, language fixes. Shared by 词汇天天练, 时文阅读 and KET/PET writing / speaking.
 * Variants: Score full / partial / zero (from score / max); Pending no / yes (JudgePending); Rubric points (key points
 * met yes / partial / no) / cambridge (criteria bars + the standard note); NeedsReview no / yes (the 待复核 Tag).
 * Keeps the classes `judge`, `judge-score`, `judge-point`, `judge-tag` the tests select.
 */
export function JudgeResult({
  label,
  score,
  max,
  tag,
  reviewTag,
  standard,
  criteria,
  extraCriterion,
  points,
  feedback,
  issues,
}: {
  /** aria-label of the card */
  label: string;
  score: number;
  max: number;
  /** the tag after the score (模型评分 / 剑桥标准) */
  tag: string;
  /** NeedsReview yes: the 待复核 tag text */
  reviewTag?: string;
  /** Rubric cambridge: the note on the standard used */
  standard?: string;
  /** Rubric cambridge: one bar per criterion */
  criteria?: JudgeCriterion[];
  /** Rubric cambridge: a greyed row that is not assessed (speaking: pronunciation) */
  extraCriterion?: { name: string; note: string };
  /** Rubric points: the key points with whether each was met */
  points?: { id: string; desc: string; met: JudgeMet; metLabel: string }[];
  feedback?: string;
  /** language fixes: wrong text → fix, with an optional note (already formatted) */
  issues?: { text: string; fix: string; note?: ReactNode }[];
}) {
  const level = score >= max ? 'is-full' : score > 0 ? 'is-partial' : 'is-zero';
  return (
    <section className={`judge ${level}`} aria-label={label}>
      <div className="judge-head">
        <span className="judge-score">
          {score}
          <span className="judge-max"> / {max}</span>
        </span>
        <Tag tone="accent" className="judge-tag">
          {tag}
        </Tag>
        {reviewTag && (
          <Tag tone="outline" className="judge-tag is-review">
            {reviewTag}
          </Tag>
        )}
      </div>
      {standard && <p className="judge-standard">{standard}</p>}
      {criteria && (
        <ul className="criteria">
          {criteria.map((c) => (
            <li key={c.id} className="criteria-row">
              <span className="criteria-name">{c.name}</span>
              <span className="criteria-bar" aria-hidden>
                <span style={{ width: `${(c.band / c.weight) * 100}%` }} />
              </span>
              <span className="criteria-band">
                {c.band}/{c.weight}
              </span>
            </li>
          ))}
          {extraCriterion && (
            <li className="criteria-row is-muted">
              <span className="criteria-name">{extraCriterion.name}</span>
              <span className="criteria-bar" aria-hidden />
              <span className="criteria-band">{extraCriterion.note}</span>
            </li>
          )}
        </ul>
      )}
      {points && points.length > 0 && (
        <ul className="judge-points">
          {points.map((p) => (
            <li key={p.id} className={`judge-point is-${p.met}`}>
              <span className="judge-point-mark" aria-label={p.metLabel}>
                {p.met === 'yes' ? <Check /> : p.met === 'partial' ? '½' : <Cross />}
              </span>
              {p.desc}
            </li>
          ))}
        </ul>
      )}
      {feedback && <p className="judge-feedback">{feedback}</p>}
      {issues && issues.length > 0 && (
        <ul className="judge-language">
          {issues.map((l, i) => (
            <li key={i}>
              <s>{l.text}</s> → <b>{l.fix}</b>
              {l.note && <span className="judge-language-note">{l.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Pending yes: the judge is still marking */
export function JudgePending({ children }: { children: ReactNode }) {
  return (
    <div className="judge is-pending" role="status">
      {children}
    </div>
  );
}
