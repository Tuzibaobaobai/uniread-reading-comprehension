/**
 * Validate every playlist / item / key in content/ against the schema plus
 * cross-reference rules the schema alone cannot express.
 *   npm run validate              # all items
 *   npm run validate -- ci-g3-w01-mon ci-g7-w01-fri
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Item, ItemKey, Playlist, type InlineT, type ItemT, type ItemKeyT } from '../schema/index.ts';
import { allQuestions, questionBlankIds } from '../src/lib/grading.ts';

const ROOT = join(import.meta.dirname, '..', 'content');
const only = new Set(process.argv.slice(2));
const errors: string[] = [];
const warnings: string[] = [];
let checked = 0;

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

function walkInline(item: ItemT, fn: (n: InlineT, where: string) => void) {
  const visit = (rich: InlineT[] | undefined, where: string) => rich?.forEach((n) => fn(n, where));
  const visitBlocks = (blocks: ItemT['article']['blocks'], where: string) =>
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
    s.bank?.forEach((e) => visit(e.content, `${s.id}/bank`));
    s.questions.forEach((q) => {
      const it = q.interaction;
      if ('prompt' in it) visit(it.prompt, q.id);
      if ('options' in it) it.options.forEach((o) => visit(o.content, q.id));
      if (it.kind === 'extendedText') visit(it.scaffold, q.id);
    });
  });
}

function checkItem(item: ItemT, key: ItemKeyT, playlistDir: string) {
  const id = item.id;
  const err = (m: string) => errors.push(`${id}: ${m}`);
  const warn = (m: string) => warnings.push(`${id}: ${m}`);

  // ids unique
  const blockIds = new Set<string>();
  const allBlocks = [...item.article.blocks, ...item.sections.flatMap((s) => s.stimulus ?? [])];
  allBlocks.forEach((b) => (blockIds.has(b.id) ? err(`duplicate block id ${b.id}`) : blockIds.add(b.id)));

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
        case 'extendedText': {
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
  item.article.blocks.forEach((b) => b.type === 'imageRef' && !imageIds.has(b.image) && err(`imageRef ${b.image} unknown`));
  if (item.thumbnail && !existsSync(join(ROOT, item.thumbnail))) err(`thumbnail missing: ${item.thumbnail}`);

  // naming
  const dayName = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' }[item.day];
  const expected = `Week ${item.week} ${dayName} ${item.title}`;
  if (item.displayName !== expected) err(`displayName should be "${expected}"`);
  const expectedId = `${item.playlistId}-w${String(item.week).padStart(2, '0')}-${item.day}`;
  if (item.id !== expectedId) err(`id should be ${expectedId}`);
  if (!existsSync(join(playlistDir, 'keys', `${id}.json`))) err('key file missing');
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
    const iRes = Item.safeParse(readJson(join(dir, 'items', f)));
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
