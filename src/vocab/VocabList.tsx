import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LexiconEntryT, LexiconT } from '@schema';
import { Rich, plainText } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import { speakWithDevice } from '@/reader/Speaking';
import { Block } from '@/reader/ArticlePane';
import { ChevronDown } from '@/components/Icons';
import playIcon from '@/assets/icons/audio-play.svg';

let player: HTMLAudioElement | null = null;

/** the entry's generated recording (scripts/tts.mjs), else the device's voice */
export function say(text: string, audio?: { src: string }) {
  player?.pause();
  if (audio) {
    player = new Audio(staticContent.assetUrl(audio.src));
    void player.play().catch(() => speakWithDevice(text));
    return;
  }
  speakWithDevice(text);
}

const canSpeak = () => typeof speechSynthesis !== 'undefined';

/**
 * 词汇天天练 step 2 · Study (#110, #133): the day's handbook entries as printed — headword, IPA, marks, senses, examples,
 * 常用词组 / 词形拓展 / 近反义 / 谚语 (folded) and 名师点拨. The Scan marks colour each headword: 认识 green and folded,
 * 不认识 red and open; a word not marked in Scan counts as 不认识. Either can be opened or folded by hand.
 */
export function VocabList({
  entries,
  marks = [],
  known,
}: {
  entries: LexiconEntryT[];
  /** the word list's legend (lexicon.json) */
  marks?: LexiconT['marks'];
  /** the Scan marks (attempt.known) */
  known: Record<string, boolean>;
}) {
  const { t } = useTranslation();
  const knownCount = entries.filter((e) => known[e.id] === true).length;
  const unmarked = entries.filter((e) => known[e.id] === undefined).length;
  return (
    <div className="vocab-list">
      <div className="vocab-toolbar">
        <span className="vocab-count">{t('vocab.list.count', { count: entries.length })}</span>
        <span className="vocab-tally" role="status">
          {t('vocab.list.tally', { known: knownCount, unknown: entries.length - knownCount })}
          {unmarked > 0 && ` · ${t('vocab.list.unmarked', { count: unmarked })}`}
        </span>
        <Legend entries={entries} marks={marks} />
      </div>
      <ol className="vocab-entries">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} marks={marks} known={known[e.id] ?? false} />
        ))}
      </ol>
    </div>
  );
}

/** the mark keys an entry carries */
const marksOf = (e: LexiconEntryT) =>
  new Set([e.star && 'star', e.supplement && 'supplement', e.levelMark && 'levelMark', e.textbook?.length && 'textbook'].filter(Boolean) as string[]);

/**
 * what the marks beside a headword mean (#113) — from the word list's lexicon.json (the same mark means different things
 * in different books), only the marks that occur in this day's entries
 */
function Legend({ entries, marks }: { entries: LexiconEntryT[]; marks: LexiconT['marks'] }) {
  const used = new Set(entries.flatMap((e) => [...marksOf(e)]));
  const shown = marks.filter((m) => used.has(m.key));
  if (!shown.length) return null;
  return (
    <p className="vocab-legend">
      {shown.map((m) => (
        <span key={m.key} className="vocab-legend-item">
          <span className={m.key === 'star' || m.key === 'supplement' ? 'entry-star' : 'entry-tag'}>{m.symbol}</span>
          {m.description}
        </span>
      ))}
    </p>
  );
}

export function EntryCard({
  entry: e,
  marks = [],
  known,
  as: Tag = 'li',
}: {
  entry: LexiconEntryT;
  marks?: LexiconT['marks'];
  /** Study (#133): the Scan mark — 认识 folds the entry, 不认识 opens it; undefined (the entry popover) = always open */
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
            <span className="entry-star" title={mark('supplement')?.description} aria-label={mark('supplement')?.description}>
              {mark('supplement')?.symbol ?? '▲'}
            </span>
          )}
          {e.star && (
            <span className="entry-star" title={mark('star')?.description} aria-label={mark('star')?.description ?? t('vocab.entry.star')}>
              *
            </span>
          )}
          {e.headword}
          {known !== undefined && <span className="sr-only"> ({known ? t('vocab.scan.know') : t('vocab.scan.dontKnow')})</span>}
        </h3>
        {(e.audio?.word || canSpeak()) && (
          <button type="button" className="entry-play" onClick={() => say(e.headword, e.audio?.word)} aria-label={t('vocab.entry.play', { word: e.headword })}>
            <img src={playIcon} alt="" />
          </button>
        )}
        {e.ipa?.map((p) => (
          <span key={p} className="entry-ipa">
            /{p}/
          </span>
        ))}
        {e.levelMark && (
          <span className="entry-tag" title={mark('levelMark')?.description}>
            {mark('levelMark')?.symbol ?? t('vocab.entry.level')}
          </span>
        )}
        {e.textbook?.map((x) => (
          <span key={x} className="entry-tag">
            {x}
          </span>
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
                <li key={i}>
                  <p className="entry-en">
                    <Rich nodes={x.en} />
                    {(e.audio?.examples?.[i] || canSpeak()) && (
                      <button
                        type="button"
                        className="entry-play is-small"
                        onClick={() => say(plainText(x.en), e.audio?.examples?.[i])}
                        aria-label={t('vocab.entry.playExample', { n: i + 1 })}
                      >
                        <img src={playIcon} alt="" />
                      </button>
                    )}
                  </p>
                  <p className="entry-zh">{x.zh}</p>
                </li>
              ))}
            </ul>
          )}
          {e.tip && (
            // 名师点拨: folded by default (#134)
            <div className={`entry-tip ${tipOpen ? 'is-open' : ''}`}>
              <button type="button" className="entry-tip-toggle" aria-expanded={tipOpen} onClick={() => setTipOpen(!tipOpen)}>
                {t('vocab.entry.tip')}
                <ChevronDown />
              </button>
              {tipOpen && e.tip.map((b, i) => <Block key={i} block={b} renderBlank={() => null} />)}
            </div>
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
                  // 辨析 (高考): similar words compared, with examples
                  <div key={i} className="entry-compare">
                    <b>
                      {t('vocab.entry.compare')} <span lang="en">{c.words}</span>
                    </b>
                    {c.blocks.map((b, j) => (
                      <Block key={j} block={b} renderBlank={() => null} />
                    ))}
                  </div>
                ))}
            </>
          )}
        </div>
      )}
    </Tag>
  );
}
