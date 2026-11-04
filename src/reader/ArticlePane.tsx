import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { ArticleItemT, BlockT, InlineT, ItemT } from '@schema';
import { useTranslation } from 'react-i18next';
import { Rich, type BlankNode } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import { Panel } from '@/ui/common/Panel/Panel';
import { ArticleHeader } from '@/ui/read/ArticleHeader/ArticleHeader';
import { ArticleBody, ArticleText } from '@/ui/read/ArticleText/ArticleText';
import { Figure as FigureView } from '@/ui/read/Figure/Figure';
import { WordsBox } from '@/ui/read/WordsBox/WordsBox';
import { Dialogue } from '@/ui/read/Dialogue/Dialogue';
import { Highlight } from '@/ui/Highlight/Highlight';
import { highlightSupported, paint, sentenceRange } from './evidence';

interface Props {
  item: ArticleItemT;
  renderBlank: (n: BlankNode) => ReactNode;
  /** evidence for the current question (review mode) */
  evidence: { block: string; quote: string }[];
}

/**
 * highlight the evidence sentences of the current question inside `root` (CSS Custom Highlight API);
 * returns the blocks whose quote could not be matched — they fall back to whole-block highlighting
 */
export function useEvidencePaint(rootRef: RefObject<HTMLElement | null>, evidence: { block: string; quote: string }[], deps: unknown[] = []) {
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
  }, [evKey, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return fallback;
}

/** forward a pane's scroll element to both a local ref and the parent's ref */
export function mergeRefs<T>(local: { current: T | null }, ref: ((el: T | null) => void) | { current: T | null } | null) {
  return (el: T | null) => {
    local.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
}

/** left pane (rc/Common/Panel): title → info box → images → body → Words & Expressions (static content) */
export const ArticlePane = forwardRef<HTMLDivElement, Props>(function ArticlePane({ item, renderBlank, evidence }, ref) {
  const m = item.meta;
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fallback = useEvidencePaint(rootRef, evidence);
  const setRef = mergeRefs(rootRef, ref);
  const info = (
    [
      [t('reader.info.genre'), m.genre],
      [t('reader.info.wordCount'), m.wordCount],
      [t('reader.info.difficulty'), t('reader.info.level', { n: m.difficulty })],
      [t('reader.info.suggestedTime'), t('reader.info.minutes', { count: m.suggestedMinutes })],
      [t('reader.info.theme'), m.themeContext],
      [t('reader.info.requirement'), m.contentRequirement],
    ] as [string, string | number | undefined][]
  )
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([label, value]) => ({ label, value }));
  return (
    <Panel kind="article" ref={setRef}>
      <ArticleText>
        <ArticleHeader title={item.title} info={[...info, { label: t('reader.info.intro'), value: m.intro, wide: true }]} />

        {/* images without an explicit position go between the info box and the body */}
        {item.article.images
          .filter((img) => !item.article.blocks.some((b) => b.type === 'imageRef' && b.image === img.id))
          .map((img) => (
            <Figure key={img.id} img={img} />
          ))}

        <ArticleBody>
          {item.article.blocks.map((b) =>
            b.type === 'imageRef' ? (
              <Figure key={b.id} img={item.article.images.find((i) => i.id === b.image)} />
            ) : (
              <Block key={b.id} block={b} renderBlank={renderBlank} evidence={fallback.has(b.id)} />
            ),
          )}
        </ArticleBody>

        {item.article.vocabulary.length > 0 && <WordsBox items={item.article.vocabulary} />}
      </ArticleText>
    </Panel>
  );
});

/** an article / exam image (rc/Read/Figure); `full` = natural height (exam question material) */
export function Figure({ img, size }: { img?: ItemT['article']['images'][number]; size?: 'inline' | 'full' }) {
  if (!img) return null;
  return <FigureView src={staticContent.assetUrl(img.src)} alt={img.alt} w={img.w} h={img.h} caption={img.caption} size={size} />;
}

type ImageT = ItemT['article']['images'][number];

/** "**From:** Chris" → label + value boxes of an email header (#96) */
function NoteField({ line, renderBlank }: { line: InlineT[]; renderBlank: (n: BlankNode) => ReactNode }) {
  const [first, ...rest] = line;
  const labelled = first?.t === 'strong';
  return (
    <div className="rt-note-field">
      {labelled && <span className="rt-note-field-label">{first.v.trim()}</span>}
      <span className="rt-note-field-value">
        <Rich nodes={labelled ? rest : line} blank={renderBlank} />
      </span>
    </div>
  );
}

export function Block({
  block: b,
  renderBlank,
  evidence = false,
  imageOf,
}: {
  block: BlockT;
  renderBlank: (n: BlankNode) => ReactNode;
  evidence?: boolean;
  /** resolves a paragraph's portrait (exam papers) */
  imageOf?: (id: string) => ImageT | undefined;
}) {
  const cls = evidence ? Highlight.evidenceClass : undefined;
  const attrs = { 'data-block': b.id, className: cls };
  switch (b.type) {
    case 'paragraph': {
      const portrait = b.image ? imageOf?.(b.image) : undefined;
      if (portrait)
        // a writer's photo beside their text (KET Reading Part 2, #91)
        return (
          <div {...attrs} className={['rt-portrait-row', cls].filter(Boolean).join(' ')}>
            <img className="rt-portrait" src={staticContent.assetUrl(portrait.src)} alt={portrait.alt} width={portrait.w} height={portrait.h} />
            <p className="rt-p">
              <Rich nodes={b.content} blank={renderBlank} />
            </p>
          </div>
        );
      return (
        <p {...attrs} className={['rt-p', cls].filter(Boolean).join(' ')}>
          <Rich nodes={b.content} blank={renderBlank} />
        </p>
      );
    }
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
        <Dialogue
          {...attrs}
          legend={b.legend}
          turns={b.turns.map((t) => ({ speaker: t.speaker, content: <Rich nodes={t.content} blank={renderBlank} /> }))}
        />
      );
    case 'note':
      return (
        <div {...attrs} className={['rt-note', b.style && `is-${b.style}`, cls].filter(Boolean).join(' ')}>
          {b.title && (
            <p className="rt-note-title">
              <Rich nodes={b.title} blank={renderBlank} />
            </p>
          )}
          {b.header && b.header.length > 0 && (
            <div className="rt-note-header">
              {b.header.map((line, i) => (
                <NoteField key={i} line={line} renderBlank={renderBlank} />
              ))}
            </div>
          )}
          {b.heading && (
            <p className="rt-note-heading">
              <Rich nodes={b.heading} blank={renderBlank} />
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
