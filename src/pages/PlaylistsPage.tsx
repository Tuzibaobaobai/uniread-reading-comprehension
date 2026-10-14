import { Link } from 'react-router-dom';
import { staticContent } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { Book, Link as LinkIcon, Pencil, Question } from '@/components/Icons';

export function PlaylistsPage() {
  const { data, error } = useAsync(() => staticContent.getCatalog(), []);
  return (
    <main className="page">
      <h1 className="page-title">时文阅读</h1>
      {error && <p className="error">加载失败：{error.message}</p>}
      <div className="playlist-grid">
        {data?.playlists.map((p) => (
          <Link key={p.id} to={`/p/${p.id}`} className="playlist-card">
            <img className="playlist-card-cover" src={staticContent.assetUrl(p.cover)} alt="" />
            <div className="playlist-card-body">
              <div className="playlist-card-title">{p.title}</div>
              <div className="playlist-card-meta">
                共{p.itemCount}篇 · L{p.difficultyRange[0]}
                {p.difficultyRange[1] !== p.difficultyRange[0] ? `–${p.difficultyRange[1]}` : ''}
              </div>
              <div className="playlist-card-icons" aria-label="题型">
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
