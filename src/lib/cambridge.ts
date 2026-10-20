/**
 * Cambridge English Scale estimate for A2 Key / A2 Key for Schools practice tests (pure).
 * Anchor points from Cambridge's "Converting practice test scores to Cambridge English Scale scores"
 * (A2 Key and A2 Key for Schools, for exams from 2020; UCLES CER/4240/V2/AUG19):
 *   Reading 28→140 20→120 13→100 7→82 (of 30) · Writing 26/18/12/8 (of 30) · Listening 23/17/11/6 (of 25)
 *   Speaking 41/27/18/10 (of 45). Scores between anchors are interpolated; the maximum raw score maps to 150.
 * Results are estimates — the live exam's conversion varies from test to test.
 */
import type { ExamItemT, ItemT, JudgementT } from '@schema';
import type { Result } from './grading';

export type Skill = 'reading' | 'writing' | 'listening' | 'speaking';

export const SCALE: Record<Skill, { max: number; anchors: [raw: number, scale: number][] }> = {
  reading: { max: 30, anchors: [[7, 82], [13, 100], [20, 120], [28, 140]] },
  writing: { max: 30, anchors: [[8, 82], [12, 100], [18, 120], [26, 140]] },
  listening: { max: 25, anchors: [[6, 82], [11, 100], [17, 120], [23, 140]] },
  speaking: { max: 45, anchors: [[10, 82], [18, 100], [27, 120], [41, 140]] },
};

/** raw → Cambridge English Scale (null below the lowest reported score, 82) */
export function toScale(skill: Skill, raw: number): number | null {
  const { max, anchors } = SCALE[skill];
  const pts: [number, number][] = [...anchors, [max, 150]];
  if (raw < pts[0][0]) return null;
  for (let i = 1; i < pts.length; i++) {
    const [r0, s0] = pts[i - 1];
    const [r1, s1] = pts[i];
    if (raw <= r1) return Math.round(s0 + ((raw - r0) * (s1 - s0)) / (r1 - r0));
  }
  return 150;
}

/** A2 Key result bands on the Cambridge English Scale (also listed in the conversion-table dialog) */
export const GRADE_BANDS: [min: number, label: string][] = [
  [140, 'Grade A（B1）'],
  [133, 'Grade B（A2）'],
  [120, 'Grade C（A2）'],
  [100, 'A1'],
];

/** A2 Key result bands on the Cambridge English Scale */
export function grade(scale: number | null): string {
  if (scale === null) return '低于 82（不报告）';
  if (scale >= 140) return 'Grade A（B1）';
  if (scale >= 133) return 'Grade B（A2）';
  if (scale >= 120) return 'Grade C（A2）';
  if (scale >= 100) return 'A1';
  return '低于 A1';
}

export interface SkillReport {
  skill: Skill;
  raw: number;
  max: number;
  /** the skill's own maximum (30 / 30 / 25 / 45) — raw is converted to this before scaling */
  scaleMax: number;
  scale: number | null;
  /** some answers are still being scored (judge pending) */
  pending: boolean;
}

/**
 * Speaking: Cambridge weights Grammar & Vocabulary ×2, Pronunciation ×2, Interactive Communication ×2,
 * Global Achievement ×3 (45 marks). Pronunciation is not assessed from a transcript, so the other three
 * (35 marks) are scaled up to 45.
 */
function speakingRaw(judgements: JudgementT[]): number | null {
  const band = (id: string) => {
    const bands = judgements.flatMap((j) => j.keyPoints.filter((k) => k.id === id && k.band !== undefined).map((k) => k.band!));
    return bands.length ? bands.reduce((s, b) => s + b, 0) / bands.length : null;
  };
  const [gv, ic, global] = [band('grammar_vocabulary'), band('interactive_communication'), band('global')];
  if (gv === null || ic === null || global === null) return null;
  return Math.round(((2 * gv + 2 * ic + 3 * global) * 45) / 35);
}

/** the skill a one-skill paper reports (A2 Key's Reading & Writing paper reports two) */
export const PAPER_SKILL: Partial<Record<ExamItemT['paper'], Skill>> = {
  reading: 'reading',
  writing: 'writing',
  listening: 'listening',
  speaking: 'speaking',
};

type Row = Result['byQuestion'][number];

function report(skill: Skill, rs: Row[]): SkillReport {
  const s = {
    raw: rs.reduce((n, r) => n + r.points, 0),
    max: rs.reduce((n, r) => n + r.maxPoints, 0),
    pending: rs.some((r) => r.scoredBy === 'pending'),
  };
  const scaleMax = SCALE[skill].max;
  if (skill === 'speaking') {
    const raw45 = speakingRaw(rs.flatMap((r) => (r.judgement ? [r.judgement] : [])));
    if (raw45 !== null) return { skill, raw: raw45, max: s.max, scaleMax, scale: s.pending ? null : toScale(skill, raw45), pending: s.pending };
  }
  // raw scaled to the skill's full mark when the paper's own maximum differs (e.g. speaking 30 → 45)
  const r = s.max && s.max !== scaleMax ? (s.raw * scaleMax) / s.max : s.raw;
  return { skill, raw: Math.round(r * 2) / 2, max: s.max, scaleMax, scale: s.pending ? null : toScale(skill, r), pending: s.pending };
}

/** one-skill paper (Reading, Writing, Listening or Speaking): the report needs only the saved result */
export function skillReport(skill: Skill, result: Result): SkillReport {
  return report(skill, result.byQuestion);
}

/**
 * overall A2 Key score = the average of the four skills' scale scores (Cambridge), once all four are scored;
 * null while any skill is missing, pending or below the reported range
 */
export function overallScale(skills: Partial<Record<Skill, SkillReport>>): number | null {
  const all: Skill[] = ['reading', 'writing', 'listening', 'speaking'];
  const scales = all.map((k) => skills[k]?.scale ?? null);
  if (scales.some((s) => s === null)) return null;
  return Math.round((scales as number[]).reduce((a, b) => a + b, 0) / 4);
}

/** per-skill raw scores and scale estimates for one submitted exam paper */
export function examReport(item: ItemT, result: Result): SkillReport[] {
  if (!('format' in item)) return [];
  const one = PAPER_SKILL[item.paper];
  if (one) return [skillReport(one, result)];
  // the combined Reading & Writing paper: Parts 1–5 reading, Parts 6–7 writing
  const byQ = new Map(result.byQuestion.map((r) => [r.q, r]));
  const rows = (sections: typeof item.sections) =>
    sections.flatMap((s) => s.questions).map((q) => byQ.get(q.id)).filter((r): r is Row => !!r);
  const writingParts = item.sections.filter((s) => s.questions.every((q) => q.interaction.kind === 'extendedText'));
  return [report('reading', rows(item.sections.filter((s) => !writingParts.includes(s)))), report('writing', rows(writingParts))];
}