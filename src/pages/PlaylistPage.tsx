import { useNavigate, useParams } from 'react-router-dom';
import { staticContent } from '@/lib/content';
import Loading from '@/components/Loading';
import { localAttempts } from '@/lib/storage';
import { useAsync } from '@/lib/useAsync';
import { DAY_NAME, PAPER_EN, formatMinutes, taskTypeLabel } from '@/lib/labels';
import { examStatus, examStatusLabel, type ExamStatus } from '@/lib/exam-status';
import { examKey, grade, overallScale, type ExamKey, type Skill, type SkillReport } from '@/lib/cambridge';
import { useTranslation } from 'react-i18next';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { Tag } from '@/ui/common/Tag/Tag';
import { PlaylistIntro } from '@/ui/common/PlaylistIntro/PlaylistIntro';
import { ListHeader } from '@/ui/common/ListHeader/ListHeader';
import { TextThumb } from '@/ui/common/TextThumb/TextThumb';
import { FavoriteButton } from '@/ui/playlist/FavoriteButton/FavoriteButton';
import { GroupTitle } from '@/ui/playlist/GroupTitle/GroupTitle';
import { PlaylistItem } from '@/ui/playlist/PlaylistItem/PlaylistItem';

export function PlaylistPage() {
  const { playlistId = '' } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: catalog, error } = useAsync(() => staticContent.getCatalog(), []);
  const pl = catalog?.playlists.find((p) => p.id === playlistId);

  // 时文阅读: grouped by week; exam papers (KET/PET 真题): grouped by test (第 N 套)
  const exam = pl?.format === 'exam';
  // 词汇天天练 (#110): one list of days
  const vocab = pl?.format === 'vocab';
  const groups = new Map<number, NonNullable<typeof pl>['items']>();
  pl?.items.forEach((i) => {
    const g = (vocab ? 0 : exam ? i.test : i.week) ?? 0;
    groups.set(g, [...(groups.get(g) ?? []), i]);
  });

  return (
    <main className="page playlist-page">
      {error && <InlineNotice role="alert">{t('common.loadFailed', { message: error.message })}</InlineNotice>}
      {!catalog && !error && <Loading />}
      {catalog && !pl && <InlineNotice role="alert">{t('playlist.notFound')}</InlineNotice>}
      {pl && (
        <>
          <PlaylistIntro
            cover={staticContent.assetUrl(pl.cover)}
            banner={staticContent.assetUrl(pl.banner ?? pl.cover)}
            title={pl.title}
            stats={[
              vocab
                ? t('playlist.entries', { count: pl.totalWords })
                : t('playlist.words', { count: pl.totalWords, words: pl.totalWords.toLocaleString() }),
              exam || vocab ? pl.gradeBand : pl.difficultyRange[1] !== pl.difficultyRange[0]
                  ? `L${pl.difficultyRange[0]}~L${pl.difficultyRange[1]}`
                  : `L${pl.difficultyRange[0]}`,
            ]}
            description={pl.description}
            backLabel={t('common.back')}
            onBack={() => navigate('/')}
            action={<FavoriteButton label={t('playlist.favourite')} />}
          />
          <section className="playlist-items">
            <ListHeader>{t('playlist.itemsHead', { n: pl.itemCount })}</ListHeader>
            {[...groups].map(([group, items]) => (
              <div key={group} className="week-group">
                <GroupTitle badge={exam ? <TestScore items={items} exam={examKey(pl.exam)} /> : undefined}>
                  {vocab ? t('playlist.vocabDays') : exam ? t('playlist.test', { n: group }) : t('playlist.week', { n: group })}
                </GroupTitle>
                {items.map((it) => {
                  const att = localAttempts.get(it.id);
                  const done = att?.status === 'submitted' && att.result;
                  const progress = done ? 1 : att ? Math.min(Object.keys(att.responses).length / it.questionCount, 1) : 0;
                  const status = it.paper ? examStatusLabel(examStatus(att, it.paper, it.suggestedMinutes, Date.now(), examKey(pl.exam)), t) : null;
                  return (
                    <PlaylistItem
                      key={it.id}
                      to={`/p/${pl.id}/${it.id}`}
                      number={it.order}
                      done={!!done}
                      thumb={
                        <TextThumb
                          className="item-row-thumb"
                          kind={it.paper ? 'exam' : 'reading'}
                          title={it.title}
                          kicker={
                            it.dayNumber !== undefined
                              ? t('playlist.kickerDay', { n: it.dayNumber })
                              : it.paper
                                ? t('playlist.kickerTest', { n: it.test, paper: PAPER_EN[it.paper] })
                                : t('playlist.kickerWeek', { n: it.week, day: DAY_NAME[it.day!] })
                          }
                          accent={pl.accent}
                        />
                      }
                      title={it.dayNumber !== undefined ? t('vocab.dayTitle', { n: it.dayNumber, range: it.title }) : it.title}
                      meta={[
                        taskTypeLabel(it.taskType, i18n.language, t),
                        it.entryCount ? t('playlist.entries', { count: it.entryCount }) : null,
                        it.wordCount ? t('playlist.words', { count: it.wordCount, words: it.wordCount }) : null,
                        it.difficulty !== undefined ? `L${it.difficulty}` : null,
                        t('playlist.questions', { count: it.questionCount }),
                        formatMinutes(it.suggestedMinutes, t),
                        it.paper ? status : done ? t('playlist.score', { score: Math.round(att.result!.score), max: Math.round(att.result!.maxScore) }) : att ? t('playlist.inProgress') : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      progress={progress}
                      progressLabel={t('playlist.progress')}
                    />
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
    <Tag
      tone={overall !== null ? 'accent' : 'neutral'}
      className={`test-score${overall !== null ? ' is-final' : ''}`}
      title={t('playlist.testScoreTitle', { done })}
    >
      {overall !== null ? t('playlist.testScore', { score: overall, grade: grade(overall, exam, t) }) : t('playlist.testScorePending')}
    </Tag>
  );
}
