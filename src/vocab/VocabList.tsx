import { useTranslation } from 'react-i18next';
import type { LexiconEntryT, LexiconT } from '@schema';
import { EntryCard } from '@/ui/vocab/EntryCard/EntryCard';
import { MarkTag } from '@/ui/vocab/MarkTag/MarkTag';
import { StudyLegend, StudyToolbar } from '@/ui/vocab/StudyToolbar/StudyToolbar';

/**
 * 词汇天天练 step 2 · Study (#110, #133): the day's handbook entries as printed (ui/vocab/EntryCard). The Scan marks
 * colour each headword: 认识 green and folded, 不认识 red and open; a word not marked in Scan counts as 不认识.
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
  // what the marks beside a headword mean (#113): only the marks that occur in this day's entries
  const used = new Set(entries.flatMap((e) => [...marksOf(e)]));
  const levelsUsed = new Set(entries.filter((e) => e.star).map((e) => e.starLevel ?? 1));
  const legend = marks
    .filter((m) => used.has(m.key))
    .flatMap((m) =>
      // graded stars (中考 * / ** / ***, #139): one legend item per level used today
      m.key === 'star' && m.levels?.length
        ? m.levels
            .map((l, i) => ({ level: i + 1, ...l }))
            .filter((l) => levelsUsed.has(l.level))
            .map((l) => ({ key: `star-${l.level}`, description: l.description, symbol: <MarkTag kind="star">{l.symbol}</MarkTag> }))
        : [
            {
              key: m.key,
              description: m.description,
              symbol: <MarkTag kind={m.key === 'star' ? 'star' : m.key === 'supplement' ? 'supplement' : m.key === 'textbook' ? 'textbook' : 'level'}>{m.symbol}</MarkTag>,
            },
          ],
    );
  return (
    <div className="vocab-list">
      <StudyToolbar
        count={t('vocab.list.count', { count: entries.length })}
        tally={`${t('vocab.list.tally', { known: knownCount, unknown: entries.length - knownCount })}${unmarked > 0 ? ` · ${t('vocab.list.unmarked', { count: unmarked })}` : ''}`}
        legend={<StudyLegend items={legend} />}
      />
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
