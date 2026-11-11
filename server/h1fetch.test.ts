import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { h1fetch } from './h1fetch';

// a provider that takes 300 ms per request
let server: http.Server;
let url = '';
beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => setTimeout(() => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ echo: body })), req.url === '/slow' ? 2000 : 300));
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

describe('model calls over an HTTP/1.1 pool (QA 2026-11-12: Ark answered one HTTP/2 connection one stream at a time)', () => {
  it('six parallel calls run side by side and return a web Response', async () => {
    const t0 = Date.now();
    const all = await Promise.all(Array.from({ length: 6 }, (_, i) => h1fetch(`${url}/x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ i }) })));
    expect(Date.now() - t0).toBeLessThan(1200);
    expect(all.every((r) => r.ok)).toBe(true);
    expect(await all[3].json()).toEqual({ echo: '{"i":3}' });
  });
  it('a timeout rejects with the TimeoutError the judge maps to 504; no server is a TypeError (502)', async () => {
    await expect(h1fetch(`${url}/slow`, { method: 'POST', body: '{}', signal: AbortSignal.timeout(200) })).rejects.toMatchObject({ name: 'TimeoutError' });
    await expect(h1fetch('http://127.0.0.1:1/x', { method: 'POST', body: '{}' })).rejects.toBeInstanceOf(TypeError);
  });
});
