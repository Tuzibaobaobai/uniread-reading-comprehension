import { useEffect, useState } from 'react';
import type { ExamItemT } from '@schema';
import { examReport, grade, type Skill } from '@/lib/cambridge';
import type { Result } from '@/lib/grading';
import { PAPER_ZH } from '@/lib/labels';

/* Exam-paper chrome (KET/PET 真题). Not yet in Figma — built from existing tokens (待补组件, docs/design/figma-registry.md). */

/** practice or timed exam — asked before a new attempt */
export function ModeDialog({ item, onChoose }: { item: ExamItemT; onChoose: (mode: 'practice' | 'exam') => void }) {
  const listening = item.paper === 'listening';
  const speaking = item.paper === 'speaking';
  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog mode-dialog" role="dialog" aria-modal aria-labelledby="mode-title">
        <h2 id="mode-title">{item.title}</h2>
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
  const parts = item.sections.map((s) => {
    const rs = s.questions.map((q) => result.byQuestion.find((r) => r.q === q.id)).filter((r) => !!r);
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
              <span className="report-skill-scale">{r.pending ? '…' : (r.scale ?? '<82')}</span>
              <span className="report-skill-grade">{r.pending ? '评分中' : grade(r.scale)}</span>
              <span className="report-skill-raw">
                原始分 {r.raw} / {r.scaleMax}
              </span>
            </div>
          ))}
        </div>
        <p className="report-note">
          Cambridge English Scale 分数按 Cambridge 官方练习题换算表（A2 Key / A2 Key for Schools，2020 年起的考试）估算，仅供参考；写作与口语由 AI 按 Cambridge
          官方评分标准评分{item.paper === 'speaking' ? '，发音暂未评估，按其余三项折算' : ''}。
        </p>
        <div className="dialog-actions">
          <button className="pill-button primary" autoFocus onClick={onClose}>
            查看答案与解析
          </button>
        </div>
      </div>
    </div>
  );
}
