/**
 * Asset upload plan (GitHub #130, docs/uniread-spec/asset-oss.md §4–5): from a frozen rc-selection-2 file, list every
 * asset the selected content really references, fix the release identity, and give each uploadable file the exact
 * object key the UniRead BE derives today. Offline: no credentials, no network, no BE build needed.
 *
 *   npx tsx scripts/asset-plan.ts <contentReleaseId> docs/handoff/production-selection.<paperId>.json
 *   → docs/handoff/asset-plan.<contentReleaseId>.json      the plan (be-asset-upload-plan-1; no bucket, no credentials)
 *     docs/handoff/asset-snapshot.<contentReleaseId>.sha256 the public content files it is bound to (sha256  path)
 *
 * The first run generates the releaseId (UUIDv4); later runs with the same contentReleaseId keep it and must
 * reproduce the same plan — a changed file, selection or reference fails instead of silently rewriting a frozen
 * delivery (freeze a new contentReleaseId for new content). Exit code 2 = plan written but INCOMPLETE (errors listed).
 *
 * Uploaded: playlist cover and item thumbnails (exam-media/v1/<sha>.jpg|png); section recordings and speaking
 * prompts (exam-resources/v1/<releaseId>/<resourceFingerprint>/media/<sha><ext>). Kept local, no key: article /
 * question images (the BE inlines them in HTML). Capability gaps, listed with no key invented: banner, video, vocab
 * lexicon audio. Errors (status INCOMPLETE): missing / mislabelled files, item audio spanning several resources, unknown references.
 */
import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, normalize } from 'node:path';
import {
  AUDIO_TYPES,
  IMAGE_TYPES,
  KEY_POLICY_VERSION,
  extOf,
  imageObjectKey,
  isCanonicalUuid,
  mediaObjectKey,
  newReleaseId,
  resourceFingerprint,
  sha256,
  sniff,
} from './lib/asset-identity.ts';

