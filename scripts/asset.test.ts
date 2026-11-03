// #130 asset identities, plan and upload (docs/uniread-spec/asset-oss.md)
import { createServer, type Server } from 'node:http';
import { createHash, createHmac } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IMPORT_NAMESPACE, goJSON, imageObjectKey, mediaObjectKey, playlistFingerprint, resourceFingerprint, sha256, sniff, uuidv5 } from './lib/asset-identity';
import { buildPlan } from './asset-plan';
import { run } from './asset-upload';

describe('identities (BE algorithm)', () => {
  // reference values from Python's uuid.uuid5 and json.dumps(separators=(',', ':')) — an independent implementation
  it('namespace and fingerprints match the reference', () => {
    expect(IMPORT_NAMESPACE).toBe('17fc19f5-c110-598f-b2cc-b6fb31436930');
    expect(resourceFingerprint('uniread-rc', 'ci-g3-pilot-1', 'ci-g3-w01-mon-s1')).toBe('b3468592-4b83-50f9-b92c-6326c388c54e');
    expect(playlistFingerprint('uniread-rc', 'ci-g3-pilot-1')).toBe('88c9567a-5ec8-517e-ba6b-4bf740dab86d');
    expect(resourceFingerprint('uniread-rc', 'ket1-t1', 'ket1-t1-l-s1')).toBe('b54bad04-a9ca-5412-ad58-37f40f6294ad');
    expect(uuidv5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });
  it('compact JSON is Go json.Marshal', () => {
    expect(goJSON(['resource', 'a', 'b'])).toBe('["resource","a","b"]');
    expect(goJSON(['<&>', 'q"\\', 'tab\t', '中文', ' '])).toBe('["\\u003c\\u0026\\u003e","q\\"\\\\","tab\\t","中文","\\u2028"]');
  });
  it('object keys follow the existing BE functions', () => {
    const sha = 'a'.repeat(64);
    expect(imageObjectKey(sha, 'assets/x/cover.JPG')).toBe(`exam-media/v1/${sha}.jpg`);
    expect(imageObjectKey(sha, 'assets/x/c.png')).toBe(`exam-media/v1/${sha}.png`);
    expect(() => imageObjectKey(sha, 'assets/x/c.webp')).toThrow();
    const rel = '7b987e78-3746-4ffa-b5a7-8d2fd315a9fd';
    // the source extension is kept (lower-case): .m4a never becomes .mp4
    expect(mediaObjectKey(rel, 'f'.repeat(8), sha, 'assets/ket1/p1.M4A')).toBe(`exam-resources/v1/${rel}/ffffffff/media/${sha}.m4a`);
    expect(() => mediaObjectKey('00000000-0000-0000-0000-000000000000', 'f', sha, 'a.mp3')).toThrow();
    expect(() => mediaObjectKey(rel, 'f', sha, 'a.mp4')).toThrow();
  });
  it('a renamed format is caught', () => {
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), '.jpg')).toBe(true);
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), '.png')).toBe(false);
    expect(sniff(Buffer.from('\0\0\0\x20ftypM4A '), '.m4a')).toBe(true);
  });
});

