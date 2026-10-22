import type React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { staticContent } from '@/lib/content';
import { BackArrow } from '@/components/Icons';
import Loading from '@/components/Loading';
import { localAttempts } from '@/lib/storage';
import { useAsync } from '@/lib/useAsync';
import starIcon from '@/assets/icons/star.svg';
import { Thumb } from '@/components/Thumb';
import { DAY_NAME, PAPER_EN, formatMinutes } from '@/lib/labels';
import OverflowTip from '@/components/OverflowTip';
import { examStatus, examStatusLabel, type ExamStatus } from '@/lib/exam-status';
import { examKey, grade, overallScale, type ExamKey, type Skill, type SkillReport } from '@/lib/cambridge';
import { useTranslation } from 'react-i18next';

export function PlaylistPage() {
  const { playlistId = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      {error && <p className="error">{t('common.loadFailed', { message: error.message })}</p>}
      {!catalog && !error && <Loading />}
      {catalog && !pl && <p className="error">{t('playlist.notFound')}</p>}
      {pl && (
        <>
          <aside className="playlist-intro">
            <button className="back-button playlist-back" onClick={() => navigate('/')} aria-label={t('common.back')}>
              <BackArrow />
            </button>
            <div className="playlist-intro-panel" style={{ '--cover': `url("${staticContent.assetUrl(pl.cover)}")` } as React.CSSProperties}>
            <img className="playlist-intro-cover" src={staticContent.assetUrl(pl.banner ?? pl.cover)} alt="" />
            <h1 className="playlist-intro-title">{pl.title}</h1>
            <div className="playlist-intro-stats">
              <span>{t('playlist.words', { count: pl.totalWords, words: pl.totalWords.toLocaleString() })}</span>
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
              <img src={starIcon} alt="" /> {t('playlist.favourite')}
            </button>
            </div>
          </aside>
          <section className="playlist-items">
            <h2 className="playlist-items-head">{t('playlist.itemsHead', { n: pl.itemCount })}</h2>
            {[...groups].map(([group, items]) => (
              <div key={group} className="week-group">
                <h3 className="week-label">
                  {exam ? t('playlist.test', { n: group }) : t('playlist.week', { n: group })}
                  {exam && <TestScore items={items} exam={examKey(pl.exam)} />}
                </h3>
                {items.map((it) => {
                  const att = localAttempts.get(it.id);
                  const done = att?.status === 'submitted' && att.result;
                  const progress = done ? 1 : att ? Math.min(Object.keys(att.responses).length / it.questionCount, 1) : 0;
                  const status = it.paper ? examStatusLabel(examStatus(att, it.paper, it.suggestedMinutes, Date.now(), examKey(pl.exam)), t) : null;
                  return (
                    <Link key={it.id} to={`/p/${pl.id}/${it.id}`} className="item-row">
                      <span className="item-row-num">{it.order}</span>
                      <Thumb
                        className="item-row-thumb"
                        title={it.title}
                        kicker={it.paper ? t('playlist.kickerTest', { n: it.test, paper: PAPER_EN[it.paper] }) : t('playlist.kickerWeek', { n: it.week, day: DAY_NAME[it.day!] })}
                        accent={pl.accent}
                      />
                      <span className="item-row-text">
                        <OverflowTip className="item-row-title">{it.title}</OverflowTip>
                        <span className="item-row-meta">
                          {[
                            it.taskType.labelZh,
                            it.wordCount ? t('playlist.words', { count: it.wordCount, words: it.wordCount }) : null,
                            it.difficulty !== undefined ? `L${it.difficulty}` : null,
                            t('playlist.questions', { count: it.questionCount }),
                            formatMinutes(it.suggestedMinutes, t),
                            it.paper ? status : done ? t('playlist.score', { score: att.result!.score, max: att.result!.maxScore }) : att ? t('playlist.inProgress') : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <span
                          className="item-row-progress"
                          role="progressbar"
                          aria-label={t('playlist.progress')}
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
function TestScore({ items, exam }: { items: { id: string; paper?: string; suggestedMinutes: number }[]; exam: ExamKey }) {
  const { t } = useTranslation();
  const skills: Partial<Record<Skill, SkillReport>> = {};
  let done = 0;
  items.forEach((it) => {
    if (!it.paper) return;
    const s: ExamStatus = examStatus(localAttempts.get(it.id), it.paper as never, it.suggestedMinutes, Date.now(), exam);
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
      title={t('playlist.testScoreTitle', { done })}
    >
      {overall !== null ? t('playlist.testScore', { score: overall, grade: grade(overall, exam, t) }) : t('playlist.testScorePending')}
    </span>
  );
}