export const PLAN_FORMAT = 'be-asset-upload-plan-1';
const CONTENT = 'content';
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Use = { playlistId: string; document: string; pointer: string; itemId?: string; sectionId?: string; questionId?: string; turnId?: string };
export type PlanFile = {
  sourcePath: string;
  roles: string[];
  sha256: string;
  sizeBytes: number;
  contentType: string;
  objectKey: string;
  usedBy: Use[];
  resourceId?: string;
  resourceFingerprint?: string;
  seconds?: number;
  originType?: 'recording' | 'tts';
  origin?: string;
};
type Selection = {
  format: string;
  sourceId: string;
  paperId: string;
  resources: { resourceId: string; playlistId: string; itemId: string; sectionIds: string[] }[];
};

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const ptr = (parts: (string | number)[]) => '/' + parts.map((p) => String(p).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');

export function buildPlan(contentReleaseId: string, selectionPath: string, opts: { releaseId?: string; frozenAt?: string; sourceCommit?: string } = {}) {
  if (!ID_RE.test(contentReleaseId)) throw new Error(`contentReleaseId "${contentReleaseId}" must be lowercase letters, digits and hyphens`);
  const selBytes = readFileSync(selectionPath);
  const sel = JSON.parse(selBytes.toString('utf8')) as Selection;
  if (sel.format !== 'rc-selection-2') throw new Error(`${selectionPath}: format ${sel.format}, expected rc-selection-2`);
  const releaseId = opts.releaseId ?? newReleaseId();
  if (!isCanonicalUuid(releaseId)) throw new Error(`releaseId ${releaseId} is not a canonical non-nil UUID`);

  /** block the delivery: missing / unreadable / mislabelled files, unknown references */
  const errors: string[] = [];
  /** known BE limits: listed, kept local, no key invented */
  const capabilityGaps: string[] = [];
  const localOnly: { sourcePath: string; sha256: string; sizeBytes: number; usedBy: Use[]; reason: string }[] = [];
  const files = new Map<string, PlanFile>(); // by objectKey
  const snapshot = new Map<string, string>(); // content-relative path → sha256
  const fileInfo = new Map<string, { sha: string; size: number; buf: Buffer }>();

  const doc = (rel: string) => {
    const buf = readFileSync(join(CONTENT, rel));
    snapshot.set(rel, sha256(buf));
    return JSON.parse(buf.toString('utf8'));
  };
  /** a referenced asset file: inside content/, no symlink, bytes match the extension */
  const asset = (src: string, use: Use) => {
    const rel = normalize(src);
    if (!/^assets\//.test(rel) || rel.includes('..') || rel !== src) {
      errors.push(`${use.document}${use.pointer}: "${src}" is not a plain assets/… path`);
      return null;
    }
    const abs = join(CONTENT, rel);
    if (!existsSync(abs)) {
      errors.push(`${use.document}${use.pointer}: ${src} is missing`);
      return null;
    }
    if (lstatSync(abs).isSymbolicLink()) {
      errors.push(`${use.document}${use.pointer}: ${src} is a symbolic link`);
      return null;
    }
    let info = fileInfo.get(rel);
    if (!info) {
      const buf = readFileSync(abs);
      info = { sha: sha256(buf), size: buf.length, buf };
      fileInfo.set(rel, info);
      snapshot.set(rel, info.sha);
    }
    if (!sniff(info.buf, extOf(rel))) {
      errors.push(`${src}: the bytes are not a ${extOf(rel) || 'known'} file`);
      return null;
    }
    return info;
  };
  const addFile = (key: string, f: Omit<PlanFile, 'objectKey' | 'usedBy' | 'roles'>, role: string, use: Use) => {
    const cur = files.get(key);
    if (cur) {
      if (!cur.roles.includes(role)) cur.roles.push(role);
      cur.usedBy.push(use);
    } else files.set(key, { ...f, roles: [role], objectKey: key, usedBy: [use] });
  };
  const image = (src: string, role: string, use: Use) => {
    const info = asset(src, use);
    if (!info) return;
    const ext = extOf(src);
    if (!(ext in IMAGE_TYPES)) return void errors.push(`${src} (${role}): the BE takes only JPEG / PNG as a separate image`);
    addFile(imageObjectKey(info.sha, src), { sourcePath: src, sha256: info.sha, sizeBytes: info.size, contentType: IMAGE_TYPES[ext] }, role, use);
  };
  const audio = (src: string, seconds: number | undefined, role: string, originType: 'recording' | 'tts', resourceId: string, use: Use) => {
    const info = asset(src, use);
    if (!info) return;
    const ext = extOf(src);
    if (!(ext in AUDIO_TYPES)) return void errors.push(`${src} (${role}): ${ext} is not an audio type the BE accepts`);
    const fp = resourceFingerprint(sel.sourceId, sel.paperId, resourceId);
    addFile(
      mediaObjectKey(releaseId, fp, info.sha, src),
      {
        sourcePath: src,
        sha256: info.sha,
        sizeBytes: info.size,
        contentType: AUDIO_TYPES[ext],
        resourceId,
        resourceFingerprint: fp,
        ...(seconds ? { seconds } : {}),
        originType,
        origin:
          originType === 'tts'
            ? 'Volcano Engine TTS (scripts/tts.mjs), mp3 64 kbps'
            : 'book recording, AAC 48 kbps mono (scripts/audio.mjs); the file holds both plays',
      },
      role,
      use,
    );
  };
  const localImage = (src: string, use: Use) => {
    const info = asset(src, use);
    if (!info) return;
    const cur = localOnly.find((l) => l.sourcePath === src);
    if (cur) cur.usedBy.push(use);
    else localOnly.push({ sourcePath: src, sha256: info.sha, sizeBytes: info.size, usedBy: [use], reason: 'inline image: the BE embeds it in HTML, no separate key' });
  };

  // section → resource, as frozen in the selection
  const resourceOf = new Map<string, string>();
  for (const r of sel.resources) for (const s of r.sectionIds) resourceOf.set(`${r.itemId}#${s}`, r.resourceId);
  const playlists = [...new Set(sel.resources.map((r) => r.playlistId))];
  const itemIds = [...new Set(sel.resources.map((r) => `${r.playlistId}/${r.itemId}`))];

  for (const pl of playlists) {
    const document = `playlists/${pl}/playlist.json`;
    const p = doc(document);
    image(p.cover, 'playlist-cover', { playlistId: pl, document, pointer: '/cover' });
    if (p.banner) capabilityGaps.push(`${document}/banner: ${p.banner} — the BE declares no playlist banner object; kept local, no key`);
  }

  for (const pi of itemIds) {
    const [pl, itemId] = pi.split('/');
    const document = `playlists/${pl}/items/${itemId}.json`;
    const item = doc(document);
    const base = { playlistId: pl, document, itemId };
    const sectionsInItem = (item.sections as { id: string }[]).map((s) => resourceOf.get(`${itemId}#${s.id}`)).filter(Boolean) as string[];
    if (item.thumbnail) image(item.thumbnail, 'item-thumbnail', { ...base, pointer: '/thumbnail' });
    // every assets/… string in the item is accounted for exactly once below; anything left over is a gap
    const seen = new Set<string>();
    const mark = (p: string) => seen.add(p);
    (item.article?.images ?? []).forEach((img: { id: string; src: string }, i: number) => {
      const pointer = ptr(['article', 'images', i, 'src']);
      mark(pointer);
      localImage(img.src, { ...base, pointer });
    });
    if (item.media?.audio) {
      mark('/media/audio');
      const rs = [...new Set(sectionsInItem)];
      if (rs.length === 1) audio(item.media.audio, undefined, 'item-audio', 'recording', rs[0], { ...base, pointer: '/media/audio' });
      else errors.push(`${document}/media/audio: item-level audio spans ${rs.length} resources — no single resource key`);
    }
    if (item.media?.video) {
      mark('/media/video');
      capabilityGaps.push(`${document}/media/video: ${item.media.video} — the BE has no video object rule; kept local, no key`);
    }
    (item.sections as { id: string; audio?: { src: string; seconds: number }; questions: { id: string; interaction: { kind: string; options?: { image?: string }[]; turns?: { id: string; audio?: { src: string; seconds: number } }[] } }[] }[]).forEach((s, si) => {
      const resourceId = resourceOf.get(`${itemId}#${s.id}`);
      if (!resourceId) return; // not selected
      if (s.audio) {
        const pointer = ptr(['sections', si, 'audio', 'src']);
        mark(pointer);
        audio(s.audio.src, s.audio.seconds, 'section-recording', 'recording', resourceId, { ...base, pointer, sectionId: s.id });
      }
      s.questions.forEach((q, qi) => {
        // picture options (KET / PET Listening Part 1): question images, inlined by the BE like article images
        (q.interaction as { options?: { image?: string }[] }).options?.forEach((o, oi) => {
          if (!o.image) return;
          const pointer = ptr(['sections', si, 'questions', qi, 'interaction', 'options', oi, 'image']);
          mark(pointer);
          localImage(o.image, { ...base, pointer, sectionId: s.id, questionId: q.id });
        });
        q.interaction.turns?.forEach((t, ti) => {
          if (!t.audio) return;
          const pointer = ptr(['sections', si, 'questions', qi, 'interaction', 'turns', ti, 'audio', 'src']);
          mark(pointer);
          audio(t.audio.src, t.audio.seconds, 'speaking-prompt', 'tts', resourceId, { ...base, pointer, sectionId: s.id, questionId: q.id, turnId: t.id });
        });
      });
    });
    // 词汇天天练: the headword / example recordings live on lexicon entries, which the BE does not import yet
    if (item.format === 'vocab-day')
      capabilityGaps.push(`${document}: lexicon audio of ${item.entryIds.length} entries (content/lexicons/${item.lexicon}) — vocab-day is not a BE format yet, no key`);
    // unknown reference types are reported, never guessed
    const walk = (o: unknown, parts: (string | number)[]) => {
      if (typeof o === 'string') {
        const pointer = ptr(parts);
        if (/^assets\//.test(o) && !seen.has(pointer) && pointer !== '/thumbnail') {
          // sections that are not in the selection are out of scope
          const si = parts[0] === 'sections' ? Number(parts[1]) : -1;
          if (si >= 0 && !resourceOf.has(`${itemId}#${item.sections[si].id}`)) return;
          errors.push(`${document}${pointer}: unknown asset reference ${o}`);
        }
      } else if (Array.isArray(o)) o.forEach((v, i) => walk(v, [...parts, i]));
      else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, [...parts, k]));
    };
    walk(item, []);
  }

  const snapshotText = [...snapshot.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([p, h]) => `${h}  ${p}`)
    .join('\n') + '\n';
  const list = [...files.values()].sort((a, b) => (a.objectKey < b.objectKey ? -1 : 1));
  const plan = {
    format: PLAN_FORMAT,
    sourceId: sel.sourceId,
    paperId: sel.paperId,
    contentReleaseId,
    sourceCommit: opts.sourceCommit ?? git([...snapshot.keys()]),
    contentSnapshotSHA256: sha256(snapshotText),
    releaseId,
    selectionFile: selectionPath,
    selectionSHA256: sha256(selBytes),
    keyPolicyVersion: KEY_POLICY_VERSION,
    frozenAt: opts.frozenAt ?? new Date().toISOString(),
    status: errors.length ? 'INCOMPLETE' : 'PREPARED',
    summary: {
      objects: list.length,
      bytes: list.reduce((n, f) => n + f.sizeBytes, 0),
      references: list.reduce((n, f) => n + f.usedBy.length, 0),
      sourceFiles: new Set(list.map((f) => f.sourcePath)).size,
      localOnly: localOnly.length,
      errors: errors.length,
      capabilityGaps: capabilityGaps.length,
    },
    files: list,
    localOnly,
    capabilityGaps,
    errors,
  };
  return { plan, snapshotText };
}