const ketAudio = 'content/assets/ket1/ket1-t1-p1.m4a';
describe.skipIf(!existsSync(ketAudio))('plan (KET 第1套 pilot)', () => {
  const sel = 'docs/handoff/production-selection.ket1-t1.json';
  const opts = { releaseId: '7b987e78-3746-4ffa-b5a7-8d2fd315a9fd', frozenAt: '2026-11-03T00:00:00.000Z', sourceCommit: 'test' };
  it('covers the cover, recordings and speaking prompts; inline images stay local; deterministic', () => {
    const a = buildPlan('ket1-t1-test', sel, opts);
    const b = buildPlan('ket1-t1-test', sel, opts);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const { plan } = a;
    expect(plan.status).toBe('PREPARED');
    expect(plan.errors).toEqual([]);
    const roles = plan.files.flatMap((f) => f.roles);
    expect(roles.filter((r) => r === 'playlist-cover')).toHaveLength(1);
    expect(roles.filter((r) => r === 'section-recording')).toHaveLength(5);
    expect(roles).toContain('speaking-prompt');
    const rec = plan.files.find((f) => f.sourcePath === 'assets/ket1/ket1-t1-p1.m4a')!;
    expect(rec.objectKey).toBe(`exam-resources/v1/${opts.releaseId}/${resourceFingerprint('uniread-rc', 'ket1-t1', 'ket1-t1-l-s1')}/media/${rec.sha256}.m4a`);
    expect(rec.sha256).toBe(sha256(readFileSync(`content/${rec.sourcePath}`)));
    expect(rec.usedBy[0].pointer).toBe('/sections/0/audio/src');
    expect(plan.localOnly.length).toBeGreaterThan(0);
    expect(plan.files.every((f) => !/keys\//.test(f.sourcePath))).toBe(true);
    expect(plan.capabilityGaps.some((g) => g.includes('banner'))).toBe(true);
  });
});

describe('upload (mock OSS)', () => {
  const store = new Map<string, { body: Buffer; type: string }>();
  const SECRET = 'test-secret';
  let server: Server;
  let endpoint = '';
  const dir = mkdtempSync(join(tmpdir(), 'rc-asset-'));
  const content = join(dir, 'content');
  // a minimal OSS: V1 signatures, x-oss-forbid-overwrite → 409, GET returns the stored bytes and type
  beforeAll(async () => {
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const resource = decodeURIComponent(req.url!.split('?')[0]);
        const oss = Object.keys(req.headers)
          .filter((k) => k.startsWith('x-oss-'))
          .sort()
          .map((k) => `${k}:${req.headers[k]}\n`)
          .join('');
        const want = createHmac('sha1', SECRET)
          .update(`${req.method}\n${req.headers['content-md5'] ?? ''}\n${req.headers['content-type'] ?? ''}\n${req.headers.date}\n${oss}${resource}`)
          .digest('base64');
        if (req.headers.authorization !== `OSS test-id:${want}`) return void res.writeHead(403).end('<Code>SignatureDoesNotMatch</Code>');
        const key = resource.split('/').slice(2).join('/');
        if (req.method === 'PUT') {
          const body = Buffer.concat(chunks);
          if (createHash('md5').update(body).digest('base64') !== req.headers['content-md5']) return void res.writeHead(400).end('<Code>InvalidDigest</Code>');
          if (store.has(key) && req.headers['x-oss-forbid-overwrite'] === 'true') return void res.writeHead(409).end('<Code>FileAlreadyExists</Code>');
          store.set(key, { body, type: String(req.headers['content-type']) });
          return void res.writeHead(200).end();
        }
        const o = store.get(key);
        if (!o) return void res.writeHead(404).end('<Code>NoSuchKey</Code>');
        res.writeHead(200, { 'content-type': o.type }).end(o.body);
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    endpoint = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => server.close());

  const releaseId = '7b987e78-3746-4ffa-b5a7-8d2fd315a9fd';
  const setup = () => {
    mkdirSync(join(content, 'assets/t'), { recursive: true });
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const mp3 = Buffer.from('ID3\x03fake-audio');
    writeFileSync(join(content, 'assets/t/cover.jpg'), jpg);
    writeFileSync(join(content, 'assets/t/a.mp3'), mp3);
    const file = (sourcePath: string, buf: Buffer, contentType: string, objectKey: string) => ({ sourcePath, sha256: sha256(buf), sizeBytes: buf.length, contentType, objectKey, roles: ['x'], usedBy: [] });
    const plan = {
      format: 'be-asset-upload-plan-1',
      sourceId: 'uniread-rc',
      contentReleaseId: 't-01',
      releaseId,
      selectionSHA256: 'x',
      keyPolicyVersion: 'be-exam-existing-v1',
      status: 'PREPARED',
      files: [
        file('assets/t/cover.jpg', jpg, 'image/jpeg', imageObjectKey(sha256(jpg), 'cover.jpg')),
        file('assets/t/a.mp3', mp3, 'audio/mpeg', mediaObjectKey(releaseId, 'fp', sha256(mp3), 'a.mp3')),
      ],
    };
    const planPath = join(dir, 'plan.json');
    writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n');
    const profile = (id: string) => ({
      storageTargetId: id,
      endpoint,
      region: 'r',
      bucket: 'b',
      allowedPrefixes: ['exam-media/v1/', 'exam-resources/v1/<releaseId>/'],
      keyPolicyVersion: 'be-exam-existing-v1',
      credentialRef: 'env:RC_ASSET_T',
      addressing: 'path',
    });
    const profilesFile = join(dir, 'profiles.json');
    writeFileSync(profilesFile, JSON.stringify({ profiles: { test: profile('exam-materials-test'), production: profile('exam-materials-production') } }));
    return { planPath, profilesFile };
  };
  const env = { RC_ASSET_T_ACCESS_KEY_ID: 'test-id', RC_ASSET_T_ACCESS_KEY_SECRET: SECRET };
  const quiet = () => {};

  it('dry run needs no credentials and sends nothing', async () => {
    const { planPath, profilesFile } = setup();
    expect(await run(planPath, 'test', { profilesFile, execute: false, env: {}, contentDir: content, log: quiet })).toBeNull();
    expect(store.size).toBe(0);
  });
  it('uploads and verifies, then reuses on a rerun; the receipt has no secrets', async () => {
    const { planPath, profilesFile } = setup();
    const o = { profilesFile, execute: true, env, contentDir: content, receiptsDir: join(dir, 'receipts'), log: quiet };
    const first = await run(planPath, 'test', o);
    expect(first!.status).toBe('UPLOADED_VERIFIED');
    expect(first!.newlyUploadedObjectCount).toBe(2);
    const again = await run(planPath, 'test', o);
    expect(again!.reusedObjectCount).toBe(2);
    expect(again!.newlyUploadedObjectCount).toBe(0);
    expect(JSON.stringify(again)).not.toContain(SECRET);
  });
  it('different bytes under an existing key fail and are not overwritten', async () => {
    const { planPath, profilesFile } = setup();
    const key = [...store.keys()].find((k) => k.endsWith('.mp3'))!;
    store.set(key, { body: Buffer.from('ID3\x03other'), type: 'audio/mpeg' });
    const r = await run(planPath, 'test', { profilesFile, execute: true, env, contentDir: content, receiptsDir: join(dir, 'receipts'), log: quiet });
    expect(r!.status).toBe('INCOMPLETE');
    expect(r!.failedObjects[0].error).toContain('not overwritten');
    expect(store.get(key)!.body.toString()).toContain('other');
  });
  it("the maintainers' private handoff format: inline credentials, shared storage needs --confirm, read-only verify", async () => {
    store.clear(); // the previous test left a different object under one key
    const { planPath } = setup();
    const handoff = join(dir, 'oss-profiles.private.json');
    const p = { storageTargetId: 'shared-resource-oss', endpoint, region: 'r', bucket: 'b', addressing: 'path', credentials: { type: 'existing-access-key', accessKeyId: 'test-id', accessKeySecret: SECRET } };
    writeFileSync(handoff, JSON.stringify({ format: 'rc-oss-private-handoff-1', sharedStorage: true, keyPolicyVersion: 'be-exam-existing-v1', profiles: { test: p, production: p } }));
    const o = { profilesFile: handoff, env: {}, contentDir: content, receiptsDir: join(dir, 'receipts'), log: quiet };
    await expect(run(planPath, 'test', { ...o, execute: true })).rejects.toThrow('storage shared with production');
    const lines: string[] = [];
    await run(planPath, 'test', { ...o, execute: false, verify: true, log: (l) => lines.push(l) });
    expect(lines.at(-1)).toBe('verify (read-only): 2 missing');
    const before = store.size;
    const r = await run(planPath, 'test', { ...o, execute: true, confirm: 'shared-resource-oss' });
    expect(r!.status).toBe('UPLOADED_VERIFIED');
    expect(r!.sharedStorage).toBe(true);
    expect(JSON.stringify(r)).not.toContain(SECRET);
    expect(before).toBe(0); // verify wrote nothing
    lines.length = 0;
    await run(planPath, 'test', { ...o, execute: false, verify: true, log: (l) => lines.push(l) });
    expect(lines.at(-1)).toBe('verify (read-only): 2 verified');
  });
  it('a file changed after freezing, or production without --confirm, stops before anything is sent', async () => {
    const { planPath, profilesFile } = setup();
    writeFileSync(join(content, 'assets/t/cover.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xe0, 9]));
    await expect(run(planPath, 'test', { profilesFile, execute: true, env, contentDir: content, log: quiet })).rejects.toThrow('changed since the plan was frozen');
    setup();
    await expect(run(planPath, 'production', { profilesFile, execute: true, env, contentDir: content, log: quiet })).rejects.toThrow('--confirm exam-materials-production');
  });
});
