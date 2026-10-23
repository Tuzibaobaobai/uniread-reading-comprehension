/**
 * Validate every playlist / item / key in content/ against the schema plus
 * cross-reference rules the schema alone cannot express.
 *   npm run validate              # all items
 *   npm run validate -- ci-g3-w01-mon ci-g7-w01-fri
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ArticleItem, ExamItem, ItemKey, LexiconEntry, Playlist, VocabDayItem, isExam, type BlockT, type InlineT, type ItemT, type ItemKeyT, type LexiconEntryT, type VocabDayItemT } from '../schema/index.ts';
import { allBlocks, allQuestions, questionBlankIds } from '../src/lib/grading.ts';

const ROOT = join(import.meta.dirname, '..', 'content');
const only = new Set(process.argv.slice(2));
const errors: string[] = [];
const warnings: string[] = [];
let checked = 0;

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

function walkInline(item: ItemT, fn: (n: InlineT, where: string) => void) {
  const visit = (rich: InlineT[] | undefined, where: string) => rich?.forEach((n) => fn(n, where));
  const visitBlocks = (blocks: BlockT[], where: string) =>
    blocks.forEach((b) => {
      const w = `${where}/${b.id}`;
      switch (b.type) {
        case 'paragraph':
        case 'heading':
          return visit(b.content, w);
        case 'list':
          return b.items.forEach((i) => visit(i, w));
        case 'dialogue':
          return b.turns.forEach((t) => visit(t.content, w));
        case 'note':
          visit(b.title, w);
          visit(b.heading, w);
          b.header?.forEach((c) => visit(c, w));
          b.content.forEach((c) => visit(c, w));
          return b.signature?.forEach((c) => visit(c, w));
        case 'table':
          visit(b.caption, w);
          return b.rows.forEach((r) => r.forEach((c) => visit(c.content, w)));
      }
    });
  visitBlocks(item.article.blocks, 'article');
  item.sections.forEach((s) => {
    if (s.stimulus) visitBlocks(s.stimulus, s.id);
    if (s.material) visitBlocks(s.material, `${s.id}/material`);
    s.questions.forEach((q) => q.material && visitBlocks(q.material, `${q.id}/material`));
    s.bank?.forEach((e) => visit(e.content, `${s.id}/bank`));
    visit(s.intro, `${s.id}/intro`);
    s.questions.forEach((q) => {
      const it = q.interaction;
      if ('prompt' in it) visit(it.prompt, q.id);
      if ('options' in it) it.options.forEach((o) => visit(o.content, q.id));
      if (it.kind === 'extendedText') {
        visit(it.scaffold, q.id);
        visit(it.task, q.id);
        if (it.stimulus) visitBlocks(it.stimulus, `${q.id}/stimulus`);
      }
    });
  });
}

function checkItem(item: ItemT, key: ItemKeyT, playlistDir: string) {
  const id = item.id;
  const err = (m: string) => errors.push(`${id}: ${m}`);
  const warn = (m: string) => warnings.push(`${id}: ${m}`);

  // ids unique
  const blockIds = new Set<string>();
  const blocks = allBlocks(item);
  blocks.forEach((b) => (blockIds.has(b.id) ? err(`duplicate block id ${b.id}`) : blockIds.add(b.id)));

  // blanks: unique, and each referenced by exactly one question
  const blanks = new Map<string, string>();
  const vocabRefs = new Set<string>();
  walkInline(item, (n, where) => {
    if (n.t === 'blank') {
      if (blanks.has(n.id)) err(`blank ${n.id} appears twice (${blanks.get(n.id)}, ${where})`);
      blanks.set(n.id, where);
    }
    if (n.t === 'vocab' && n.ref) vocabRefs.add(n.ref);
    if (n.t === 'underline' && n.vocab) vocabRefs.add(n.vocab);
  });
  const blankOwners = new Map<string, string>();
  const own = (blankId: string, qid: string) => {
    if (!blanks.has(blankId)) err(`${qid} references missing blank ${blankId}`);
    if (blankOwners.has(blankId)) err(`blank ${blankId} owned by ${blankOwners.get(blankId)} and ${qid}`);
    blankOwners.set(blankId, qid);
  };

  // display numbers are continuous from 1; question ids are stable identities (docs/14 §3.2):
  // unique across the item's sections, `q<digits>`, and NOT tied to the display number — a question
  // inserted later gets a new never-used id (see scripts/id-changes.ts), reordering keeps ids
  const qs = allQuestions(item);
  const seenIds = new Set<string>();
  qs.forEach((q, i) => {
    if (q.number !== i + 1) err(`question ${q.id} has number ${q.number}, expected ${i + 1}`);
    if (seenIds.has(q.id)) err(`question id ${q.id} used twice in the item`);
    seenIds.add(q.id);
  });

  for (const s of item.sections) {
    const hasGap = s.questions.some((q) => q.interaction.kind === 'gapMatch');
    if (hasGap && !s.bank?.length) err(`${s.id} has gapMatch questions but no bank`);
    if (s.bank) {
      const ids = s.bank.map((b) => b.id);
      if (new Set(ids).size !== ids.length) err(`${s.id} bank has duplicate ids`);
    }
    for (const q of s.questions) {
      const it = q.interaction;
      const k = key.answers[q.id];
      if (!k) {
        err(`${q.id} has no answer key`);
        continue;
      }
      switch (it.kind) {
        case 'choice':
        case 'inlineChoice':
        case 'gapMatch': {
          questionBlankIds(q).forEach((b) => own(b, q.id));
          if (!('correct' in k)) {
            err(`${q.id} key must have "correct"`);
            break;
          }
          if (it.kind === 'gapMatch' && k.correct.length !== questionBlankIds(q).length)
            err(`${q.id} gapMatch key has ${k.correct.length} answers for ${questionBlankIds(q).length} blanks`);
          if (it.kind === 'gapMatch' && !questionBlankIds(q).length) err(`${q.id} gapMatch has no blanks`);
          const valid = it.kind === 'gapMatch' ? (s.bank ?? []).map((b) => b.id) : it.options.map((o) => o.id);
          k.correct.forEach((c) => valid.includes(c) || err(`${q.id} correct "${c}" not among options ${valid}`));
          if (it.kind === 'choice' && it.variant === 'trueFalse') {
            const ids = it.options.map((o) => o.id).join('');
            if (ids !== 'TF') err(`${q.id} trueFalse options must be T,F`);
          }
          break;
        }
        case 'textEntry': {
          const ids = questionBlankIds(q);
          if (!ids.length) err(`${q.id} textEntry has no blanks`);
          ids.forEach((b) => own(b, q.id));
          if (!('slots' in k)) {
            err(`${q.id} key must have "slots"`);
            break;
          }
          ids.forEach((b) => k.slots[b] || err(`${q.id} key missing slot ${b}`));
          Object.keys(k.slots).forEach((b) => ids.includes(b) || err(`${q.id} key has extra slot ${b}`));
          break;
        }
        case 'match': {
          if (!('pairs' in k)) {
            err(`${q.id} key must have "pairs"`);
            break;
          }
          const rights = it.right.map((r) => r.id);
          it.left.forEach((l) => {
            const r = k.pairs[l.id];
            if (!r) err(`${q.id} key missing pair for ${l.id}`);
            else if (!rights.includes(r)) err(`${q.id} pair ${l.id}→${r} not a right item`);
          });
          break;
        }
        case 'extendedText':
        case 'speaking': {
          if (!('sampleAnswer' in k)) {
            err(`${q.id} key must have "sampleAnswer"`);
            break;
          }
          // LLM judge (docs/09): key points define full marks
          const pts = q.points ?? 1;
          if (it.scoring === 'judge') {
            if (!k.keyPoints?.length) err(`${q.id} scoring "judge" needs keyPoints`);
            else if ((k.match ?? 'all') === 'all') {
              const sum = k.keyPoints.reduce((s, p) => s + p.weight, 0);
              if (sum !== pts) err(`${q.id} keyPoints weights sum to ${sum}, question points = ${pts}`);
            } else if (k.keyPoints.some((p) => p.weight > pts)) err(`${q.id} keyPoint weight exceeds points`);
            k.anchors?.forEach((a, i) => a.score > pts && err(`${q.id} anchor ${i + 1} score > points`));
            if (k.rubricType?.startsWith('cambridge_') && k.keyPoints?.some((p) => p.weight !== 5))
              err(`${q.id} Cambridge criteria are 0–5 bands: every keyPoint weight must be 5`);
          } else if (it.scoring === 'self' || it.scoring === 'none') {
            warn(`${q.id} is "${it.scoring}" — consider scoring "judge" with keyPoints`);
          }
          break;
        }
        case 'order': {
          const seqs = 'sequence' in k ? [k.sequence] : 'sequences' in k ? k.sequences : null;
          if (!seqs) {
            err(`${q.id} key must have "sequence" or "sequences"`);
            break;
          }
          const ids = it.items.map((i) => i.id).sort().join(',');
          seqs.forEach((seq, n) => {
            if ([...seq].sort().join(',') !== ids) err(`${q.id} sequence ${n + 1} must use every item exactly once`);
          });
          break;
        }
      }
      if (!('sampleAnswer' in k) && !k.explanationZh) warn(`${q.id} has no explanationZh`);
    }
    // gapMatch: each bank entry used at most once
    if (hasGap) {
      const used = s.questions
        .filter((q) => q.interaction.kind === 'gapMatch')
        .flatMap((q) => {
          const k = key.answers[q.id];
          return k && 'correct' in k ? k.correct : [];
        });
      const dup = used.filter((u, i) => used.indexOf(u) !== i);
      if (dup.length) err(`${s.id} bank entries used twice in key: ${dup}`);
    }
  }
  for (const [b] of blanks) if (!blankOwners.has(b)) err(`blank ${b} is not answered by any question`);

  for (const qid of Object.keys(key.answers)) if (!qs.find((q) => q.id === qid)) err(`key has unknown question ${qid}`);

  // vocabulary
  const vocabIds = new Set(item.article.vocabulary.map((v) => v.id));
  vocabRefs.forEach((r) => vocabIds.has(r) || err(`vocab ref ${r} not in vocabulary`));
  item.article.vocabulary.forEach((v) => vocabRefs.has(v.id) || warn(`vocabulary ${v.id} never highlighted in text`));

  // images exist
  const imageIds = new Set(item.article.images.map((i) => i.id));
  item.article.images.forEach((img) => {
    if (!existsSync(join(ROOT, img.src))) err(`image file missing: ${img.src}`);
  });
  blocks.forEach((b) => b.type === 'imageRef' && !imageIds.has(b.image) && err(`imageRef ${b.image} unknown`));
  blocks.forEach((b) => b.type === 'paragraph' && b.image && !imageIds.has(b.image) && err(`${b.id} image ${b.image} unknown`));
  allQuestions(item).forEach((q) => q.image && !imageIds.has(q.image) && err(`${q.id} image ${q.image} unknown`));
  allQuestions(item).forEach((q) => {
    const it = q.interaction;
    const imgs = [...('options' in it ? it.options.map((o) => o.image) : []), ...(it.kind === 'match' ? it.right.map((r) => r.image) : [])];
    imgs.forEach((src) => src && !existsSync(join(ROOT, src)) && err(`${q.id} option image missing: ${src}`));
  });
  item.sections.forEach((s) => s.audio && !existsSync(join(ROOT, s.audio.src)) && err(`${s.id} audio missing: ${s.audio.src}`));
  allQuestions(item).forEach((q) => {
    const it = q.interaction;
    if (it.kind === 'speaking') it.turns.forEach((t) => t.audio && !existsSync(join(ROOT, t.audio.src)) && err(`${q.id} ${t.id} examiner audio missing: ${t.audio.src} — run scripts/tts.mjs`));
  });
  if (isExam(item)) {
    item.sections.forEach((s) => s.part === undefined && err(`${s.id} needs "part"`));
    if (key.transcripts) Object.keys(key.transcripts).forEach((sid) => item.sections.some((s) => s.id === sid) || err(`transcript for unknown section ${sid}`));
    // a recording that is still missing (filed as an issue and recorded in errata) is a warning, not an error
    const audioPending = (item.errata ?? []).some((e) => /缺少听力/.test(e.original));
    if (item.paper === 'listening')
      item.sections.forEach((s) => s.audio || (audioPending ? warn(`${s.id} listening part has no audio yet (errata)`) : err(`${s.id} listening part has no audio`)));
    // a section answered "choose N of M" (PET Writing Part 2) counts N questions
    const marks = item.sections.reduce((n, s) => {
      const pts = s.questions.map((q) => q.points ?? 1);
      if (!s.choose) return n + pts.reduce((a, b) => a + b, 0);
      if (s.choose >= s.questions.length) err(`${s.id} choose ${s.choose} needs more than ${s.choose} questions`);
      if (new Set(pts).size > 1) err(`${s.id}: questions to choose from must have the same points`);
      return n + s.choose * pts[0];
    }, 0);
    if (marks !== item.meta.totalMarks) err(`question points sum to ${marks}, meta.totalMarks = ${item.meta.totalMarks}`);
  }
  if (item.thumbnail && !existsSync(join(ROOT, item.thumbnail))) err(`thumbnail missing: ${item.thumbnail}`);

  // naming
  if (!existsSync(join(playlistDir, 'keys', `${id}.json`))) err('key file missing');
  if (isExam(item)) {
    const suffix = { reading_writing: 'rw', reading: 'r', writing: 'w', listening: 'l', speaking: 's' }[item.paper];
    const expectedId = `${item.playlistId}-t${item.test}-${suffix}`;
    if (item.id !== expectedId) err(`id should be ${expectedId}`);
    return;
  }
  const dayName = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' }[item.day];
  const expected = `Week ${item.week} ${dayName} ${item.title}`;
  if (item.displayName !== expected) err(`displayName should be "${expected}"`);
  const expectedId = `${item.playlistId}-w${String(item.week).padStart(2, '0')}-${item.day}`;
  if (item.id !== expectedId) err(`id should be ${expectedId}`);
}

/* ------------------------------------------- 词汇天天练 (#110): lexicons + vocab-day items */

