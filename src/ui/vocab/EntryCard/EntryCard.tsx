import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LexiconEntryT, LexiconT } from '@schema';
import { Rich, plainText } from '@/components/Rich';
import { Block } from '@/reader/ArticlePane';
import { ChevronDown } from '@/components/Icons';
import { canSpeak, say } from '@/lib/say';
import { PlayButton } from '@/ui/PlayButton/PlayButton';
import { MarkTag } from '@/ui/vocab/MarkTag/MarkTag';
import { Example } from '@/ui/vocab/Example/Example';
import { TipBox } from '@/ui/vocab/TipBox/TipBox';
import { CompareBlock } from '@/ui/vocab/CompareBlock/CompareBlock';
import './EntryCard.css';

/**
 * RC/Vocab/EntryCard (proposed, Figma RC · Proposed 19445:654): one handbook entry as printed.
 * Variants: Known = known (green, folded) / unknown + unmarked (red, open) (#133) · Open (fold toggle) · Kind = word / phrase.
 * Composed of PlayButton (UniRead btn-play), MarkTag, Example, TipBox (#134 folded) and CompareBlock (辨析).
 */
export function EntryCard({
  entry: e,
  marks = [],
  known,
  as: Tag = 'li',
}: {
  entry: LexiconEntryT;
  marks?: LexiconT['marks'];
  /** the Scan mark — 认识 folds the entry, 不认识 opens it; undefined (the entry dialog) = always open */
  known?: boolean;
  as?: 'li' | 'div';
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(known !== true);
  const [more, setMore] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  // a mark changed in Scan resets the entry to that mark's default
  useEffect(() => setOpen(known !== true), [known]);
  const folded = known !== undefined && !open;
  const mark = (key: string) => marks.find((m) => m.key === key);
  // graded stars (中考 * / ** / ***): the level's own meaning when the book defines one
  const starText = mark('star')?.levels?.[(e.starLevel ?? 1) - 1]?.description ?? mark('star')?.description;
  const extras = [
    e.phrases?.length && { label: t('vocab.entry.phrases'), rows: e.phrases.map((p) => [p.en, p.zh]) },
    e.wordFamily?.length && { label: t('vocab.entry.family'), rows: e.wordFamily.map((w) => [`${w.word}${w.pos ? ` ${w.pos}` : ''}`, w.zh]) },
    e.synonyms?.length && { label: t('vocab.entry.synonyms'), rows: [[e.synonyms.join(', '), '']] },
    e.antonyms?.length && { label: t('vocab.entry.antonyms'), rows: [[e.antonyms.join(', '), '']] },
    e.proverbs?.length && { label: t('vocab.entry.proverbs'), rows: e.proverbs.map((p) => [p.en, p.zh]) },
  ].filter((x): x is { label: string; rows: string[][] } => !!x);
  return (
    <Tag className={`entry ${known === true ? 'is-known' : known === false ? 'is-unknown' : ''} ${folded ? 'is-folded' : ''}`} id={`entry-${e.id}`} data-entry={e.id}>
      <div className="entry-head">
        <span className="entry-num">{e.number}</span>
        <h3 className="entry-word">
          {e.supplement && (
            <MarkTag kind="supplement" title={mark('supplement')?.description} label={mark('supplement')?.description}>
              {mark('supplement')?.symbol ?? '▲'}
            </MarkTag>
          )}
          {e.star && (
            <MarkTag kind="star" title={starText} label={starText ?? t('vocab.entry.star')}>
              {'*'.repeat(e.starLevel ?? 1)}
            </MarkTag>
          )}
          {e.headword}
          {known !== undefined && <span className="sr-only"> ({known ? t('vocab.scan.know') : t('vocab.scan.dontKnow')})</span>}
        </h3>
        {(e.audio?.word || canSpeak()) && <PlayButton label={t('vocab.entry.play', { word: e.headword })} onPlay={() => say(e.headword, e.audio?.word)} />}
        {e.ipa?.map((p) => (
          <span key={p} className="entry-ipa">
            /{p}/
          </span>
        ))}
        {e.levelMark && (
          <MarkTag kind="level" title={mark('levelMark')?.description}>
            {mark('levelMark')?.symbol ?? t('vocab.entry.level')}
          </MarkTag>
        )}
        {e.textbook?.map((x) => (
          <MarkTag key={x} kind="textbook">
            {x}
          </MarkTag>
        ))}
        {known !== undefined && (
          <button
            type="button"
            className="entry-fold"
            aria-expanded={open}
            aria-controls={`entry-body-${e.id}`}
            aria-label={t(open ? 'vocab.entry.collapseWord' : 'vocab.entry.expandWord', { word: e.headword })}
            onClick={() => setOpen(!open)}
          >
            {open ? t('vocab.entry.collapse') : t('vocab.entry.expand')}
            <ChevronDown />
          </button>
        )}
      </div>
      {!folded && (
        <div className="entry-body" id={`entry-body-${e.id}`}>
          <p className="entry-senses">
            {e.senses.map((s, i) => (
              <span key={i} className="entry-sense">
                {s.pos && <b className="entry-pos">{s.pos}</b>}
                {s.zh}
              </span>
            ))}
            {e.inflections && <span className="entry-infl">{e.inflections}</span>}
          </p>
          {e.examples.length > 0 && (
            <ul className="entry-examples">
              {e.examples.map((x, i) => (
                <Example
                  key={i}
                  en={<Rich nodes={x.en} />}
                  zh={x.zh}
                  play={e.audio?.examples?.[i] || canSpeak() ? { label: t('vocab.entry.playExample', { n: i + 1 }), onPlay: () => say(plainText(x.en), e.audio?.examples?.[i]) } : undefined}
                />
              ))}
            </ul>
          )}
          {e.tip && (
            <TipBox title={t('vocab.entry.tip')} open={tipOpen} onToggle={() => setTipOpen(!tipOpen)}>
              {e.tip.map((b, i) => (
                <Block key={i} block={b} renderBlank={() => null} />
              ))}
            </TipBox>
          )}
          {(extras.length > 0 || !!e.compare?.length) && (
            <>
              <button type="button" className="entry-more" aria-expanded={more} onClick={() => setMore(!more)}>
                {more
                  ? t('vocab.entry.less')
                  : t('vocab.entry.more', { list: [...extras.map((x) => x.label), ...(e.compare?.length ? [t('vocab.entry.compare')] : [])].join(' · ') })}
              </button>
              {more &&
                extras.map((x) => (
                  <dl key={x.label} className="entry-extra">
                    <dt>{x.label}</dt>
                    {x.rows.map(([en, zh], i) => (
                      <dd key={i}>
                        <span className="entry-extra-en">{en}</span>
                        {zh && <span className="entry-extra-zh">{zh}</span>}
                      </dd>
                    ))}
                  </dl>
                ))}
              {more &&
                e.compare?.map((c, i) => (
                  <CompareBlock key={i} title={t('vocab.entry.compare')} words={c.words}>
                    {c.blocks.map((b, j) => (
                      <Block key={j} block={b} renderBlank={() => null} />
                    ))}
                  </CompareBlock>
                ))}
            </>
          )}
        </div>
      )}
    </Tag>
  );
}
