import type React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { staticContent } from '@/lib/content';
import { localAttempts } from '@/lib/storage';
import { useAsync } from '@/lib/useAsync';
import arrowLeft from '@/assets/icons/arrow-left.svg';
import starIcon from '@/assets/icons/star.svg';
import { Thumb } from '@/components/Thumb';
import { DAY_NAME, PAPER_EN, formatMinutes } from '@/lib/labels';
import OverflowTip from '@/components/OverflowTip';
import { examStatus, examStatusLabel, type ExamStatus } from '@/lib/exam-status';
import { grade, overallScale, type Skill, type SkillReport } from '@/lib/cambridge';

export function PlaylistPage() {
  const { playlistId = '' } = useParams();
  const navigate = useNavigate();
  const { data: catalog, error } = useAsync(() => staticContent.getCatalog(), []);
  const pl = catalog?.playlists.find((p) => p.id === playlistId);

  // 时文阅读: grouped by week; exam papers (KET/PET 真题): grouped by test (第 N 套)
  const exam = pl?.format === 'exam';
  const groups = new Map<number, NonNullable<typeof pl>['items']>();
  pl?.items.forEach((i) => {
    const g = (exam ? i.test : i.week) ?? 0;
    groups.set(g, [...(groups.get(g) ?? []), i]);
  });

  return (
    <main className="page playlist-page">
      {error && <p className="error">加载失败：{error.message}</p>}
      {catalog && !pl && <p className="error">找不到该合集</p>}
      {pl && (
        <>
          <aside className="playlist-intro">
            <button className="back-button playlist-back" onClick={() => navigate('/')} aria-label="返回">
              <img src={arrowLeft} alt="" />
            </button>
            <div className="playlist-intro-panel" style={{ '--cover': `url("${staticContent.assetUrl(pl.cover)}")` } as React.CSSProperties}>
            <img className="playlist-intro-cover" src={staticContent.assetUrl(pl.cover)} alt="" />
            <h1 className="playlist-intro-title">{pl.title}</h1>
            <div className="playlist-intro-stats">
              <span>{pl.totalWords.toLocaleString()} 单词</span>
              {exam ? (
                <span>{pl.gradeBand}</span>
              ) : (
                <span>
                  L{pl.difficultyRange[0]}~L{pl.difficultyRange[1]}
                </span>
              )}
            </div>
            <p className="playlist-intro-desc">{pl.description}</p>
            <button className="playlist-fav">
              <img src={starIcon} alt="" /> 收藏
            </button>
            </div>
          </aside>
          <section className="playlist-items">
            <h2 className="playlist-items-head">合集（{pl.itemCount}）</h2>
            {[...groups].map(([group, items]) => (
              <div key={group} className="week-group">
                <h3 className="week-label">
                  {exam ? `第 ${group} 套` : `Week ${group}`}
                  {exam && <TestScore items={items} />}
                </h3>
                {items.map((it) => {
                  const att = localAttempts.get(it.id);
                  const done = att?.status === 'submitted' && att.result;
                  const progress = done ? 1 : att ? Math.min(Object.keys(att.responses).length / it.questionCount, 1) : 0;
                  const status = it.paper ? examStatusLabel(examStatus(att, it.paper, it.suggestedMinutes)) : null;
                  return (
                    <Link key={it.id} to={`/p/${pl.id}/${it.id}`} className="item-row">
                      <span className="item-row-num">{it.order}</span>
                      <Thumb
                        className="item-row-thumb"
                        src={it.thumbnail}
                        title={it.title}
                        kicker={it.paper ? `Test ${it.test} · ${PAPER_EN[it.paper]}` : `Week ${it.week} · ${DAY_NAME[it.day!]}`}
                        accent={pl.accent}
                      />
                      <span className="item-row-text">
                        <OverflowTip className="item-row-title">{it.title}</OverflowTip>
                        <span className="item-row-meta">
                          {[
                            it.taskType.labelZh,
                            it.wordCount ? `${it.wordCount} 单词` : null,
                            it.difficulty !== undefined ? `L${it.difficulty}` : null,
                            `${it.questionCount} 题`,
                            formatMinutes(it.suggestedMinutes),
                            it.paper ? status : done ? `得分 ${att.result!.score}/${att.result!.maxScore}` : att ? '进行中' : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <span
                          className="item-row-progress"
                          role="progressbar"
                          aria-label="完成进度"
                          aria-valuenow={Math.round(progress * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span style={{ width: `${progress * 100}%` }} />
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

/**
 * KET overall result for one test (GitHub #68): the four skills' Cambridge English Scale scores averaged,
 * once Reading, Writing, Listening and Speaking are all submitted and scored
 */
function TestScore({ items }: { items: { id: string; paper?: string; suggestedMinutes: number }[] }) {
  const skills: Partial<Record<Skill, SkillReport>> = {};
  let done = 0;
  items.forEach((it) => {
    if (!it.paper) return;
    const s: ExamStatus = examStatus(localAttempts.get(it.id), it.paper as never, it.suggestedMinutes);
    if (s.kind !== 'done') return;
    s.reports.forEach((r) => {
      skills[r.skill] = r;
      done++;
    });
  });
  const overall = overallScale(skills);
  return (
    <span
      className={`test-score ${overall !== null ? 'is-final' : ''}`}
      title={`四项 Cambridge English Scale 分数的平均（估算）；已完成 ${done}/4 项`}
    >
      {overall !== null ? `成绩：${overall} · ${grade(overall)}` : '成绩：待完成所有考试'}
    </span>
  );
}
