/**
 * Cambridge English Scale estimates for official practice tests (pure), one table per exam.
 * Anchor points from Cambridge's "Converting practice test scores to Cambridge English Scale scores"
 * (for exams from 2020; UCLES CER/4240/V2/AUG19):
 *   A2 Key / Key for Schools — Reading 28→140 20→120 13→100 7→82 (of 30) · Writing 26/18/12/8 (of 30)
 *     · Listening 23/17/11/6 (of 25) · Speaking 41/27/18/10 (of 45); top of scale 150.
 *   B1 Preliminary / Preliminary for Schools — Reading 29→160 23→140 13→120 5→102 (of 32) · Writing 34/24/16/10
 *     (of 40) · Listening 23/18/11/5 (of 25) · Speaking 27/18/12/7 (of 30); top of scale 170.
 * Scores between anchors are interpolated; the maximum raw score maps to the top of the scale.
 * Results are estimates — the live exam's conversion varies from test to test.
 */
import type { ExamItemT, ItemT, JudgementT } from '@schema';
import type { Result } from './grading';

export type Skill = 'reading' | 'writing' | 'listening' | 'speaking';
export type ExamKey = 'a2' | 'b1';

interface ExamScale {
  name: string;
  top: number;
  /** lowest reported score */
  floor: number;
  skills: Record<Skill, { max: number; anchors: [raw: number, scale: number][] }>;
  /** result bands, highest first */
  grades: [min: number, label: string][];
  /** label below the lowest band */
  below: string;
}

export const SCALES: Record<ExamKey, ExamScale> = {
  a2: {
    name: 'A2 Key / A2 Key for Schools',
    top: 150,
    floor: 82,
    skills: {
      reading: { max: 30, anchors: [[7, 82], [13, 100], [20, 120], [28, 140]] },
      writing: { max: 30, anchors: [[8, 82], [12, 100], [18, 120], [26, 140]] },
      listening: { max: 25, anchors: [[6, 82], [11, 100], [17, 120], [23, 140]] },
      speaking: { max: 45, anchors: [[10, 82], [18, 100], [27, 120], [41, 140]] },
    },
    grades: [
      [140, 'Grade A（B1）'],
      [133, 'Grade B（A2）'],
      [120, 'Grade C（A2）'],
      [100, 'A1'],
    ],
    below: '低于 A1',
  },
  b1: {
    name: 'B1 Preliminary / B1 Preliminary for Schools',
    top: 170,
    floor: 102,
    skills: {
      reading: { max: 32, anchors: [[5, 102], [13, 120], [23, 140], [29, 160]] },
      writing: { max: 40, anchors: [[10, 102], [16, 120], [24, 140], [34, 160]] },
      listening: { max: 25, anchors: [[5, 102], [11, 120], [18, 140], [23, 160]] },
      speaking: { max: 30, anchors: [[7, 102], [12, 120], [18, 140], [27, 160]] },
    },
    grades: [
      [160, 'Grade A（B2）'],
      [153, 'Grade B（B1）'],
      [140, 'Grade C（B1）'],
      [120, 'A2'],
    ],
    below: '低于 A2',
  },
};

/** which table an exam uses: "B1 Preliminary for Schools" / PET → b1, otherwise (A2 Key / KET) a2 */
export const examKey = (exam: string | undefined): ExamKey => (/preliminary|pet|b1/i.test(exam ?? '') ? 'b1' : 'a2');

/** kept for callers that only know A2 Key */
export const SCALE = SCALES.a2.skills;

/** raw → Cambridge English Scale (null below the lowest reported score) */
export function toScale(skill: Skill, raw: number, exam: ExamKey = 'a2'): number | null {
  const s = SCALES[exam];
  const { max, anchors } = s.skills[skill];
  const pts: [number, number][] = [...anchors, [max, s.top]];
  if (raw < pts[0][0]) return null;
  for (let i = 1; i < pts.length; i++) {
    const [r0, s0] = pts[i - 1];
    const [r1, s1] = pts[i];
    if (raw <= r1) return Math.round(s0 + ((raw - r0) * (s1 - s0)) / (r1 - r0));
  }
  return s.top;
}

