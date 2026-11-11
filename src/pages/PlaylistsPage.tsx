import { staticContent } from '@/lib/content';
import { localAttempts } from '@/lib/storage';
import { useAsync } from '@/lib/useAsync';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/ui/common/PageHeader/PageHeader';
import { PlaylistCard } from '@/ui/playlist/PlaylistCard/PlaylistCard';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { Chip } from '@/ui/common/Chip/Chip';
import { FilterChips } from '@/ui/common/FilterChips/FilterChips';
import { useState } from 'react';
import type { CatalogT } from '@schema';
import scanIcon from '@/assets/icons/card-scan.svg';
import studyIcon from '@/assets/icons/card-study.svg';
import quizIcon from '@/assets/icons/card-quiz.svg';

/** the grey learning-mode icons of the card (designer's 合集类型: icon=Scan / Study / Quiz of UIKit-LearnNav icons) */
const MODE_ICON = { scan: scanIcon, study: studyIcon, quiz: quizIcon } as const;

type Filter = 'all' | 'reading' | 'done';

/**
 * #149 (资源列表 19917:187733): the learner's progress per playlist, for the filter row — 最近在读 = started and not
 * finished (latest activity first), 已完成 = every item submitted. The design's 有更新 needs a content-update signal
 * the catalog does not have, so it is not shown.
 */
function progressOf(p: CatalogT['playlists'][number]) {
  let done = 0;
  let last = '';
  for (const i of p.items) {
    const a = localAttempts.get(i.id);
    if (!a) continue;
    if (a.status === 'submitted' && a.result) done++;
    const at = a.submittedAt ?? a.startedAt;
    if (at > last) last = at;
  }
  return { done, total: p.items.length, last };
}

export function PlaylistsPage() {
  const { t } = useTranslation();
  const { data, error } = useAsync(() => staticContent.getCatalog(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const rows = (data?.playlists ?? []).map((p) => ({ p, ...progressOf(p) }));
  const reading = rows.filter((r) => r.last && r.done < r.total).sort((a, b) => (a.last < b.last ? 1 : -1));
  const done = rows.filter((r) => r.total > 0 && r.done === r.total);
  const shown = filter === 'reading' ? reading : filter === 'done' ? done : rows;
  return (
    <main className="page page-home">
      <PageHeader
        title={t('playlists.title')}
        filters={
          data && (
            <FilterChips<Filter>
              label={t('playlists.filterLabel')}
              value={filter}
              onChange={setFilter}
              chips={[
                { key: 'all', label: t('playlists.filterAll'), count: rows.length },
                { key: 'reading', label: t('playlists.filterReading'), count: reading.length },
                { key: 'done', label: t('playlists.filterDone'), count: done.length },
              ]}
            />
          )
        }
        status={
          <>
            {error && (
              <InlineNotice role="alert" actions={<Chip onClick={() => window.location.reload()}>{t('common.retry')}</Chip>}>
                {t('common.loadFailedFriendly')}
              </InlineNotice>
            )}
            {!data && !error && <Loading />}
            {data && shown.length === 0 && <p className="playlist-empty">{t(filter === 'done' ? 'playlists.emptyDone' : 'playlists.emptyReading')}</p>}
          </>
        }
      >
        {shown.map(({ p, done, total }) => {
          // 词汇天天练 days have 速览 / 学习 / 测验; 时文阅读 and 真题 are read and answered
          const modes = p.format === 'vocab' ? (['scan', 'study', 'quiz'] as const) : (['study', 'quiz'] as const);
          return (
            <PlaylistCard
              key={p.id}
              to={`/p/${p.id}`}
              cover={staticContent.assetUrl(p.cover)}
              title={p.title}
              progress={{ done, total, label: t('playlists.progress', { done, total }) }}
              meta={
                p.format === 'vocab'
                  ? [t('playlists.vocabCount', { count: p.itemCount }), p.gradeBand]
                  : p.format === 'exam'
                    ? // exam papers (KET/PET 真题): papers and the CEFR level, no 时文阅读 difficulty
                      [t('playlists.examCount', { count: p.itemCount }), p.gradeBand]
                    : [
                        t('playlists.articleCount', { count: p.itemCount }),
                        t('playlists.level', {
                          range: `${p.difficultyRange[0]}${p.difficultyRange[1] !== p.difficultyRange[0] ? `–${p.difficultyRange[1]}` : ''}`,
                        }),
                      ]
              }
              iconsLabel={t(p.format === 'vocab' ? 'playlists.modesVocab' : 'playlists.modesReading')}
              icons={modes.map((m) => (
                <span key={m} className="playlist-card-icon">
                  <img src={MODE_ICON[m]} alt="" />
                </span>
              ))}
            />
          );
        })}
      </PageHeader>
    </main>
  );
}
