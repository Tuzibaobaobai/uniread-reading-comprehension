import { useEffect, useState } from 'react';
import type { ExamItemT } from '@schema';
import { SCALES, examKey, examReport, grade, type ExamKey, type Skill } from '@/lib/cambridge';
import type { Result } from '@/lib/grading';
import { PAPER_ZH } from '@/lib/labels';

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
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog mode-dialog" role="dialog" aria-modal aria-labelledby="mode-title" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onCancel} aria-label={reason === 'retry' ? '关闭，返回作答结果' : '关闭，返回合集'}>
          ×
        </button>
        <h2 id="mode-title">{item.title}</h2>
        {reason === 'timeout' && <p className="mode-timeout">上次考试时间已到，但没有交卷。选择练习模式会保留已经作答的内容；选择考试模式会清空作答、重新计时。</p>}
        <p>
          {item.meta.exam} · {PAPER_ZH[item.paper]} · 官方考试时长 {item.meta.durationMinutes} 分钟 · 满分 {item.meta.totalMarks} 分
        </p>
        <div className="mode-options">
          <button className="mode-option" onClick={() => onChoose('practice')}>
            <b>练习模式</b>
            <span>
              不限时{listening ? '；录音可以暂停、回放、拖动' : ''}
              {speaking ? '；每个问题可以反复重录' : ''}；交卷后查看答案、解析{listening ? '和听力原文' : ''}。
            </span>
          </button>
          <button className="mode-option" onClick={() => onChoose('exam')}>
            <b>考试模式</b>
            <span>
              限时 {item.meta.durationMinutes} 分钟，时间到自动交卷
              {listening ? '；每段录音只能播放一次（录音中已含两遍），不能暂停或拖动' : ''}；可以标记题目，交卷后出分并估算 Cambridge 分数。
            </span>
          </button>
        </div>
      </div>
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
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal aria-labelledby="switch-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="switch-title">{toExam ? '切换到考试模式？' : '结束考试，切换到练习模式？'}</h2>
        <p>
          {toExam
            ? `考试要从头开始并重新计时${answered ? `，当前已作答的 ${answered} 题会被清空` : ''}。`
            : '计时停止，已经作答的内容会保留，可以继续练习，录音也可以暂停和回放。'}
        </p>
        <div className="dialog-actions">
          <button className="pill-button" onClick={onCancel}>
            取消
          </button>
          <button className="pill-button primary" autoFocus onClick={onConfirm}>
            {toExam ? '开始考试' : '切换到练习'}
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
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog scale-dialog" role="dialog" aria-modal aria-labelledby="scale-title" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="关闭，返回成绩报告">
          ×
        </button>
        <h2 id="scale-title">Cambridge English Scale 换算表</h2>
        <p>
          {s.name}（2020 年起的考试）官方练习题换算表。表中为官方锚点，其间的原始分按比例换算，满分对应 {s.top}。
        </p>
        <div className="scale-tables">
          {SKILLS.map((k) => (
            <table key={k} className="report-table scale-table">
              <caption>
                {SKILL_ZH[k]}（满分 {s.skills[k].max}）
              </caption>
              <thead>
                <tr>
                  <th>原始分</th>
                  <th>换算分</th>
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
          <caption>成绩等级（总分 = 四项换算分的平均）</caption>
          <tbody>
            {s.grades.map(([min, label], i) => (
              <tr key={label}>
                <td>
                  {min}–{i === 0 ? s.top : s.grades[i - 1][0] - 1}
                </td>
                <td>{label}</td>
              </tr>
            ))}
            <tr>
              <td>
                {s.floor}–{s.grades[s.grades.length - 1][0] - 1}
              </td>
              <td>
                {s.below}（{s.floor} 为最低报告分）
              </td>
            </tr>
          </tbody>
        </table>
        <p className="report-note">
          来源：Cambridge English《{s.name} — Converting practice test scores to Cambridge English Scale scores》（UCLES 2019）。仅供练习参考，真实考试的换算会因试卷而异。
        </p>
        <div className="dialog-actions">
          <button className="pill-button primary" autoFocus onClick={onClose}>
            关闭
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
export function ExamTimer({ endsAt, onTimeUp }: { endsAt: number; onTimeUp: () => void }) {
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
  return (
    <span className={`exam-timer ${level}`} role="timer" aria-live={left <= 300 ? 'polite' : 'off'} aria-label={`剩余时间 ${clock(left)}`}>
      剩余 {left > 300 ? `${Math.ceil(left / 60)} 分钟` : clock(left)}
    </span>
  );
}

const SKILL_ZH: Record<Skill, string> = { reading: '阅读', writing: '写作', listening: '听力', speaking: '口语' };

/** per-skill raw scores and the Cambridge English Scale estimate */
export function ExamReport({ item, result, onClose }: { item: ExamItemT; result: Result; onClose: () => void }) {
  const rows = examReport(item, result);
  const exam = examKey(item.meta.exam);
  const [tableOpen, setTableOpen] = useState(false);
  const parts = item.sections.map((s) => {
    // an unchosen writing task (PET Part 2: one of two) does not count
    const rs = s.questions.map((q) => result.byQuestion.find((r) => r.q === q.id)).filter((r): r is Result['byQuestion'][number] => !!r && r.scoredBy !== 'none');
    return { s, got: rs.reduce((n, r) => n + r.points, 0), max: rs.reduce((n, r) => n + r.maxPoints, 0), pending: rs.some((r) => r.scoredBy === 'pending') };
  });
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog report-dialog" role="dialog" aria-modal aria-labelledby="report-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="report-title">成绩报告</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>部分</th>
              <th>得分</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(({ s, got, max, pending }) => (
              <tr key={s.id}>
                <td>{s.label ?? `Part ${s.part}`}</td>
                <td>{pending ? '评分中…' : `${Math.round(got * 2) / 2} / ${max}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="report-skills">
          {rows.map((r) => (
            <div key={r.skill} className="report-skill">
              <span className="report-skill-name">{SKILL_ZH[r.skill]}</span>
              <span className="report-skill-scale">{r.pending ? '…' : (r.scale ?? `<${SCALES[exam].floor}`)}</span>
              <span className="report-skill-grade">{r.pending ? '评分中' : grade(r.scale, exam)}</span>
              <span className="report-skill-raw">
                原始分 {r.raw} / {r.scaleMax}
              </span>
            </div>
          ))}
        </div>
        <p className="report-note">
          Cambridge English Scale 分数按 Cambridge 官方练习题
          <button className="link-button" onClick={() => setTableOpen(true)}>
            换算表
          </button>
          （{SCALES[exam].name}，2020 年起的考试）估算，仅供参考；写作与口语由 AI 按 Cambridge
          官方评分标准评分{item.paper === 'speaking' ? '，发音暂未评估，按其余三项折算' : ''}。
        </p>
        <div className="dialog-actions">
          <button className="pill-button primary" autoFocus onClick={onClose}>
            查看答案与解析
          </button>
        </div>
      </div>
      {tableOpen && <ScaleTableDialog exam={exam} onClose={() => setTableOpen(false)} />}
    </div>
  );
}
