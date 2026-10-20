/**
 * Build content/catalog.json from playlists + items and refresh each playlist's itemIds.
 *   npm run build:index
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Catalog, Item, Playlist, SCHEMA_VERSION, isExam, type CatalogT, type ExamItemT, type ItemT } from '../schema/index.ts';
import { allQuestions } from '../src/lib/grading.ts';
import { passageText } from '../src/lib/judge.ts';

const ROOT = join(import.meta.dirname, '..', 'content');
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
/** exam papers have no printed word count: count the words of every text the learner reads */
const examWords = (i: ExamItemT) => (passageText(i).match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length;

const catalog: CatalogT = { schemaVersion: SCHEMA_VERSION, generatedAt: new Date().toISOString(), playlists: [] };

for (const pl of readdirSync(join(ROOT, 'playlists')).sort()) {
  const pPath = join(ROOT, 'playlists', pl, 'playlist.json');
  if (!existsSync(pPath)) continue;
  const playlist = Playlist.parse(readJson(pPath));
  const itemDir = join(ROOT, 'playlists', pl, 'items');
  const items: ItemT[] = (existsSync(itemDir) ? readdirSync(itemDir) : [])
    .filter((f) => f.endsWith('.json'))
    .map((f) => Item.parse(readJson(join(itemDir, f))))
    .sort((a, b) => a.order - b.order);

  playlist.itemIds = items.map((i) => i.id);
  writeFileSync(pPath, JSON.stringify(playlist, null, 2) + '\n');

  const diffs = items.flatMap((i) => (isExam(i) ? [] : [i.meta.difficulty]));
  const exam = items.length > 0 && items.every(isExam);
  catalog.playlists.push({
    id: playlist.id,
    ...(exam ? { format: 'exam' as const, exam: (items[0] as ExamItemT).meta.exam } : {}),
    title: playlist.title,
    shortTitle: playlist.shortTitle,
    cover: playlist.cover,
    accent: playlist.accent,
    gradeBand: playlist.gradeBand,
    description: playlist.description,
    itemCount: items.length,
    totalWords: items.reduce((s, i) => s + (isExam(i) ? examWords(i) : i.meta.wordCount), 0),
    difficultyRange: diffs.length ? [Math.min(...diffs), Math.max(...diffs)] : [0, 0],
    taskTypes: [...new Set(items.map((i) => i.taskType.code))],
    items: items.map((i) =>
      isExam(i)
        ? {
            id: i.id,
            order: i.order,
            test: i.test,
            paper: i.paper,
            title: i.title,
            displayName: i.displayName,
            taskType: i.taskType,
            wordCount: examWords(i),
            suggestedMinutes: i.meta.durationMinutes,
            questionCount: allQuestions(i).length,
            thumbnail: i.thumbnail,
          }
        : {
            id: i.id,
            order: i.order,
            week: i.week,
            day: i.day,
            title: i.title,
            displayName: i.displayName,
            taskType: i.taskType,
            wordCount: i.meta.wordCount,
            difficulty: i.meta.difficulty,
            suggestedMinutes: i.meta.suggestedMinutes,
            questionCount: allQuestions(i).length,
            thumbnail: i.thumbnail,
          },
    ),
  });
}

// 时文阅读 playlists by grade (G3 … G9), then exam papers (KET, PET …) — not by folder name
catalog.playlists.sort(
  (a, b) =>
    Number(!!a.format) - Number(!!b.format) || a.gradeBand.localeCompare(b.gradeBand, 'en', { numeric: true }) || a.id.localeCompare(b.id),
);
writeFileSync(join(ROOT, 'catalog.json'), JSON.stringify(Catalog.parse(catalog), null, 2) + '\n');
console.log(catalog.playlists.map((p) => `${p.id}: ${p.itemCount} items`).join('\n'));
