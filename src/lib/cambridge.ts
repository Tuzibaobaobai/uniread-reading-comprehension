/**
 * Cambridge English Scale estimate for A2 Key / A2 Key for Schools practice tests (pure).
 * Anchor points from Cambridge's "Converting practice test scores to Cambridge English Scale scores"
 * (A2 Key and A2 Key for Schools, for exams from 2020; UCLES CER/4240/V2/AUG19):
 *   Reading 28→140 20→120 13→100 7→82 (of 30) · Writing 26/18/12/8 (of 30) · Listening 23/17/11/6 (of 25)
 *   Speaking 41/27/18/10 (of 45). Scores between anchors are interpolated; the maximum raw score maps to 150.
 * Results are estimates — the live exam's conversion varies from test to test.
 */
import type { ItemT, JudgementT } from '@schema';
import type { Result } from './grading';

export type Skill = 'reading' | 'writing' | 'listening' | 'speaking';

const SCALE: Record<Skill, { max: number; anchors: [raw: number, scale: number][] }> = {
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

/** per-skill raw scores and scale estimates for one submitted exam paper */
export function examReport(item: ItemT, result: Result): SkillReport[] {
  if (!('format' in item)) return [];
  const byQ = new Map(result.byQuestion.map((r) => [r.q, r]));
  const sum = (sections: typeof item.sections) => {
    const rs = sections.flatMap((s) => s.questions).map((q) => byQ.get(q.id)).filter((r) => !!r);
    return {
      raw: rs.reduce((n, r) => n + r.points, 0),
      max: rs.reduce((n, r) => n + r.maxPoints, 0),
      pending: rs.some((r) => r.scoredBy === 'pending'),
      judgements: rs.flatMap((r) => (r.judgement ? [r.judgement] : [])),
    };
  };
  const report = (skill: Skill, s: ReturnType<typeof sum>, raw = s.raw): SkillReport => {
    const scaleMax = SCALE[skill].max;
    // raw scaled to the skill's full mark when the paper's own maximum differs (e.g. speaking 30 → 45)
    const r = s.max && s.max !== scaleMax ? (raw * scaleMax) / s.max : raw;
    return { skill, raw: Math.round(r * 2) / 2, max: s.max, scaleMax, scale: s.pending ? null : toScale(skill, r), pending: s.pending };
  };
  if (item.paper === 'reading_writing') {
    const writingParts = item.sections.filter((s) => s.questions.every((q) => q.interaction.kind === 'extendedText'));
    const readingParts = item.sections.filter((s) => !writingParts.includes(s));
    return [report('reading', sum(readingParts)), report('writing', sum(writingParts))];
  }
  if (item.paper === 'listening') return [report('listening', sum(item.sections))];
  const s = sum(item.sections);
  const raw45 = speakingRaw(s.judgements);
  return [raw45 === null ? report('speaking', s) : { ...report('speaking', s), raw: raw45, scale: s.pending ? null : toScale('speaking', raw45) }];
}
