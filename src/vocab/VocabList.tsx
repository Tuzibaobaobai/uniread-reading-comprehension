import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LexiconEntryT } from '@schema';
import { Rich, plainText } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import { speakWithDevice } from '@/reader/Speaking';
import { Block } from '@/reader/ArticlePane';
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
 * 词汇天天练 Vocabulary tab (#110): the day's handbook entries as printed — headword, IPA, marks, senses, examples,
 * 常用词组 / 词形拓展 / 近反义 / 谚语 (folded) and 名师点拨. 「遮住释义」 hides the meanings for a 认识 / 不认识 self-check
 * (not scored; kept with the attempt).
 */
export function VocabList({
  entries,
  known,
  onKnown,
}: {
  entries: LexiconEntryT[];
  known: Record<string, boolean>;
  onKnown: (id: string, v: boolean | null) => void;
}) {
  const { t } = useTranslation();
  const [cover, setCover] = useState(false);
  const knownCount = entries.filter((e) => known[e.id] === true).length;
  const unknownCount = entries.filter((e) => known[e.id] === false).length;
  return (
    <div className="vocab-list">
      <div className="vocab-toolbar">
        <span className="vocab-count">{t('vocab.list.count', { count: entries.length })}</span>
        {cover && (
          <span className="vocab-tally" role="status">
            {t('vocab.list.tally', { known: knownCount, unknown: unknownCount })}
          </span>
        )}
        <button type="button" role="switch" aria-checked={cover} className={`switch-row ${cover ? 'is-on' : ''}`} onClick={() => setCover(!cover)}>
          {t('vocab.list.cover')}
          <span className="switch" aria-hidden>
            <span />
          </span>
        </button>
      </div>
      <ol className="vocab-entries">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} cover={cover} known={known[e.id]} onKnown={(v) => onKnown(e.id, v)} />
        ))}
      </ol>
    </div>
  );
}

export function EntryCard({
  entry: e,
  cover = false,
  known,
  onKnown,
  as: Tag = 'li',
}: {
  entry: LexiconEntryT;
  cover?: boolean;
  known?: boolean;
  onKnown?: (v: boolean | null) => void;
  as?: 'li' | 'div';
}) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  const [more, setMore] = useState(false);
  const hidden = cover && !shown;
  const extras = [
    e.phrases?.length && { label: t('vocab.entry.phrases'), rows: e.phrases.map((p) => [p.en, p.zh]) },
    e.wordFamily?.length && { label: t('vocab.entry.family'), rows: e.wordFamily.map((w) => [`${w.word}${w.pos ? ` ${w.pos}` : ''}`, w.zh]) },
    e.synonyms?.length && { label: t('vocab.entry.synonyms'), rows: [[e.synonyms.join(', '), '']] },
    e.antonyms?.length && { label: t('vocab.entry.antonyms'), rows: [[e.antonyms.join(', '), '']] },
    e.proverbs?.length && { label: t('vocab.entry.proverbs'), rows: e.proverbs.map((p) => [p.en, p.zh]) },
  ].filter((x): x is { label: string; rows: string[][] } => !!x);
  return (
    <Tag className={`entry ${known === true ? 'is-known' : known === false ? 'is-unknown' : ''}`} id={`entry-${e.id}`} data-entry={e.id}>
      <div className="entry-head">
        <span className="entry-num">{e.number}</span>
        <h3 className="entry-word">
          {e.star && <span className="entry-star" aria-label={t('vocab.entry.star')}>*</span>}
          {e.headword}
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
        {e.levelMark && <span className="entry-tag">{t('vocab.entry.level')}</span>}
        {e.textbook?.map((x) => (
          <span key={x} className="entry-tag">
            {x}
          </span>
        ))}
      </div>
      {hidden ? (
        <div className="entry-cover">
          <button type="button" className="entry-reveal" onClick={() => setShown(true)}>
            {t('vocab.list.reveal')}
          </button>
          <div className="entry-check">
            <button type="button" className={`chip ${known === true ? 'is-correct' : ''}`} aria-pressed={known === true} onClick={() => onKnown?.(known === true ? null : true)}>
              {t('vocab.list.known')}
            </button>
            <button type="button" className={`chip ${known === false ? 'is-wrong' : ''}`} aria-pressed={known === false} onClick={() => onKnown?.(known === false ? null : false)}>
              {t('vocab.list.unknown')}
            </button>
          </div>
        </div>
      ) : (
        <>
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
            <div className="entry-tip">
              <b>{t('vocab.entry.tip')}</b>
              {e.tip.map((b, i) => (
                <Block key={i} block={b} renderBlank={() => null} />
              ))}
            </div>
          )}
          {extras.length > 0 && (
            <>
              <button type="button" className="entry-more" aria-expanded={more} onClick={() => setMore(!more)}>
                {more ? t('vocab.entry.less') : t('vocab.entry.more', { list: extras.map((x) => x.label).join(' · ') })}
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
            </>
          )}
          {cover && shown && (
            <div className="entry-check">
              <button type="button" className={`chip ${known === true ? 'is-correct' : ''}`} aria-pressed={known === true} onClick={() => onKnown?.(known === true ? null : true)}>
                {t('vocab.list.known')}
              </button>
              <button type="button" className={`chip ${known === false ? 'is-wrong' : ''}`} aria-pressed={known === false} onClick={() => onKnown?.(known === false ? null : false)}>
                {t('vocab.list.unknown')}
              </button>
            </div>
          )}
        </>
      )}
    </Tag>
  );
}
