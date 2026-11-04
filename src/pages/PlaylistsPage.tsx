import { staticContent } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { Book, Link as LinkIcon, Pencil, Question } from '@/components/Icons';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/ui/common/PageHeader/PageHeader';
import { PlaylistCard } from '@/ui/playlist/PlaylistCard/PlaylistCard';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';

export function PlaylistsPage() {
  const { t } = useTranslation();
  const { data, error } = useAsync(() => staticContent.getCatalog(), []);
  return (
    <main className="page">
      <PageHeader
        title={t('playlists.title')}
        status={
          <>
            {error && <InlineNotice role="alert">{t('common.loadFailed', { message: error.message })}</InlineNotice>}
            {!data && !error && <Loading />}
          </>
        }
      >
        {data?.playlists.map((p) => (
          <PlaylistCard
            key={p.id}
            to={`/p/${p.id}`}
            cover={staticContent.assetUrl(p.cover)}
            title={p.title}
            meta={
              p.format === 'vocab'
                ? t('playlists.vocabMeta', { count: p.itemCount, band: p.gradeBand })
                : p.format === 'exam'
                  ? // exam papers (KET/PET 真题): papers and the CEFR level, no 时文阅读 difficulty
                    t('playlists.examMeta', { count: p.itemCount, band: p.gradeBand })
                  : t('playlists.articleMeta', {
                      count: p.itemCount,
                      range: `${p.difficultyRange[0]}${p.difficultyRange[1] !== p.difficultyRange[0] ? `–${p.difficultyRange[1]}` : ''}`,
                    })
            }
            iconsLabel={t('playlists.questionTypes')}
            icons={
              <>
                <Book />
                <Question />
                <Pencil />
                <LinkIcon />
              </>
            }
          />
        ))}
      </PageHeader>
    </main>
  );
}
