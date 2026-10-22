import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from '@/components/Icons';
import type { ExamItemT } from '@schema';
import { Trans, useTranslation } from 'react-i18next';
import { SCALES, belowLabel, examKey, examReport, grade, gradeLabel, type ExamKey, type Skill } from '@/lib/cambridge';
import type { Result } from '@/lib/grading';
import { paperLabel } from '@/lib/labels';

/* Exam-paper chrome (KET/PET 真题). Not yet in Figma — built from existing tokens (待补组件, docs/design/figma-registry.md). */

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
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog mode-dialog" role="dialog" aria-modal aria-labelledby="mode-title" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onCancel} aria-label={reason === 'retry' ? t('exam.mode.closeToResult') : t('exam.mode.closeToPlaylist')}>
          ×
        </button>
        <h2 id="mode-title">{item.title}</h2>
        {reason === 'timeout' && <p className="mode-timeout">{t('exam.mode.timeout')}</p>}
        <p>
          {t('exam.mode.summary', { exam: item.meta.exam, paper: paperLabel(item.paper, t), minutes: item.meta.durationMinutes, marks: item.meta.totalMarks })}
        </p>
        <div className="mode-options">
          <button className="mode-option" onClick={() => onChoose('practice')}>
            <b>{t('exam.mode.practice')}</b>
            <span>
              {t('exam.mode.practiceDesc', {
                audio: listening ? t('exam.mode.practiceAudio') : '',
                speaking: speaking ? t('exam.mode.practiceSpeaking') : '',
                transcript: listening ? t('exam.mode.practiceTranscript') : '',
              })}
            </span>
          </button>
          <button className="mode-option" onClick={() => onChoose('exam')}>
            <b>{t('exam.mode.exam')}</b>
            <span>{t('exam.mode.examDesc', { minutes: item.meta.durationMinutes, audio: listening ? t('exam.mode.examAudio') : '' })}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * reader header, top right (#102, Figma 模式切换 19215-125693 → select 19215-125964): the current mode, the exam
 * countdown, and a tap-only menu to switch (rarely used, so it sits away from the answering area). Choosing the
 * other mode asks first (SwitchModeDialog). The open menu is not in Figma yet (待补组件).
 */
export function ModeSelect({ mode, timer, onSwitch }: { mode: 'practice' | 'exam'; timer?: ReactNode; onSwitch: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => root.current?.contains(e.target as Node) || setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div className="mode-select" ref={root}>
      <button className="mode-select-button" aria-haspopup="menu" aria-expanded={open} aria-label={t('exam.mode.selectLabel', { mode: t(`exam.mode.${mode}`) })} onClick={() => setOpen((o) => !o)}>
        <b>{t(`exam.mode.${mode}`)}</b>
        {timer}
        <ChevronDown />
      </button>
      {open && (
        <div className="mode-select-menu" role="menu" aria-label={t('exam.mode.menuLabel')}>
          {(['practice', 'exam'] as const).map((m) => (
            <button
              key={m}
              role="menuitemradio"
              aria-checked={m === mode}
              className={`mode-select-item ${m === mode ? 'is-current' : ''}`}
              onClick={() => {
                setOpen(false);
                if (m !== mode) onSwitch();
              }}
            >
              {t(`exam.mode.${m}`)}
              {m === mode && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
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
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal aria-labelledby="switch-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="switch-title">{toExam ? t('exam.switch.toExamTitle') : t('exam.switch.toPracticeTitle')}</h2>
        <p>
          {toExam
            ? t('exam.switch.toExamBody', { cleared: answered ? t('exam.switch.cleared', { count: answered }) : '' })
            : t('exam.switch.toPracticeBody')}
        </p>
        <div className="dialog-actions">
          <button className="pill-button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="pill-button primary" autoFocus onClick={onConfirm}>
            {toExam ? t('exam.switch.startExam') : t('exam.switch.toPractice')}
          </button>
        </div>
      </div>
    </div>
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
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog scale-dialog" role="dialog" aria-modal aria-labelledby="scale-title" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label={t('exam.scale.close')}>
          ×
        </button>
        <h2 id="scale-title">{t('exam.scale.title')}</h2>
        <p>{t('exam.scale.intro', { name: s.name, top: s.top })}</p>
        <div className="scale-tables">
          {SKILLS.map((k) => (
            <table key={k} className="report-table scale-table">
              <caption>{t('exam.scale.skillCaption', { skill: t(`skill.${k}`), max: s.skills[k].max })}</caption>
              <thead>
                <tr>
                  <th>{t('exam.report.raw')}</th>
                  <th>{t('exam.report.scale')}</th>
                </tr>
              </thead>
              <tbody>
                {[[s.skills[k].max, s.top] as [number, number], ...[...s.skills[k].anchors].reverse()].map(([raw, scale]) => (
                  <tr key={raw}>
                    <td>{raw}</td>
                    <td>{scale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <table className="report-table">
          <caption>{t('exam.scale.gradesCaption')}</caption>
          <tbody>
            {s.grades.map((band, i) => (
              <tr key={band[0]}>
                <td>
                  {band[0]}–{i === 0 ? s.top : s.grades[i - 1][0] - 1}
                </td>
                <td>{gradeLabel(band, t)}</td>
              </tr>
            ))}
            <tr>
              <td>
                {s.floor}–{s.grades[s.grades.length - 1][0] - 1}
              </td>
              <td>{t('exam.scale.belowRow', { below: belowLabel(exam, t), floor: s.floor })}</td>
            </tr>
          </tbody>
        </table>
        <p className="report-note">{t('exam.scale.source', { name: s.name })}</p>
        <div className="dialog-actions">
          <button className="pill-button primary" autoFocus onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * countdown for exam mode (Cambridge digital exam: minutes until the last 5, then minutes and seconds;
 * warning at 5 minutes, alert at 1 minute); calls onTimeUp once at 0
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
  const level = left <= 60 ? 'is-alert' : left <= 300 ? 'is-warn' : '';
  // listening: time is up but the exam recording is still playing — hand in when it ends (#109)
  if (left === 0 && waitingForAudio)
    return (
      <span className="exam-timer is-alert" role="timer" aria-live="polite">
        {t('exam.timer.afterRecording')}
      </span>
    );
  return (
    <span className={`exam-timer ${level}`} role="timer" aria-live={left <= 300 ? 'polite' : 'off'} aria-label={t('exam.timer.label', { time: clock(left) })}>
      {t('exam.timer.left', { time: left > 300 ? t('exam.timer.minutes', { count: Math.ceil(left / 60) }) : clock(left) })}
    </span>
  );
}

/** per-skill raw scores and the Cambridge English Scale estimate */
export function ExamReport({ item, result, onClose }: { item: ExamItemT; result: Result; onClose: () => void }) {
  const rows = examReport(item, result);
  const exam = examKey(item.meta.exam);
  const { t } = useTranslation();
  const [tableOpen, setTableOpen] = useState(false);
  const parts = item.sections.map((s) => {
    // an unchosen writing task (PET Part 2: one of two) does not count
    const rs = s.questions.map((q) => result.byQuestion.find((r) => r.q === q.id)).filter((r): r is Result['byQuestion'][number] => !!r && r.scoredBy !== 'none');
    return { s, got: rs.reduce((n, r) => n + r.points, 0), max: rs.reduce((n, r) => n + r.maxPoints, 0), pending: rs.some((r) => r.scoredBy === 'pending') };
  });
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog report-dialog" role="dialog" aria-modal aria-labelledby="report-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="report-title">{t('exam.report.title')}</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t('exam.report.part')}</th>
              <th>{t('exam.report.score')}</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(({ s, got, max, pending }) => (
              <tr key={s.id}>
                <td>{s.label ?? `Part ${s.part}`}</td>
                <td>{pending ? t('exam.report.scoringEllipsis') : `${Math.round(got * 2) / 2} / ${max}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="report-skills">
          {rows.map((r) => (
            <div key={r.skill} className="report-skill">
              <span className="report-skill-name">{t(`skill.${r.skill}`)}</span>
              <span className="report-skill-scale">{r.pending ? '…' : (r.scale ?? `<${SCALES[exam].floor}`)}</span>
              <span className="report-skill-grade">{r.pending ? t('exam.report.scoring') : grade(r.scale, exam, t)}</span>
              <span className="report-skill-raw">{t('exam.report.rawOf', { raw: r.raw, max: r.scaleMax })}</span>
            </div>
          ))}
        </div>
        <p className="report-note">
          <Trans
            i18nKey="exam.report.note"
            values={{ name: SCALES[exam].name, speaking: item.paper === 'speaking' ? t('exam.report.noteSpeaking') : '' }}
            components={{ btn: <button className="link-button" onClick={() => setTableOpen(true)} /> }}
          />
        </p>
        <div className="dialog-actions">
          <button className="pill-button primary" autoFocus onClick={onClose}>
            {t('exam.report.viewAnswers')}
          </button>
        </div>
      </div>
      {tableOpen && <ScaleTableDialog exam={exam} onClose={() => setTableOpen(false)} />}
    </div>
  );
}
