import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { BlockT, ItemT } from '@schema';
import { Rich, type BlankNode } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import { highlightSupported, paint, sentenceRange } from './evidence';

interface Props {
  item: ItemT;
  renderBlank: (n: BlankNode) => ReactNode;
  /** evidence for the current question (review mode) */
  evidence: { block: string; quote: string }[];
}

/** left pane: title → info box → images → body → Words & Expressions (static content) */
export const ArticlePane = forwardRef<HTMLDivElement, Props>(function ArticlePane({ item, renderBlank, evidence }, ref) {
  const m = item.meta;
  const rootRef = useRef<HTMLDivElement | null>(null);
  // blocks whose quote could not be matched fall back to whole-block highlighting
  const [fallback, setFallback] = useState<Set<string>>(new Set());
  const evKey = evidence.map((e) => `${e.block}|${e.quote}`).join('\n');
  useLayoutEffect(() => {
    const ranges: Range[] = [];
    const miss = new Set<string>();
    evidence.forEach((e) => {
      const el = rootRef.current?.querySelector<HTMLElement>(`[data-block="${e.block}"]`);
      const r = el && highlightSupported() ? sentenceRange(el, e.quote) : null;
      if (r) ranges.push(r);
      else miss.add(e.block);
    });
    paint('evidence', ranges);
    setFallback(miss);
    return () => paint('evidence', []);
  }, [evKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const setRef = (el: HTMLDivElement | null) => {
    rootRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  const info: [string, string | number | undefined][] = [
    ['语篇类型', m.genre],
    ['词数', m.wordCount],
    ['难度', `${m.difficulty} 级`],
    ['建议用时', `${m.suggestedMinutes} 分钟`],
    ['主题语境', m.themeContext],
    ['内容要求', m.contentRequirement],
  ];
  return (
    <div className="article-pane thin-scroll" ref={setRef}>
      <article className="article">
        <h1 className="article-title">{item.title}</h1>

        <dl className="info-box">
          {info
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => (
              <div key={k} className="info-box-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          <div className="info-box-row info-box-intro">
            <dt>导读</dt>
            <dd>{m.intro}</dd>
          </div>
        </dl>

        {/* images without an explicit position go between the info box and the body */}
        {item.article.images
          .filter((img) => !item.article.blocks.some((b) => b.type === 'imageRef' && b.image === img.id))
          .map((img) => (
            <Figure key={img.id} img={img} />
          ))}

        <div className="article-body">
          {item.article.blocks.map((b) =>
            b.type === 'imageRef' ? (
              <Figure key={b.id} img={item.article.images.find((i) => i.id === b.image)} />
            ) : (
              <Block key={b.id} block={b} renderBlank={renderBlank} evidence={fallback.has(b.id)} />
            ),
          )}
        </div>

        {item.article.vocabulary.length > 0 && (
          <section className="words-box" aria-label="Words & Expressions">
            <h2 className="words-box-title">Words &amp; Expressions</h2>
            <ul>
              {item.article.vocabulary.map((v) => (
                <li key={v.id}>
                  <span className="words-head">{v.headword}</span>
                  {v.ipa && <span className="words-ipa">/{v.ipa}/</span>}
                  {v.pos && <span className="words-pos">{v.pos}</span>}
                  <span className="words-zh">{v.meaningZh}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
});

function Figure({ img }: { img?: ItemT['article']['images'][number] }) {
  if (!img) return null;
  return (
    <figure className="article-figure">
      <img src={staticContent.assetUrl(img.src)} alt={img.alt} width={img.w} height={img.h} style={{ aspectRatio: `${img.w} / ${img.h}` }} />
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

export function Block({
  block: b,
  renderBlank,
  evidence = false,
}: {
  block: BlockT;
  renderBlank: (n: BlankNode) => ReactNode;
  evidence?: boolean;
}) {
  const cls = evidence ? 'is-evidence' : undefined;
  const attrs = { 'data-block': b.id, className: cls };
  switch (b.type) {
    case 'paragraph':
      return (
        <p {...attrs} className={['rt-p', cls].filter(Boolean).join(' ')}>
          <Rich nodes={b.content} blank={renderBlank} />
        </p>
      );
    case 'heading':
      return (
        <h3 {...attrs} className={['rt-h', cls].filter(Boolean).join(' ')}>
          <Rich nodes={b.content} blank={renderBlank} />
        </h3>
      );
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul';
      return (
        <Tag {...attrs} className={['rt-list', cls].filter(Boolean).join(' ')}>
          {b.items.map((it, i) => (
            <li key={i}>
              <Rich nodes={it} blank={renderBlank} />
            </li>
          ))}
        </Tag>
      );
    }
    case 'dialogue':
      return (
        <div {...attrs} className={['rt-dialogue', cls].filter(Boolean).join(' ')}>
          {b.legend && <p className="rt-dialogue-legend">{b.legend}</p>}
          {b.turns.map((t, i) => (
            <p key={i} className="rt-turn">
              <span className="rt-speaker">{t.speaker}:</span>
              <span>
                <Rich nodes={t.content} blank={renderBlank} />
              </span>
            </p>
          ))}
        </div>
      );
    case 'note':
      return (
        <div {...attrs} className={['rt-note', cls].filter(Boolean).join(' ')}>
          {b.title && (
            <p className="rt-note-title">
              <Rich nodes={b.title} blank={renderBlank} />
            </p>
          )}
          {b.content.map((c, i) => (
            <p key={i}>
              <Rich nodes={c} blank={renderBlank} />
            </p>
          ))}
          {b.signature?.map((c, i) => (
            <p key={`s${i}`} className="rt-note-sign">
              <Rich nodes={c} blank={renderBlank} />
            </p>
          ))}
        </div>
      );
    case 'table':
      return (
        <div {...attrs} className={['rt-table-wrap', cls].filter(Boolean).join(' ')}>
          <table className="rt-table">
            {b.caption && (
              <caption>
                <Rich nodes={b.caption} blank={renderBlank} />
              </caption>
            )}
            <tbody>
              {b.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => {
                    const Cell = c.header ? 'th' : 'td';
                    return (
                      <Cell key={ci} colSpan={c.colSpan} rowSpan={c.rowSpan}>
                        <Rich nodes={c.content} blank={renderBlank} />
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'imageRef':
      // rendered by ArticlePane as a figure
      return null;
  }
}
