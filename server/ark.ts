/**
 * Volcano Engine Ark (火山方舟) Responses API — the default model provider for the judge and the meaning check since the
 * SiliconFlow account ran out of balance (402, #147).
 *
 *   ARK_API_KEY   (required) — Vercel project env, Sensitive; .env.local for `npm run dev`
 *   ARK_MODEL     (optional) — default deepseek-v4-1-flash-261017 (the DeepSeek V4.1 Flash the judge used on SiliconFlow)
 *   ARK_BASE_URL  (optional) — default https://ark.cn-beijing.volces.com/api/v3
 */

import { h1fetch } from './h1fetch';

export const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
export const ARK_DEFAULT_MODEL = 'deepseek-v4-1-flash-261017';

export interface ArkOpts {
  baseUrl?: string;
  apiKey: string;
  model: string;
}

export interface ArkAsk {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
  /** ask for a JSON object (text.format json_object) */
  json?: boolean;
  /** no reasoning trace (short marking tasks: seconds instead of tens of seconds) */
  noThinking?: boolean;
}

/** one POST /responses; the student's text is not stored on Ark (store: false) */
export function arkRequest(opts: ArkOpts, ask: ArkAsk, plain = false): Promise<Response> {
  // HTTP/1.1 pool: Ark serialises the streams of one HTTP/2 connection (server/h1fetch.ts)
  return h1fetch(`${(opts.baseUrl ?? ARK_BASE_URL).replace(/\/$/, '')}/responses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
    signal: AbortSignal.timeout(ask.timeoutMs),
    body: JSON.stringify({
      model: opts.model,
      input: [
        { role: 'system', content: ask.system },
        { role: 'user', content: ask.user },
      ],
      temperature: 0,
      max_output_tokens: ask.maxTokens,
      stream: false,
      store: false,
      // a model that rejects one of these options gets the plain request (prompt-only JSON instruction)
      ...(!plain && ask.json ? { text: { format: { type: 'json_object' } } } : {}),
      ...(!plain && ask.noThinking ? { thinking: { type: 'disabled' } } : {}),
    }),
  });
}

/** the assistant text of a Responses API reply (skips reasoning items) */
export function arkOutputText(body: unknown): string {
  const b = body as { output_text?: string; output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
  if (typeof b.output_text === 'string' && b.output_text) return b.output_text;
  return (b.output ?? [])
    .filter((o) => o.type === 'message')
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === 'output_text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('');
}

/** request → text, retrying once without the JSON / thinking options on a 400 */
export async function arkText(opts: ArkOpts, ask: ArkAsk): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  let res = await arkRequest(opts, ask);
  if (res.status === 400 && (ask.json || ask.noThinking)) res = await arkRequest(opts, ask, true);
  if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 300) };
  return { ok: true, text: arkOutputText(await res.json()) };
}

export function arkFromEnv(env: Record<string, string | undefined>): ArkOpts | null {
  if (!env.ARK_API_KEY) return null;
  return { apiKey: env.ARK_API_KEY, model: env.ARK_MODEL ?? ARK_DEFAULT_MODEL, baseUrl: env.ARK_BASE_URL ?? ARK_BASE_URL };
}
