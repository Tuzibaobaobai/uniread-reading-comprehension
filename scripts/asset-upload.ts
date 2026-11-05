/**
 * Upload a frozen asset plan to one OSS storage profile and verify every object (GitHub #130,
 * docs/uniread-spec/asset-oss.md §6–8).
 *
 *   npx tsx scripts/asset-upload.ts <plan.json> --profile <name>                     dry run: no credentials, no network
 *   npx tsx scripts/asset-upload.ts <plan.json> --profile <name> --verify             read-only: which planned objects exist
 *   npx tsx scripts/asset-upload.ts <plan.json> --profile test --execute             upload + read-back verification
 *   npx tsx scripts/asset-upload.ts <plan.json> --profile production --execute --confirm <storageTargetId>
 *
 * Profiles: .work/asset-profiles.local.json (git-ignored; `--profiles <file>` to point elsewhere). The real endpoint,
 * bucket and credentials are handed over privately by the maintainers — never put them in the repo, an issue or a log.
 *   { "profiles": { "test": { "storageTargetId": "exam-materials-test", "endpoint": "https://<oss-endpoint>",
 *       "region": "<region>", "bucket": "<bucket>", "allowedPrefixes": ["exam-media/v1/", "exam-resources/v1/<releaseId>/"],
 *       "keyPolicyVersion": "be-exam-existing-v1", "credentialRef": "env:RC_ASSET_TEST" } } }
 * credentialRef env:<NAME> reads <NAME>_ACCESS_KEY_ID, <NAME>_ACCESS_KEY_SECRET and optional <NAME>_SECURITY_TOKEN (STS)
 * from the environment at execute time only. The maintainers' private handoff file (rc-oss-private-handoff-1,
 * oss-profiles.private.json) is read as it is: `--profiles <path outside the repo>`; its inline credentials are used
 * only at execute time and never printed. When it says sharedStorage (test and production in one bucket), every
 * profile needs --confirm <storageTargetId>.
 *
 * Freeze check (before --verify and --execute; the BE's review, #130): the selection file must still hash to the plan's
 * selectionSHA256, the snapshot file to contentSnapshotSHA256, and every file the snapshot lists — the public content
 * JSON, the files to upload and the inline images kept local — to its frozen digest. Any change stops the run before
 * anything is sent: freeze a new delivery (new contentReleaseId → new releaseId) instead.
 *
 * Per object: PUT with x-oss-forbid-overwrite (an existing object is never replaced), then an authenticated GET whose
 * full bytes must hash to the plan's sha256, with the plan's size and Content-Type. An existing object with the same
 * bytes is reused; different bytes fail the run (no overwrite, delete or ACL change, ever). The receipt
 * (.work/assets/receipts/<contentReleaseId>.<storageTargetId>.json) holds no credentials or signed URLs.
 */
import { createHash, createHmac } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KEY_POLICY_VERSION, sha256 } from './lib/asset-identity.ts';
import { PLAN_FORMAT, type PlanFile } from './asset-plan.ts';

export const UPLOADER_VERSION = 'rc-asset-upload-1';

export type Profile = {
  storageTargetId: string;
  endpoint: string;
  region: string;
  bucket: string;
  allowedPrefixes: string[];
  keyPolicyVersion: string;
  /** env:<NAME>; or, in the maintainers' private handoff file (rc-oss-private-handoff-1), inline `credentials` */
  credentialRef?: string;
  credentials?: { type: string; accessKeyId: string; accessKeySecret: string; securityToken?: string };
  /** virtual-host (default, https://<bucket>.<endpoint host>/<key>) or path (https://<endpoint>/<bucket>/<key>) */
  addressing?: 'virtual-host' | 'path';
};
export type Credentials = { accessKeyId: string; accessKeySecret: string; securityToken?: string };
type Plan = {
  format: string;
  sourceId: string;
  contentReleaseId: string;
  releaseId: string;
  selectionFile?: string;
  selectionSHA256: string;
  snapshotFile?: string;
  contentSnapshotSHA256?: string;
  keyPolicyVersion: string;
  status: string;
  files: PlanFile[];
};

