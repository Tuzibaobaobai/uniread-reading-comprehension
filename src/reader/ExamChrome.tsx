import { useEffect, useState, type ReactNode } from 'react';
import type { ExamItemT } from '@schema';
import { Trans, useTranslation } from 'react-i18next';
import { SCALES, belowLabel, examKey, examReport, grade, paperMaxMarks, gradeLabel, type ExamKey, type Skill } from '@/lib/cambridge';
import type { Result } from '@/lib/grading';
import { paperLabel } from '@/lib/labels';
import { Dialog } from '@/ui/common/Dialog/Dialog';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { QuizButton } from '@/ui/QuizButton/QuizButton';
import { LinkButton } from '@/ui/LinkButton/LinkButton';
import { ChoiceCard, ChoiceCardGroup } from '@/ui/ChoiceCard/ChoiceCard';
import { ModeSelect as ModeSelectView } from '@/ui/exam/ModeSelect/ModeSelect';
import { ExamTimer as ExamTimerView } from '@/ui/exam/ExamTimer/ExamTimer';
import { ScoreReport } from '@/ui/exam/ScoreReport/ScoreReport';
import { ScaleTable } from '@/ui/exam/ScaleTable/ScaleTable';

/* Exam-paper chrome (KET/PET 真题), composed of src/ui components (docs/14 §15; design-system/components.registry.json:
   rc/Common/Dialog, ui/ChoiceCard, rc/Exam/ModeSelect + ui/exam/ModeMenu, rc/Exam/ExamTimer, rc/Exam/ScoreReport,
   rc/Exam/ScaleTable, ui/LinkButton). This file keeps the exam logic and the texts. */

/** why the mode is being asked: a new attempt, 重新作答, or an exam whose time ran out while away */
export type ModeReason = 'new' | 'retry' | 'timeout';

/** practice or timed exam — asked before an attempt; closing returns to the playlist / the finished review (#65) */
export function ModeDialog({
  item,
  reason,
  onChoose,
  onCancel,
}: {
  item: ExamItemT;
  reason: ModeReason;
  onChoose: (mode: 'practice' | 'exam') => void;
  onCancel: () => void;
}) {
  const listening = item.paper === 'listening';
  const speaking = item.paper === 'speaking';
  const { t } = useTranslation();
  return (
    <Dialog
      title={item.title}
      size="m"
      className="mode-dialog"
      onClose={onCancel}
      closeLabel={reason === 'retry' ? t('exam.mode.closeToResult') : t('exam.mode.closeToPlaylist')}
    >
      {reason === 'timeout' && (
        <InlineNotice tone="warning" className="mode-timeout">
          {t('exam.mode.timeout')}
        </InlineNotice>
      )}
      <p>
        {t('exam.mode.summary', { exam: item.meta.exam, paper: paperLabel(item.paper, t), minutes: item.meta.durationMinutes, marks: paperMaxMarks(item.paper, examKey(item.meta.exam)) })}
      </p>
      <ChoiceCardGroup layout="list" className="mode-options">
        <ChoiceCard size="l" className="mode-option is-filled" title={t('exam.mode.practice')} onClick={() => onChoose('practice')}>
          {t('exam.mode.practiceDesc', {
            audio: listening ? t('exam.mode.practiceAudio') : '',
            speaking: speaking ? t('exam.mode.practiceSpeaking') : '',
            transcript: listening ? t('exam.mode.practiceTranscript') : '',
          })}
        </ChoiceCard>
        <ChoiceCard size="l" className="mode-option is-filled" title={t('exam.mode.exam')} onClick={() => onChoose('exam')}>
          {t('exam.mode.examDesc', { minutes: item.meta.durationMinutes, audio: listening ? t('exam.mode.examAudio') : '' })}
        </ChoiceCard>
      </ChoiceCardGroup>
    </Dialog>
  );
}

/**
 * reader header, top right (#102, Figma 模式切换 19215-125693 → select 19215-125964): the current mode, the exam
 * countdown, and a tap-only menu to switch (rarely used, so it sits away from the answering area). Choosing the
 * other mode asks first (SwitchModeDialog). rc/Exam/ModeSelect + ui/exam/ModeMenu.
 */
