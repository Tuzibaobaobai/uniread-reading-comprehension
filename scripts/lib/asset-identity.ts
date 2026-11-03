/**
 * Platform identities and OSS object keys for pre-uploaded assets (GitHub #130, docs/uniread-spec/asset-oss.md §4).
 * Fixed here once so no production batch re-implements them. Keys follow the UniRead BE's existing functions exactly —
 * no new namespace, no environment prefix:
 *   cover / thumbnail  exam-media/v1/<sha256>.jpg|.png                                       (imageObjectKey)
 *   audio              exam-resources/v1/<releaseId>/<resourceFingerprint>/media/<sha256><ext>  (Package.MediaObjectKey)
 * resourceFingerprint = UUIDv5(namespace, goJSON(["resource", sourceId, paperId, resourceId])),
 * namespace = UUIDv5(NAMESPACE_URL, "uniread/exam-import/rc-selection-1") — the name keeps "rc-selection-1" even for
 * rc-selection-2 selections.
 */
import { createHash, randomUUID } from 'node:crypto';

export const KEY_POLICY_VERSION = 'be-exam-existing-v1';
const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

const uuidBytes = (u: string) => Buffer.from(u.replace(/-/g, ''), 'hex');
const uuidString = (b: Buffer) => {
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

/** RFC 9562 name-based UUID, SHA-1 (version 5) */
export function uuidv5(name: string, namespace: string): string {
  const hash = createHash('sha1').update(uuidBytes(namespace)).update(Buffer.from(name, 'utf8')).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  return uuidString(b);
}

export const IMPORT_NAMESPACE = uuidv5('uniread/exam-import/rc-selection-1', NAMESPACE_URL);

/**
 * Go's json.Marshal of a []string: no spaces; escapes " \ and control characters, and (HTML-safe by default)
 * < > & U+2028 U+2029 as \u003c \u003e \u0026 \u2028 \u2029; other characters stay UTF-8.
 */
export function goJSON(values: string[]): string {
  const esc = (s: string) =>
    s.replace(/[\u0000-\u001f"\\<>&\u2028\u2029]/g, (c) => {
      switch (c) {
        case '"':
          return '\\"';
        case '\\':
          return '\\\\';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '\t':
          return '\\t';
        default:
          return `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
      }
    });
  return `[${values.map((v) => `"${esc(v)}"`).join(',')}]`;
}

export const resourceFingerprint = (sourceId: string, paperId: string, resourceId: string) =>
  uuidv5(goJSON(['resource', sourceId, paperId, resourceId]), IMPORT_NAMESPACE);
export const playlistFingerprint = (sourceId: string, paperId: string) => uuidv5(goJSON(['playlist', sourceId, paperId]), IMPORT_NAMESPACE);

/** a canonical, non-nil UUID (lower-case 8-4-4-4-12) */
export const isCanonicalUuid = (u: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(u) && u !== '00000000-0000-0000-0000-000000000000';
/** generated once per frozen delivery and kept (retries, test → production and the BE import reuse it) */
export const newReleaseId = () => randomUUID();

/** the formats the BE accepts as separate objects today; anything else is a gap, never a guessed key */
export const IMAGE_TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
export const AUDIO_TYPES: Record<string, string> = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.webm': 'audio/webm' };

export const extOf = (path: string) => (/\.[^./]+$/.exec(path)?.[0] ?? '').toLowerCase();

export function imageObjectKey(sha256: string, sourcePath: string): string {
  const ext = extOf(sourcePath);
  if (ext === '.jpg' || ext === '.jpeg') return `exam-media/v1/${sha256}.jpg`;
  if (ext === '.png') return `exam-media/v1/${sha256}.png`;
  throw new Error(`no BE image key for ${sourcePath} (only JPEG / PNG)`);
}

/** the extension is the source path's last extension, lower-cased, with its dot (.m4a stays .m4a) */
export function mediaObjectKey(releaseId: string, fingerprint: string, sha256: string, sourcePath: string): string {
  if (!isCanonicalUuid(releaseId)) throw new Error(`releaseId ${releaseId} is not a canonical non-nil UUID`);
  const ext = extOf(sourcePath);
  if (!(ext in AUDIO_TYPES)) throw new Error(`no BE audio key for ${sourcePath}`);
  return `exam-resources/v1/${releaseId}/${fingerprint}/media/${sha256}${ext}`;
}

/** the file's bytes really are the type its extension claims (no renamed formats) */
export function sniff(buf: Buffer, ext: string): boolean {
  const at = (o: number, s: string) => buf.subarray(o, o + s.length).toString('latin1') === s;
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case '.png':
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case '.mp3':
      return at(0, 'ID3') || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0);
    case '.m4a':
      return at(4, 'ftyp');
    case '.ogg':
      return at(0, 'OggS');
    case '.webm':
      return buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    default:
      return false;
  }
}

export const sha256 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex');