/** the frozen delivery is unchanged: selection, snapshot and every file the snapshot lists (paths under content/) */
export function checkFreeze(plan: Plan, readRoot: (p: string) => Buffer, readFile: (p: string) => Buffer) {
  if (!plan.selectionFile || !plan.snapshotFile || !plan.contentSnapshotSHA256)
    throw new Error('the plan names no selection / snapshot file: freeze it again with the current scripts/asset-plan.ts');
  const read = (what: string, f: () => Buffer) => {
    try {
      return f();
    } catch {
      throw new Error(`${what} is missing: the frozen delivery cannot be checked`);
    }
  };
  if (sha256(read(plan.selectionFile, () => readRoot(plan.selectionFile!))) !== plan.selectionSHA256)
    throw new Error(`${plan.selectionFile} changed since the plan was frozen (selectionSHA256): freeze a new delivery`);
  const snap = read(plan.snapshotFile, () => readRoot(plan.snapshotFile!));
  if (sha256(snap) !== plan.contentSnapshotSHA256) throw new Error(`${plan.snapshotFile} changed since the plan was frozen (contentSnapshotSHA256)`);
  const lines = snap.toString('utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    const m = /^([0-9a-f]{64})  (.+)$/.exec(line);
    if (!m) throw new Error(`${plan.snapshotFile}: bad line "${line}"`);
    if (sha256(read(`content/${m[2]}`, () => readFile(m[2]))) !== m[1])
      throw new Error(`content/${m[2]} changed since the plan was frozen: freeze a new delivery`);
  }
  return lines.length;
}

/** everything that can be checked without credentials or network; throws on the first problem */
export function preflight(planText: string, profile: Profile, readFile: (p: string) => Buffer, forUpload = true, readRoot?: (p: string) => Buffer) {
  const plan = JSON.parse(planText) as Plan;
  if (plan.format !== PLAN_FORMAT) throw new Error(`plan format ${plan.format}, expected ${PLAN_FORMAT}`);
  if (plan.status !== 'PREPARED') throw new Error(`plan status is ${plan.status}: fix its errors and freeze a new plan first`);
  if (plan.keyPolicyVersion !== KEY_POLICY_VERSION || profile.keyPolicyVersion !== KEY_POLICY_VERSION)
    throw new Error(`key policy mismatch: plan ${plan.keyPolicyVersion}, profile ${profile.keyPolicyVersion}, tool ${KEY_POLICY_VERSION}`);
  // a dry run may use the placeholder profile (the real one is handed over privately); an upload may not
  if (forUpload)
    for (const k of ['storageTargetId', 'endpoint', 'region', 'bucket'] as const)
      if (!profile[k] || /[<>]/.test(profile[k])) throw new Error(`profile ${k} is missing or still a placeholder`);
  const prefixes = profile.allowedPrefixes.map((p) => p.replace('<releaseId>', plan.releaseId));
  const keys = new Set<string>();
  for (const f of plan.files) {
    if (keys.has(f.objectKey)) throw new Error(`object ${f.objectKey} listed twice`);
    keys.add(f.objectKey);
    if (!prefixes.some((p) => f.objectKey.startsWith(p))) throw new Error(`${f.objectKey} is outside the profile's allowed prefixes`);
    if (f.objectKey.startsWith('exam-resources/') && !f.objectKey.startsWith(`exam-resources/v1/${plan.releaseId}/`))
      throw new Error(`${f.objectKey} does not belong to release ${plan.releaseId}`);
    const buf = readFile(f.sourcePath);
    if (buf.length !== f.sizeBytes || sha256(buf) !== f.sha256) throw new Error(`${f.sourcePath} changed since the plan was frozen`);
  }
  // before anything touches the storage, the whole frozen delivery must be as it was (a dry run reports only the files)
  const frozenFiles = forUpload && readRoot ? checkFreeze(plan, readRoot, readFile) : undefined;
  return { plan, manifestSHA256: sha256(planText), frozenFiles };
}

