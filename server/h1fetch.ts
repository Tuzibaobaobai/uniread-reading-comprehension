/**
 * POST over HTTP/1.1 with a keep-alive pool, for model providers.
 *
 * Node's built-in fetch (undici 7+, Node 24+) negotiates HTTP/2 and sends every request to a host over ONE connection.
 * Volcano Ark answers the streams of one connection one after another, so in a warm server process parallel judge calls
 * queued ~1–2 s apart: six learners submitting together waited 6–18 s, and the 7 s vocab meaning check timed out under
 * load (QA 2026-11-12). Separate HTTP/1.1 sockets are answered in parallel (measured: 6 calls in 1.1 s instead of 6 s).
 *
 * Same contract as fetch for the callers: resolves to a web `Response`; a timeout rejects with the signal's reason
 * (TimeoutError), a network failure with a TypeError — server/judge-core.ts `transportError` maps both.
 * When a test has replaced globalThis.fetch (vi.stubGlobal), that stub is used instead, so tests keep mocking fetch.
 */
import http from 'node:http';
import https from 'node:https';

const nativeFetch = globalThis.fetch;
const agents = {
  'https:': new https.Agent({ keepAlive: true, maxSockets: 64 }),
  'http:': new http.Agent({ keepAlive: true, maxSockets: 64 }),
};

export interface H1Init {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export function h1fetch(url: string, init: H1Init = {}): Promise<Response> {
  if (globalThis.fetch !== nativeFetch) return globalThis.fetch(url, init);
  const u = new URL(url);
  const mod = u.protocol === 'http:' ? http : https;
  return new Promise<Response>((resolve, reject) => {
    const signal = init.signal;
    if (signal?.aborted) return reject(signal.reason);
    const req = mod.request(
      u,
      { method: init.method ?? 'GET', headers: { ...(init.headers ?? {}), ...(init.body !== undefined ? { 'content-length': String(Buffer.byteLength(init.body)) } : {}) }, agent: agents[u.protocol as 'https:' | 'http:'] },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          signal?.removeEventListener('abort', onAbort);
          const headers = new Headers();
          for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
          const status = res.statusCode ?? 502;
          resolve(new Response(status === 204 || status === 304 ? null : Buffer.concat(chunks), { status, headers }));
        });
        res.on('error', fail);
      },
    );
    function fail(e: Error) {
      signal?.removeEventListener('abort', onAbort);
      reject(signal?.aborted ? signal.reason : new TypeError('fetch failed', { cause: e }));
    }
    function onAbort() {
      req.destroy();
      reject(signal!.reason);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    req.on('error', fail);
    req.end(init.body);
  });
}
