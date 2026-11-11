import { staticContent } from '@/lib/content';
import { localAttempts } from '@/lib/storage';
import { useAsync } from '@/lib/useAsync';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/ui/common/PageHeader/PageHeader';
import { PlaylistCard } from '@/ui/playlist/PlaylistCard/PlaylistCard';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { Chip } from '@/ui/common/Chip/Chip';
import scanIcon from '@/assets/icons/card-scan.svg';
import studyIcon from '@/assets/icons/card-study.svg';
import quizIcon from '@/assets/icons/card-quiz.svg';

/** the grey learning-mode icons of the card (designer's 合集类型: icon=Scan / Study / Quiz of UIKit-LearnNav icons) */
const MODE_ICON = { scan: scanIcon, study: studyIcon, quiz: quizIcon } as const;

export function PlaylistsPage() {
  const { t } = useTranslation();
  const { data, error } = useAsync(() => staticContent.getCatalog(), []);
  return (
    <main className="page">
      <PageHeader
        title={t('playlists.title')}
        status={
          <>
            {error && (
              <InlineNotice role="alert" actions={<Chip onClick={() => window.location.reload()}>{t('common.retry')}</Chip>}>
                {t('common.loadFailedFriendly')}
              </InlineNotice>
            )}
            {!data && !error && <Loading />}
          </>
        }
      >
        {data?.playlists.map((p) => {
          // 词汇天天练 days have 速览 / 学习 / 测验; 时文阅读 and 真题 are read and answered
          const modes = p.format === 'vocab' ? (['scan', 'study', 'quiz'] as const) : (['study', 'quiz'] as const);
          const done = p.items.filter((i) => {
            const a = localAttempts.get(i.id);
            return a?.status === 'submitted' && a.result;
          }).length;
          const total = p.items.length;
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