/** OSS header signature (V1): HMAC-SHA1 over verb, MD5, type, date, x-oss-* headers and /bucket/key */
function sign(c: Credentials, verb: string, md5: string, type: string, date: string, ossHeaders: Record<string, string>, resource: string) {
  const canon = Object.keys(ossHeaders)
    .map((k) => k.toLowerCase())
    .sort()
    .map((k) => `${k}:${ossHeaders[k]}\n`)
    .join('');
  const sig = createHmac('sha1', c.accessKeySecret).update(`${verb}\n${md5}\n${type}\n${date}\n${canon}${resource}`).digest('base64');
  return `OSS ${c.accessKeyId}:${sig}`;
}

export function objectUrl(profile: Profile, key: string) {
  const u = new URL(profile.endpoint);
  const path = key.split('/').map(encodeURIComponent).join('/');
  return profile.addressing === 'path' ? `${u.origin}/${profile.bucket}/${path}` : `${u.protocol}//${profile.bucket}.${u.host}/${path}`;
}

type Outcome = { objectKey: string; sha256: string; sizeBytes: number; contentType: string; verifiedAt: string; reused: boolean };

export async function uploadOne(profile: Profile, cred: Credentials, f: PlanFile, body: Buffer, fetchImpl: typeof fetch = fetch): Promise<Outcome> {
  const resource = `/${profile.bucket}/${f.objectKey}`;
  const url = objectUrl(profile, f.objectKey);
  const sts: Record<string, string> = cred.securityToken ? { 'x-oss-security-token': cred.securityToken } : {};
  // 1. upload, never replacing an existing object
  const md5 = createHash('md5').update(body).digest('base64');
  const date = new Date().toUTCString();
  const putHeaders = { 'x-oss-forbid-overwrite': 'true', ...sts };
  const put = await fetchImpl(url, {
    method: 'PUT',
    headers: { 'Content-Type': f.contentType, 'Content-MD5': md5, Date: date, ...putHeaders, Authorization: sign(cred, 'PUT', md5, f.contentType, date, putHeaders, resource) },
    body: new Uint8Array(body),
  });
  let reused = false;
  if (put.status === 409) reused = true; // FileAlreadyExists: verify what is there, below
  else if (!put.ok) throw new Error(`PUT ${f.objectKey}: HTTP ${put.status} ${(await put.text()).match(/<Code>(.*?)<\/Code>/)?.[1] ?? ''}`);
  // 2. read the object back and check the full bytes, size and type (ETag / 200 / HEAD length are not proof)
  const gdate = new Date().toUTCString();
  const get = await fetchImpl(url, { headers: { Date: gdate, ...sts, Authorization: sign(cred, 'GET', '', '', gdate, sts, resource) } });
  if (!get.ok) throw new Error(`GET ${f.objectKey}: HTTP ${get.status}`);
  const got = Buffer.from(await get.arrayBuffer());
  const type = (get.headers.get('content-type') ?? '').split(';')[0].trim();
  if (got.length !== f.sizeBytes || sha256(got) !== f.sha256)
    throw new Error(`${f.objectKey}: the stored object differs from the plan (${reused ? 'it already existed — not overwritten' : 'after upload'})`);
  if (type !== f.contentType) throw new Error(`${f.objectKey}: stored Content-Type ${type}, expected ${f.contentType}`);
  return { objectKey: f.objectKey, sha256: f.sha256, sizeBytes: f.sizeBytes, contentType: f.contentType, verifiedAt: new Date().toISOString(), reused };
}

/** read-only: is the planned object there with the planned bytes? (no PUT, no confirmation needed) */
export async function checkOne(profile: Profile, cred: Credentials, f: PlanFile, fetchImpl: typeof fetch = fetch): Promise<'verified' | 'missing' | string> {
  const resource = `/${profile.bucket}/${f.objectKey}`;
  const sts: Record<string, string> = cred.securityToken ? { 'x-oss-security-token': cred.securityToken } : {};
  const date = new Date().toUTCString();
  const get = await fetchImpl(objectUrl(profile, f.objectKey), { headers: { Date: date, ...sts, Authorization: sign(cred, 'GET', '', '', date, sts, resource) } });
  if (get.status === 404) return 'missing';
  if (!get.ok) return `HTTP ${get.status} ${(await get.text()).match(/<Code>(.*?)<\/Code>/)?.[1] ?? ''}`.trim();
  const got = Buffer.from(await get.arrayBuffer());
  const type = (get.headers.get('content-type') ?? '').split(';')[0].trim();
  if (got.length !== f.sizeBytes || sha256(got) !== f.sha256) return 'different bytes';
  if (type !== f.contentType) return `Content-Type ${type}`;
  return 'verified';
}