export function ModeSelect({ mode, timer, onSwitch }: { mode: 'practice' | 'exam'; timer?: ReactNode; onSwitch: () => void }) {
  const { t } = useTranslation();
  return (
    <ModeSelectView
      mode={mode}
      current={t('exam.mode.current')}
      label={t(`exam.mode.${mode}`)}
      ariaLabel={t('exam.mode.selectLabel', { mode: t(`exam.mode.${mode}`) })}
      timer={timer}
      menuLabel={t('exam.mode.menuLabel')}
      items={(['practice', 'exam'] as const).map((m) => ({ key: m, label: t(`exam.mode.${m}`), checked: m === mode }))}
      onSelect={(m) => m !== mode && onSwitch()}
    />
  );
}

/** switch practice ↔ exam during an attempt (#66) */
export function SwitchModeDialog({
  from,
  answered,
  onConfirm,
  onCancel,
}: {
  from: 'practice' | 'exam';
  answered: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const toExam = from === 'practice';
  const { t } = useTranslation();
  return (
    <Dialog
      title={toExam ? t('exam.switch.toExamTitle') : t('exam.switch.toPracticeTitle')}
      onClose={onCancel}
      closeLabel={t('exam.switch.close')}
      actions={
        <>
          <QuizButton onClick={onCancel}>{t('common.cancel')}</QuizButton>
          <QuizButton variant="primary" autoFocus onClick={onConfirm}>
            {toExam ? t('exam.switch.startExam') : t('exam.switch.toPractice')}
          </QuizButton>
        </>
      }
    >
      <p>
        {toExam
          ? t('exam.switch.toExamBody', { cleared: answered ? t('exam.switch.cleared', { count: answered }) : '' })
          : t('exam.switch.toPracticeBody')}
      </p>
    </Dialog>
  );
}

const SKILLS: Skill[] = ['reading', 'writing', 'listening', 'speaking'];

/**
 * Cambridge English Scale conversion table (#67): the official anchor points per skill and the exam's result
 * bands; raw scores in between are interpolated
 */
export function ScaleTableDialog({ exam, onClose }: { exam: ExamKey; onClose: () => void }) {
  const s = SCALES[exam];
  const { t } = useTranslation();
  return (
    <Dialog
      title={t('exam.scale.title')}
      size="l"
      className="scale-dialog"
      onClose={onClose}
      closeLabel={t('exam.scale.close')}
      actions={
        <QuizButton variant="primary" autoFocus onClick={onClose}>
          {t('common.close')}
        </QuizButton>
      }
    >
      <p>{t('exam.scale.intro', { name: s.name, top: s.top })}</p>
      <ScaleTable
        head={[t('exam.report.raw'), t('exam.report.scale')]}
        skills={SKILLS.map((k) => ({
          key: k,
          caption: t('exam.scale.skillCaption', { skill: t(`skill.${k}`), max: s.skills[k].max }),
          rows: [[s.skills[k].max, s.top] as [number, number], ...[...s.skills[k].anchors].reverse()],
        }))}
        grades={{
          caption: t('exam.scale.gradesCaption'),
          head: [t('exam.scale.bandScore'), t('exam.scale.band')],
          rows: [
            ...s.grades.map((band, i) => ({ key: band[0], range: `${band[0]}–${i === 0 ? s.top : s.grades[i - 1][0] - 1}`, label: gradeLabel(band, t) })),
            { key: 'below', range: `${s.floor}–${s.grades[s.grades.length - 1][0] - 1}`, label: t('exam.scale.belowRow', { below: belowLabel(exam, t), floor: s.floor }) },
          ],
        }}
      />
      <p className="report-note">{t('exam.scale.source', { name: s.name })}</p>
    </Dialog>
  );
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * countdown for exam mode (Cambridge digital exam: minutes until the last 5, then minutes and seconds;
 * warning at 5 minutes, alert at 1 minute); calls onTimeUp once at 0. Shown as rc/Exam/ExamTimer.
 */
export function ExamTimer({ endsAt, onTimeUp, waitingForAudio = false }: { endsAt: number; onTimeUp: () => void; waitingForAudio?: boolean }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const left = Math.max(0, Math.round((endsAt - now) / 1000));
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (left === 0) onTimeUp();
  }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  // listening: time is up but the exam recording is still playing — hand in when it ends (#109)
  if (left === 0 && waitingForAudio)
    return (
      <ExamTimerView level="alert" live>
        {t('exam.timer.afterRecording')}
      </ExamTimerView>
    );
  return (
    <ExamTimerView level={left <= 60 ? 'alert' : left <= 300 ? 'warning' : 'normal'} live={left <= 300} ariaLabel={t('exam.timer.label', { time: clock(left) })}>
      {/* Ready frame 2.06: the warning still counts whole minutes (剩余 4 分钟); seconds only in the last minute */}
      {t('exam.timer.left', { time: left > 60 ? t('exam.timer.minutes', { count: Math.ceil(left / 60) }) : clock(left) })}
    </ExamTimerView>
  );
}

/** a speaking Part's examiner questions (one recording each) and how many have an answer */
function turnsAnswered(questions: ExamItemT['sections'][number]['questions'], responses: Record<string, unknown>) {
  let answered = 0;
  let count = 0;
  for (const q of questions) {
    if (q.interaction.kind !== 'speaking') continue;
    const r = responses[q.id];
    for (const turn of q.interaction.turns) {
      count++;
      const v = r && typeof r === 'object' && !Array.isArray(r) ? (r as Record<string, unknown>)[turn.id] : undefined;
      if (typeof v === 'string' && v.trim() !== '') answered++;
    }
  }
  return { answered, count };
}

/** per-skill raw scores and the Cambridge English Scale estimate */
export function ExamReport({
  item,
  result,
  responses = {},
  onClose,
}: {
  item: ExamItemT;
  result: Result;
  /** the answers: a speaking Part counts the examiner questions (turns) answered */
  responses?: Record<string, unknown>;
  onClose: () => void;
}) {
  const rows = examReport(item, result);
  const exam = examKey(item.meta.exam);
  const { t } = useTranslation();
  const [tableOpen, setTableOpen] = useState(false);
  const parts = item.sections.map((s) => {
    // an unchosen writing task (PET Part 2: one of two) does not count
    const rs = s.questions.map((q) => result.byQuestion.find((r) => r.q === q.id)).filter((r): r is Result['byQuestion'][number] => !!r && r.scoredBy !== 'none');
    return {
      s,
      // speaking: the examiner questions (turns) answered, as the playlist row counts them
      ...turnsAnswered(s.questions, responses),
      got: rs.reduce((n, r) => n + r.points, 0),
      max: rs.reduce((n, r) => n + r.maxPoints, 0),
      pending: rs.some((r) => r.scoredBy === 'pending'),
      // the judge was down: not a 0, marked when the paper is opened again
      unjudged: rs.some((r) => r.scoredBy === 'self'),
    };
  });
  return (
    <>
      <Dialog
        title={t('exam.report.title')}
        size="m"
        className="report-dialog"
        onClose={onClose}
        closeLabel={t('exam.report.close')}
        actions={
          <QuizButton variant="primary" autoFocus onClick={onClose}>
            {t('exam.report.viewAnswers')}
          </QuizButton>
        }
      >
        <ScoreReport
          head={[t('exam.report.part'), t('exam.report.score')]}
          pending={parts.some((p) => p.pending)}
          parts={parts.map(({ s, answered, count, got, max, pending, unjudged }) => ({
            key: s.id,
            label: s.label ?? `Part ${s.part}`,
            // speaking is marked on the whole test (Cambridge criteria → the skill's 45 / 30), not Part by Part: a Part shows
            // how many examiner questions were answered, so no Part mark sits next to a total on a different scale
            score: pending
              ? t('exam.report.scoringEllipsis')
              : unjudged
                ? t('exam.report.unjudged')
                : item.paper === 'speaking'
                  ? t('exam.report.partAnswered', { n: answered, total: count })
                  : `${Math.round(got * 2) / 2} / ${max}`,
          }))}
          skills={rows.map((r) => ({
            key: r.skill,
            name: t(`skill.${r.skill}`),
            scale: r.pending || r.unjudged ? '…' : (r.scale ?? `<${SCALES[exam].floor}`),
            grade: r.pending ? t('exam.report.scoring') : r.unjudged ? t('exam.report.unjudged') : grade(r.scale, exam, t),
            // an unmarked answer is not a 0: no raw score until it is marked
            raw: r.pending ? t('exam.report.scoringEllipsis') : r.unjudged ? t('exam.report.unjudged') : t('exam.report.rawOf', { raw: r.raw, max: r.scaleMax }),
            pending: r.pending,
          }))}
          note={
            // Ready frame 2.11: one short line pointing to the table; papers with writing / speaking add how those are marked
            <>
              <Trans i18nKey="exam.report.note" components={{ btn: <LinkButton onClick={() => setTableOpen(true)} /> }} />
              {item.paper !== 'listening' && item.paper !== 'reading' &&
                t('exam.report.noteAi', { speaking: item.paper === 'speaking' ? t('exam.report.noteSpeaking') : '' })}
            </>
          }
        />
      </Dialog>
      {tableOpen && <ScaleTableDialog exam={exam} onClose={() => setTableOpen(false)} />}
    </>
  );
}
