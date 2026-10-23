import { Link } from 'react-router-dom';
import { staticContent } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { Book, Link as LinkIcon, Pencil, Question } from '@/components/Icons';
import OverflowTip from '@/components/OverflowTip';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';

export function PlaylistsPage() {
  const { t } = useTranslation();
  const { data, error } = useAsync(() => staticContent.getCatalog(), []);
  return (
    <main className="page">
      <h1 className="page-title">{t('playlists.title')}</h1>
      {error && <p className="error">{t('common.loadFailed', { message: error.message })}</p>}
      {!data && !error && <Loading />}
      <div className="playlist-grid">
        {data?.playlists.map((p) => (
          <Link key={p.id} to={`/p/${p.id}`} className="playlist-card">
            <img className="playlist-card-cover" src={staticContent.assetUrl(p.cover)} alt="" />
            <div className="playlist-card-body">
              <OverflowTip className="playlist-card-title">{p.title}</OverflowTip>
              <div className="playlist-card-meta">
                {p.format === 'vocab' ? (
                  <>{t('playlists.vocabMeta', { count: p.itemCount, band: p.gradeBand })}</>
                ) : p.format === 'exam' ? (
                  // exam papers (KET/PET 真题): papers and the CEFR level, no 时文阅读 difficulty
                  <>{t('playlists.examMeta', { count: p.itemCount, band: p.gradeBand })}</>
                ) : (
                  <>
                    {t('playlists.articleMeta', {
                      count: p.itemCount,
                      range: `${p.difficultyRange[0]}${p.difficultyRange[1] !== p.difficultyRange[0] ? `–${p.difficultyRange[1]}` : ''}`,
                    })}
                  </>
                )}
              </div>
              <div className="playlist-card-icons" aria-label={t('playlists.questionTypes')}>
                <Book />
                <Question />
                <Pencil />
                <LinkIcon />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