/** the commit, plus a note when the working tree differs (git-ignored media are covered by the snapshot digests) */
function git(paths: string[]): string {
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    // only the files this plan is bound to (other work in the tree does not matter)
    const dirty = execFileSync('git', ['status', '--porcelain', '--', ...paths.map((p) => join(CONTENT, p))], { encoding: 'utf8' }).trim();
    return dirty ? `${head}+uncommitted-content` : head;
  } catch {
    return 'unknown';
  }
}

export const planPaths = (contentReleaseId: string) => ({
  plan: `docs/handoff/asset-plan.${contentReleaseId}.json`,
  snapshot: `docs/handoff/asset-snapshot.${contentReleaseId}.sha256`,
});

if (import.meta.url === `file://${process.argv[1]}`) {
  const [contentReleaseId, selectionPath] = process.argv.slice(2);
  if (!contentReleaseId || !selectionPath) {
    console.error('usage: npx tsx scripts/asset-plan.ts <contentReleaseId> <production-selection.json>');
    process.exit(1);
  }
  const out = planPaths(contentReleaseId);
  const prev = existsSync(out.plan) ? readJson(out.plan) : null;
  const { plan, snapshotText } = buildPlan(contentReleaseId, selectionPath, prev ? { releaseId: prev.releaseId, frozenAt: prev.frozenAt, sourceCommit: prev.sourceCommit } : {});
  const text = JSON.stringify(plan, null, 2) + '\n';
  if (prev) {
    // a frozen delivery is never rewritten: the same inputs must give the same bytes
    if (text !== readFileSync(out.plan, 'utf8')) {
      console.error(`${out.plan} is frozen and the content no longer matches it (release ${prev.releaseId}).`);
      console.error('Freeze the changed content under a new contentReleaseId instead of rewriting this one.');
      process.exit(1);
    }
    console.log(`${out.plan}: unchanged (release ${plan.releaseId}, manifestSHA256 ${sha256(text)})`);
  } else {
    writeFileSync(out.plan, text);
    writeFileSync(out.snapshot, snapshotText);
    console.log(`${out.plan}: release ${plan.releaseId}, manifestSHA256 ${sha256(text)}`);
  }
  const s = plan.summary;
  console.log(`${plan.status}: ${s.objects} object(s), ${s.bytes} bytes, ${s.references} reference(s); ${s.localOnly} inline image(s) kept local`);
  plan.capabilityGaps.forEach((g) => console.log(`  capability gap: ${g}`));
  plan.errors.forEach((g) => console.log(`  ERROR: ${g}`));
  process.exit(plan.errors.length ? 2 : 0);
}
