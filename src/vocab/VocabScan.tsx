import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LexiconEntryT } from '@schema';
import { ArrowButton } from '@/ui/ArrowButton/ArrowButton';
import { QuizButton } from '@/ui/QuizButton/QuizButton';
import { MarkButton } from '@/ui/vocab/MarkButton/MarkButton';
import { ScanCard } from '@/ui/vocab/ScanCard/ScanCard';
import { ScanSummary } from '@/ui/vocab/ScanSummary/ScanSummary';
import { say } from '@/lib/say';

/**
 * 词汇天天练 step 1 · Scan (#133): one word a page — headword and IPA only — marked 认识 / 不认识, then on to the next.
 * The marks (attempt.known) decide how Study shows each entry; they can be changed here at any time.
 * Moving to another word (prev / next, or a mark that moves on) plays its audio once (#142); the first card shown on
 * opening the tab stays silent until tapped.
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
  const shown = useRef(index);
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    if (e) say(e.headword, e.audio?.word);
  }, [index, e]);
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
        <ScanSummary
          title={unmarked ? t('vocab.scan.partTitle', { count: unmarked }) : t('vocab.scan.doneTitle', { count: total })}
          tally={t('vocab.list.tally', { known: knownCount, unknown: total - knownCount })}
          actions={
            <>
              <QuizButton onClick={() => setIndex(Math.max(0, entries.findIndex((x) => known[x.id] === undefined)))}>
                {unmarked ? t('vocab.scan.resume') : t('vocab.scan.restart')}
              </QuizButton>
              <QuizButton variant="primary" onClick={onStudy}>
                {t('vocab.scan.study')}
              </QuizButton>
            </>
          }
        />
      </div>
    );
  }

  const v = known[e.id];
  return (
    <div className="vocab-scan">
      <ScanCard
        word={e.headword}
        ipa={e.ipa ?? []}
        marked={v === true ? 'known' : v === false ? 'unknown' : 'none'}
        playLabel={t('vocab.entry.play', { word: e.headword })}
        onPlay={() => say(e.headword, e.audio?.word)}
        count={`${index + 1}/${total}`}
        countLabel={t('vocab.scan.position', { n: index + 1, total })}
        label={t('vocab.scan.pager')}
        prev={<ArrowButton direction="prev" disabled={index === 0} onClick={() => setIndex(index - 1)} label={t('vocab.scan.prev')} />}
        next={<ArrowButton direction="next" onClick={() => setIndex(index + 1)} label={t('vocab.scan.next')} />}
        actions={
          <>
            <MarkButton mark="know" selected={v === true} onClick={() => mark(true)}>
              {t('vocab.scan.know')}
            </MarkButton>
            <MarkButton mark="unknown" selected={v === false} onClick={() => mark(false)}>
              {t('vocab.scan.dontKnow')}
            </MarkButton>
          </>
        }
      />
    </div>
  );
}