export function credentialsFrom(ref: string, env: NodeJS.ProcessEnv): Credentials {
  const m = /^env:([A-Z][A-Z0-9_]*)$/.exec(ref);
  if (!m) throw new Error(`credentialRef ${ref}: only env:<NAME> is supported`);
  const id = env[`${m[1]}_ACCESS_KEY_ID`];
  const secret = env[`${m[1]}_ACCESS_KEY_SECRET`];
  if (!id || !secret) throw new Error(`${m[1]}_ACCESS_KEY_ID / ${m[1]}_ACCESS_KEY_SECRET are not set`);
  return { accessKeyId: id, accessKeySecret: secret, securityToken: env[`${m[1]}_SECURITY_TOKEN`] };
}

export async function run(
  planPath: string,
  profileName: string,
  opts: {
    profilesFile: string;
    execute: boolean;
    verify?: boolean;
    confirm?: string;
    env: NodeJS.ProcessEnv;
    fetchImpl?: typeof fetch;
    contentDir?: string;
    /** where the plan's selectionFile / snapshotFile paths start (the repository) */
    rootDir?: string;
    receiptsDir?: string;
    log?: (s: string) => void;
  },
) {
  const log = opts.log ?? console.log;
  const file = JSON.parse(readFileSync(opts.profilesFile, 'utf8')) as { profiles: Record<string, Profile>; keyPolicyVersion?: string; sharedStorage?: boolean };
  const raw = file.profiles[profileName];
  if (!raw) throw new Error(`profile "${profileName}" is not in ${opts.profilesFile}`);
  // the private handoff file states the key policy once and has no prefixes: the plan's own scope is the limit
  const profile: Profile = {
    ...raw,
    keyPolicyVersion: raw.keyPolicyVersion ?? file.keyPolicyVersion ?? '',
    allowedPrefixes: raw.allowedPrefixes ?? ['exam-media/v1/', 'exam-resources/v1/<releaseId>/'],
  };
  // production — or a test profile that shares production's storage — is never written by accident: name the target
  const guarded = /prod/i.test(profileName) || /prod/i.test(profile.storageTargetId) || file.sharedStorage === true;
  if (guarded && opts.execute && opts.confirm !== profile.storageTargetId)
    throw new Error(`profile "${profileName}" writes to ${profile.storageTargetId}${file.sharedStorage ? ' (storage shared with production)' : ''}: add --confirm ${profile.storageTargetId}`);
  const contentDir = opts.contentDir ?? 'content';
  const planText = readFileSync(planPath, 'utf8');
  const rootDir = opts.rootDir ?? '.';
  const { plan, manifestSHA256, frozenFiles } = preflight(
    planText,
    profile,
    (p) => readFileSync(join(contentDir, p)),
    opts.execute || opts.verify,
    (p) => readFileSync(join(rootDir, p)),
  );
  if (frozenFiles !== undefined) log(`freeze check: selection, snapshot and ${frozenFiles} frozen file(s) unchanged`);
  const bytes = plan.files.reduce((n, f) => n + f.sizeBytes, 0);
  log(`${plan.contentReleaseId} (release ${plan.releaseId}) → ${profile.storageTargetId}: ${plan.files.length} object(s), ${bytes} bytes; manifestSHA256 ${manifestSHA256}`);
  if (opts.verify) {
    // read-only: report what the storage already holds for this plan
    const cred: Credentials = profile.credentials
      ? { accessKeyId: profile.credentials.accessKeyId, accessKeySecret: profile.credentials.accessKeySecret, securityToken: profile.credentials.securityToken }
      : credentialsFrom(profile.credentialRef ?? '', opts.env);
    const counts: Record<string, number> = {};
    for (const f of plan.files) {
      const r = await checkOne(profile, cred, f, opts.fetchImpl);
      counts[r] = (counts[r] ?? 0) + 1;
      if (r !== 'verified' && r !== 'missing') log(`  ${f.objectKey}: ${r}`);
    }
    log(`verify (read-only): ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
    return null;
  }
  if (!opts.execute) {
    plan.files.forEach((f) => log(`  ${f.objectKey}  ${f.sizeBytes}  ${f.contentType}  ← ${f.sourcePath}`));
    log('dry run: nothing read from the environment, nothing sent. Add --execute to upload.');
    return null;
  }
  const cred: Credentials = profile.credentials
    ? { accessKeyId: profile.credentials.accessKeyId, accessKeySecret: profile.credentials.accessKeySecret, securityToken: profile.credentials.securityToken }
    : credentialsFrom(profile.credentialRef ?? '', opts.env);
  const verified: Outcome[] = [];
  const failed: { objectKey: string; error: string }[] = [];
  for (const f of plan.files) {
    try {
      verified.push(await uploadOne(profile, cred, f, readFileSync(join(contentDir, f.sourcePath)), opts.fetchImpl));
    } catch (e) {
      failed.push({ objectKey: f.objectKey, error: (e as Error).message });
      break; // stop at the first failure; a rerun verifies what is already there and continues
    }
  }
  const receipt = {
    receiptFormat: 'rc-asset-upload-receipt-1',
    uploaderVersion: UPLOADER_VERSION,
    sourceId: plan.sourceId,
    contentReleaseId: plan.contentReleaseId,
    releaseId: plan.releaseId,
    selectionSHA256: plan.selectionSHA256,
    manifestSHA256,
    planFile: planPath,
    planVerifiedAt: new Date().toISOString(),
    storageTargetId: profile.storageTargetId,
    endpoint: profile.endpoint,
    region: profile.region,
    bucket: profile.bucket,
    keyPolicyVersion: profile.keyPolicyVersion,
    profile: profileName,
    sharedStorage: file.sharedStorage === true,
    verifiedObjects: verified.map(({ reused, ...o }) => o),
    reusedObjectCount: verified.filter((o) => o.reused).length,
    newlyUploadedObjectCount: verified.filter((o) => !o.reused).length,
    deliveryVerification: 'not-run',
    status: failed.length || verified.length !== plan.files.length ? 'INCOMPLETE' : 'UPLOADED_VERIFIED',
    failedObjects: failed,
    lastConfirmedPhase: failed.length ? `verified ${verified.length}/${plan.files.length}` : 'all objects verified',
  };
  const dir = opts.receiptsDir ?? '.work/assets/receipts';
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${plan.contentReleaseId}.${profileName}.${profile.storageTargetId}.json`);
  writeFileSync(out, JSON.stringify(receipt, null, 2) + '\n');
  log(`${receipt.status}: ${receipt.newlyUploadedObjectCount} uploaded, ${receipt.reusedObjectCount} reused, ${failed.length} failed → ${out}`);
  failed.forEach((f) => log(`  FAILED ${f.objectKey}: ${f.error}`));
  return receipt;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
  const planPath = args[0];
  const profileName = opt('profile');
  if (!planPath || planPath.startsWith('--') || !profileName) {
    console.error('usage: npx tsx scripts/asset-upload.ts <plan.json> --profile <name> [--verify | --execute] [--confirm <storageTargetId>] [--profiles <file>]');
    process.exit(1);
  }
  const profilesFile = opt('profiles') ?? '.work/asset-profiles.local.json';
  if (!existsSync(profilesFile)) {
    console.error(`${profilesFile} not found: the storage profiles are handed over privately by the maintainers (see the header of this script).`);
    process.exit(1);
  }
  run(planPath, profileName, { profilesFile, execute: args.includes('--execute'), verify: args.includes('--verify'), confirm: opt('confirm'), env: process.env })
    .then((r) => process.exit(r && r.status !== 'UPLOADED_VERIFIED' ? 2 : 0))
    .catch((e) => {
      console.error((e as Error).message);
      process.exit(1);
    });
}