const lexicons = new Map<string, Map<string, LexiconEntryT>>();
function lexicon(name: string): Map<string, LexiconEntryT> {
  if (lexicons.has(name)) return lexicons.get(name)!;
  const out = new Map<string, LexiconEntryT>();
  const dir = join(ROOT, 'lexicons', name, 'entries');
  for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith('.json')) : []) {
    const res = LexiconEntry.safeParse(readJson(join(dir, f)));
    const where = `lexicons/${name}/entries/${f}`;
    if (!res.success) {
      errors.push(`${where}: ${res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    const e = res.data;
    if (`${e.id}.json` !== f) errors.push(`${where}: id ${e.id} ≠ file name`);
    if (e.lexicon !== name) errors.push(`${where}: lexicon ${e.lexicon} ≠ folder ${name}`);
    const underlined = (r: InlineT[]) => r.some((n) => n.t === 'underline');
    if (e.examples.length && !e.examples.some((x) => underlined(x.en))) warnings.push(`${where}: no example underlines the headword`);
    if (e.kind === 'word' && !e.ipa?.length) warnings.push(`${where}: word without IPA`);
    out.set(e.id, e);
  }
  const numbers = [...out.values()].map((e) => `${e.kind}:${e.number}`);
  numbers.filter((n, i) => numbers.indexOf(n) !== i).forEach((n) => errors.push(`lexicons/${name}: duplicate entry number ${n}`));
  lexicons.set(name, out);
  return out;
}

function checkVocabDay(item: VocabDayItemT, key: ItemKeyT) {
  const id = item.id;
  const err = (m: string) => errors.push(`${id}: ${m}`);
  const warn = (m: string) => warnings.push(`${id}: ${m}`);
  if (id !== `${item.playlistId}-d${String(item.day).padStart(2, '0')}`) err(`id should be ${item.playlistId}-d${String(item.day).padStart(2, '0')}`);
  const lx = lexicon(item.lexicon);
  if (!lx.size) err(`lexicon ${item.lexicon} has no entries`);
  item.entryIds.forEach((e) => lx.has(e) || err(`entry ${e} not in lexicon ${item.lexicon}`));
  if (item.entryIds[0] !== item.wordRange.from) err(`wordRange.from ${item.wordRange.from} ≠ first entry ${item.entryIds[0]}`);
  if (item.entryIds.at(-1) !== item.wordRange.to) err(`wordRange.to ${item.wordRange.to} ≠ last entry ${item.entryIds.at(-1)}`);
  const entries = item.entryIds.map((e) => lx.get(e)).filter((e): e is LexiconEntryT => !!e);
  const kind = item.unit === 'words' ? 'word' : 'phrase';
  entries.forEach((e) => e.kind !== kind && err(`entry ${e.id} is a ${e.kind}, day unit is ${item.unit}`));
  for (let i = 1; i < entries.length; i++) if (entries[i].number !== entries[i - 1].number + 1) warn(`entries ${entries[i - 1].id} → ${entries[i].id} skip handbook numbers`);

  const qs = item.sections.flatMap((x) => x.questions);
  const qids = new Set<string>();
  qs.forEach((q, i) => {
    if (qids.has(q.id)) err(`duplicate question id ${q.id}`);
    qids.add(q.id);
    if (q.number !== i + 1) err(`${q.id} number ${q.number} should be ${i + 1}`);
    if (q.entryRef && !lx.has(q.entryRef)) err(`${q.id} entryRef ${q.entryRef} not in lexicon`);
    const k = key.answers[q.id];
    if (!k) return err(`${q.id} has no key`);
    const it = q.interaction;
    if (it.kind === 'wordProfile' && !('word' in k && 'pos' in k)) err(`${q.id}: wordProfile needs a word/pos/zh key`);
    if (it.kind === 'wordProfile' && 'pos' in k) k.pos.forEach((p) => it.posOptions.includes(p) || err(`${q.id}: key pos ${p} not in posOptions`));
    if (it.kind === 'wordFamily') {
      if (!('forms' in k)) err(`${q.id}: wordFamily needs a forms key`);
      else it.slots.forEach((sl) => k.forms[sl.id] || err(`${q.id}: no key for slot ${sl.id}`));
    }
    if (it.kind === 'textEntry') {
      const blanks = questionBlankIds(q);
      if (!blanks.length) err(`${q.id}: textEntry without blanks`);
      if (!('slots' in k)) err(`${q.id}: textEntry needs a slots key`);
      else blanks.forEach((b) => k.slots[b] || err(`${q.id}: no key for blank ${b}`));
    }
    if (it.kind === 'extendedText') {
      if (!('sampleAnswer' in k)) err(`${q.id}: translation needs a sampleAnswer key`);
      else if (k.rubricType !== 'translation' || !k.references?.length) err(`${q.id}: translation key needs rubricType "translation" and references`);
      if (!it.requiredWord) warn(`${q.id}: translation without requiredWord`);
    }
    if (!['wordProfile', 'wordFamily', 'textEntry', 'extendedText'].includes(it.kind)) err(`${q.id}: ${it.kind} is not a 词汇天天练 question type`);
  });
  Object.keys(key.answers).forEach((qid) => qids.has(qid) || err(`key has unknown question ${qid}`));
  const total = qs.reduce((t, q) => t + (q.points ?? 1), 0);
  if (Math.abs(total - item.meta.totalPoints) > 0.01) err(`question points add up to ${total}, meta.totalPoints is ${item.meta.totalPoints}`);
}

for (const pl of readdirSync(join(ROOT, 'playlists'))) {
  const dir = join(ROOT, 'playlists', pl);
  const pPath = join(dir, 'playlist.json');
  if (!existsSync(pPath)) continue;
  const pRes = Playlist.safeParse(readJson(pPath));
  if (!pRes.success) {
    errors.push(`${pl}/playlist.json: ${pRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    continue;
  }
  const itemFiles = existsSync(join(dir, 'items')) ? readdirSync(join(dir, 'items')).filter((f) => f.endsWith('.json')) : [];
  for (const f of itemFiles) {
    const id = f.replace(/\.json$/, '');
    if (only.size && !only.has(id)) continue;
    const raw = readJson(join(dir, 'items', f));
    if (raw?.format === 'vocab-day') {
      const vRes = VocabDayItem.safeParse(raw);
      const kPath = join(dir, 'keys', f);
      const kRes = existsSync(kPath) ? ItemKey.safeParse(readJson(kPath)) : null;
      if (!vRes.success) errors.push(`${id}: item schema: ${vRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      if (!kRes) errors.push(`${id}: key file missing`);
      else if (!kRes.success) errors.push(`${id}: key schema: ${kRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      if (vRes.success && kRes?.success) {
        if (vRes.data.playlistId !== pl) errors.push(`${id}: playlistId ${vRes.data.playlistId} ≠ folder ${pl}`);
        if (!pRes.data.itemIds.includes(id)) warnings.push(`${id}: not listed in ${pl}/playlist.json itemIds`);
        checkVocabDay(vRes.data, kRes.data);
      }
      checked++;
      continue;
    }
    // parse by format so schema errors name the right fields (a union only reports "invalid input")
    const iRes = (raw?.format === 'exam' ? ExamItem : ArticleItem).safeParse(raw);
    const kPath = join(dir, 'keys', f);
    const kRes = existsSync(kPath) ? ItemKey.safeParse(readJson(kPath)) : null;
    if (!iRes.success) errors.push(`${id}: item schema: ${iRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    if (!kRes) errors.push(`${id}: key file missing`);
    else if (!kRes.success) errors.push(`${id}: key schema: ${kRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    if (iRes.success && kRes?.success) {
      if (iRes.data.playlistId !== pl) errors.push(`${id}: playlistId ${iRes.data.playlistId} ≠ folder ${pl}`);
      if (!pRes.data.itemIds.includes(id)) warnings.push(`${id}: not listed in ${pl}/playlist.json itemIds`);
      checkItem(iRes.data, kRes.data, dir);
    }
    checked++;
  }
}

warnings.forEach((w) => console.warn(`warn  ${w}`));
errors.forEach((e) => console.error(`ERROR ${e}`));
console.log(`\n${checked} item(s) checked · ${errors.length} error(s) · ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
