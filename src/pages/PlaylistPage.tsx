import { Link, useNavigate, useParams } from 'react-router-dom';
import { staticContent } from '@/lib/content';
import { localAttempts } from '@/lib/storage';
import { useAsync } from '@/lib/useAsync';
import { ArrowLeft, Star } from '@/components/Icons';
import { Thumb } from '@/components/Thumb';
import { formatMinutes } from '@/lib/labels';

export function PlaylistPage() {
  const { playlistId = '' } = useParams();
  const navigate = useNavigate();
  const { data: catalog, error } = useAsync(() => staticContent.getCatalog(), []);
  const pl = catalog?.playlists.find((p) => p.id === playlistId);

  const weeks = new Map<number, NonNullable<typeof pl>['items']>();
  pl?.items.forEach((i) => weeks.set(i.week, [...(weeks.get(i.week) ?? []), i]));

  return (
    <main className="page playlist-page">
      <button className="back-button playlist-back" onClick={() => navigate('/')} aria-label="返回">
        <ArrowLeft />
      </button>
      {error && <p className="error">加载失败：{error.message}</p>}
      {catalog && !pl && <p className="error">找不到该合集</p>}
      {pl && (
        <>
          <aside className="playlist-intro">
            <img className="playlist-intro-cover" src={staticContent.assetUrl(pl.cover)} alt="" />
            <h1 className="playlist-intro-title">{pl.title}</h1>
            <div className="playlist-intro-stats">
              <span>{pl.totalWords.toLocaleString()} 单词</span>
              <span>
                L{pl.difficultyRange[0]}~L{pl.difficultyRange[1]}
              </span>
            </div>
            <p className="playlist-intro-desc">{pl.description}</p>
            <button className="playlist-fav">
              <Star /> 收藏
            </button>
          </aside>
          <section className="playlist-items">
            <h2 className="playlist-items-head">合集（{pl.itemCount}）</h2>
            {[...weeks].map(([week, items]) => (
              <div key={week} className="week-group">
                <h3 className="week-label">Week {week}</h3>
                {items.map((it) => {
                  const att = localAttempts.get(it.id);
                  const done = att?.status === 'submitted' && att.result;
                  return (
                    <Link key={it.id} to={`/p/${pl.id}/${it.id}`} className="item-row">
                      <span className="item-row-num">{it.order}</span>
                      <Thumb className="item-row-thumb" src={it.thumbnail} title={it.title} day={it.day} week={it.week} accent={pl.accent} />
                      <span className="item-row-text">
                        <span className="item-row-title">{it.displayName}</span>
                        <span className="item-row-meta">
                          <span className="item-row-tag">{it.taskType.labelZh}</span>
                          {it.wordCount} 单词 • L{it.difficulty} • {it.questionCount} questions • {formatMinutes(it.suggestedMinutes)}
                        </span>
                      </span>
                      {done ? (
                        <span className="item-row-score">
                          {att.result!.score}/{att.result!.maxScore}
                        </span>
                      ) : att ? (
                        <span className="item-row-progress">进行中</span>
                      ) : null}
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
