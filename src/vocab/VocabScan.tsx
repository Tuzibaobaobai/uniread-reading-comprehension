import { useTranslation } from 'react-i18next';
import type { LexiconEntryT } from '@schema';
import { Check, ChevronLeft, ChevronRight, Cross } from '@/components/Icons';

/**
 * 词汇天天练 step 1 · Scan (#133): one word a page — headword and IPA only — marked 认识 / 不认识, then on to the next.
 * The marks (attempt.known) decide how Study shows each entry; they can be changed here at any time.
 */
export function VocabScan({
  entries,
  known,
  index,
  setIndex,
  onKnown,
  onStudy,
}: {
  entries: LexiconEntryT[];
  known: Record<string, boolean>;
  /** the word shown; `entries.length` = the summary after the last word */
  index: number;
  setIndex: (i: number) => void;
  onKnown: (id: string, v: boolean) => void;
  onStudy: () => void;
}) {
  const { t } = useTranslation();
  const total = entries.length;
  const e = entries[index];
  const mark = (v: boolean) => {
    if (!e) return;
    onKnown(e.id, v);
    setIndex(index + 1);
  };

  if (!e) {
    const knownCount = entries.filter((x) => known[x.id] === true).length;
    const unmarked = entries.filter((x) => known[x.id] === undefined).length;
    return (
      <div className="vocab-scan">
        <div className="scan-stage scan-done">
          <h2 className="scan-done-title">{unmarked ? t('vocab.scan.partTitle', { count: unmarked }) : t('vocab.scan.doneTitle', { count: total })}</h2>
          <p className="scan-done-tally">{t('vocab.list.tally', { known: knownCount, unknown: total - knownCount })}</p>
          <div className="scan-done-actions">
            <button type="button" className="pill-button" onClick={() => setIndex(Math.max(0, entries.findIndex((x) => known[x.id] === undefined)))}>
              {unmarked ? t('vocab.scan.resume') : t('vocab.scan.restart')}
            </button>
            <button type="button" className="pill-button primary" onClick={onStudy}>
              {t('vocab.scan.study')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const v = known[e.id];
  return (
    <div className="vocab-scan">
      <div className="scan-stage" aria-live="polite">
        <h2 className="scan-word" lang="en">
          {e.headword}
        </h2>
        {!!e.ipa?.length && (
          <p className="scan-ipa">
            {e.ipa.map((p) => (
              <span key={p}>/{p}/</span>
            ))}
          </p>
        )}
      </div>
      <div className="scan-actions">
        <button type="button" className={`scan-btn is-know ${v === true ? 'is-on' : ''}`} aria-pressed={v === true} onClick={() => mark(true)}>
          <Check /> {t('vocab.scan.know')}
        </button>
        <button type="button" className={`scan-btn is-unknown ${v === false ? 'is-on' : ''}`} aria-pressed={v === false} onClick={() => mark(false)}>
          <Cross /> {t('vocab.scan.dontKnow')}
        </button>
      </div>
      <nav className="scan-pager" aria-label={t('vocab.scan.pager')}>
        <button type="button" className="scan-nav" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label={t('vocab.scan.prev')}>
          <ChevronLeft />
        </button>
        <span className="scan-count" aria-label={t('vocab.scan.position', { n: index + 1, total })}>
          {index + 1}/{total}
        </span>
        <button type="button" className="scan-nav" onClick={() => setIndex(index + 1)} aria-label={t('vocab.scan.next')}>
          <ChevronRight />
        </button>
      </nav>
    </div>
  );
}