/** A2 Key result bands — also listed in the conversion-table dialog */
export const GRADE_BANDS = SCALES.a2.grades;

/** result band on the Cambridge English Scale */
export function grade(scale: number | null, exam: ExamKey = 'a2'): string {
  const s = SCALES[exam];
  if (scale === null) return `低于 ${s.floor}（不报告）`;
  return s.grades.find(([min]) => scale >= min)?.[1] ?? s.below;
}

export interface SkillReport {
  skill: Skill;
  raw: number;
  max: number;
  /** the skill's own maximum in the exam (e.g. A2 speaking 45, B1 writing 40) — raw is converted to this before scaling */
  scaleMax: number;
  scale: number | null;
  /** some answers are still being scored (judge pending) */
  pending: boolean;
}

/**
 * Speaking raw mark on the exam's own scale. Pronunciation is not assessed from a transcript, so the other
 * criteria are scaled up to the full mark.
 *   A2 Key: Grammar & Vocabulary ×2, Pronunciation ×2, Interactive Communication ×2, Global ×3 (45).
 *   B1 Preliminary: Grammar & Vocabulary, Discourse Management, Pronunciation, Interactive Communication ×1,
 *   Global ×2 (30).
 */
function speakingRaw(judgements: JudgementT[], exam: ExamKey): number | null {
  const band = (id: string) => {
    const bands = judgements.flatMap((j) => j.keyPoints.filter((k) => k.id === id && k.band !== undefined).map((k) => k.band!));
    return bands.length ? bands.reduce((s, b) => s + b, 0) / bands.length : null;
  };
  const gv = band('grammar_vocabulary');
  const ic = band('interactive_communication');
  const global = band('global');
  if (gv === null || ic === null || global === null) return null;
  if (exam === 'b1') {
    const dm = band('discourse_management');
    if (dm === null) return null;
    return Math.round(((gv + dm + ic + 2 * global) * 30) / 25);
  }
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

function report(skill: Skill, all: Row[], exam: ExamKey): SkillReport {
  // a writing task the learner did not choose (PET Part 2: one of two) does not count
  const rs = all.filter((r) => r.scoredBy !== 'none');
  const s = {
    raw: rs.reduce((n, r) => n + r.points, 0),
    max: rs.reduce((n, r) => n + r.maxPoints, 0),
    pending: rs.some((r) => r.scoredBy === 'pending'),
  };
  const scaleMax = SCALES[exam].skills[skill].max;
  if (skill === 'speaking') {
    const raw = speakingRaw(rs.flatMap((r) => (r.judgement ? [r.judgement] : [])), exam);
    if (raw !== null) return { skill, raw, max: s.max, scaleMax, scale: s.pending ? null : toScale(skill, raw, exam), pending: s.pending };
  }
  // raw scaled to the skill's full mark when the paper's own maximum differs (e.g. A2 speaking 30 → 45)
  const r = s.max && s.max !== scaleMax ? (s.raw * scaleMax) / s.max : s.raw;
  return { skill, raw: Math.round(r * 2) / 2, max: s.max, scaleMax, scale: s.pending ? null : toScale(skill, r, exam), pending: s.pending };
}

/**
 * per-skill reports for one submitted paper, from the saved result alone (so list pages need no item):
 * A2 Key's Reading & Writing = auto-scored questions (Parts 1–5) → reading, judged ones (Parts 6–7) → writing
 */
export function paperReports(paper: ExamItemT['paper'], result: Result, exam: ExamKey = 'a2'): SkillReport[] {
  const one = PAPER_SKILL[paper];
  if (one) return [report(one, result.byQuestion, exam)];
  const auto = (r: Row) => r.scoredBy === undefined || r.scoredBy === 'auto';
  return [report('reading', result.byQuestion.filter(auto), exam), report('writing', result.byQuestion.filter((r) => !auto(r)), exam)];
}

/**
 * overall score = the average of the four skills' scale scores (Cambridge), once all four are scored;
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
  return 'format' in item ? paperReports(item.paper, result, examKey(item.meta.exam)) : [];
}
