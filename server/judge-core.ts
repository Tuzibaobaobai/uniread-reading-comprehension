/**
 * Server side of the LLM judge (docs/09 §5): load item + key, build the request, call a model, validate.
 * Used by server/judge.ts (Vercel function, and Vite dev/preview middleware).
 *
 * Model providers (env), first configured wins:
 *   Volcano Ark (server/ark.ts) — Responses API, JSON mode
 *     ARK_API_KEY, ARK_MODEL (default deepseek-v4-1-flash-261017), ARK_BASE_URL (default https://ark.cn-beijing.volces.com/api/v3)
 *   SiliconFlow (when SILICONFLOW_API_KEY is set) — OpenAI-compatible chat completions, JSON mode
 *     SILICONFLOW_API_KEY, JUDGE_MODEL (default deepseek-ai/DeepSeek-V4.1-Flash), JUDGE_BASE_URL (default https://api.siliconflow.cn/v1)
 *   Anthropic — forced tool call
 *     ANTHROPIC_API_KEY, JUDGE_MODEL (default claude-sonnet-5-5)
 */
import { createHash } from 'node:crypto';
import type { JudgementT } from '@schema';
import { HttpError, loadItem } from './http';
import { arkFromEnv, arkText, type ArkOpts } from './ark';
import { h1fetch } from './h1fetch';
import { allQuestions } from '../src/lib/grading';
import {
  JUDGE_OUTPUT_SCHEMA,
  buildJudgePrompt,
  buildJudgeRequest,
  parseJudgement,
  shortCircuit,
  type JudgeCall,
  type JudgeRequest,
} from '../src/lib/judge';

export { HttpError };

/** model call limit — KET writing/speaking judgements usually take ~10 s but sometimes 25 s+ (function maxDuration is 60 s) */
export const MODEL_TIMEOUT_MS = 45000;
/**
 * the whole judgement, retry included, must end inside the function's 60 s and before the browser gives up
 * (src/lib/judge.ts httpJudge, 55 s); a malformed reply is retried only while at least MIN_RETRY_MS of it is left
 */
export const JUDGE_BUDGET_MS = 50000;
const MIN_RETRY_MS = 8000;

export interface Llm {
  model: string;
  /** returns the raw structured output (parsed JSON); `timeoutMs` = time left for this call */
  complete(req: JudgeRequest, timeoutMs?: number): Promise<unknown>;
}

/** a model call that timed out or never reached the provider: not retried (it would bill twice and outlast the request) */
export function transportError(e: unknown): HttpError | null {
  if (e instanceof HttpError) return e;
  const name = (e as Error)?.name;
  if (name === 'TimeoutError' || name === 'AbortError') return new HttpError(504, 'judge model timed out');
  if (e instanceof TypeError) return new HttpError(502, 'judge model unreachable');
  return null;
}

/* ------------------------------------------------------------- providers */

/** pull a JSON object out of a chat reply (tolerates ```json fences / leading text) */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('no JSON object in model reply');
  return JSON.parse(body.slice(start, end + 1));
}

export function openAiCompatibleLlm(opts: { baseUrl: string; apiKey: string; model: string; timeoutMs?: number }): Llm {
  const call = async (req: JudgeRequest, jsonMode: boolean, timeoutMs = opts.timeoutMs ?? MODEL_TIMEOUT_MS) => {
    const { system, user } = buildJudgePrompt(req, 'json');
    const res = await h1fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: opts.model,
        temperature: 0,
        max_tokens: 1024,
        stream: false,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        // Cambridge marking (KET writing/speaking): no reasoning trace — 4–5 s instead of 10–35 s, same bands in tests
        // (SiliconFlow hybrid models); a provider that rejects the flag gets the plain request below
        // 中译英 (#125): one short sentence against reference translations — the same, without the long reasoning wait
        ...(jsonMode && quickTask(req) ? { enable_thinking: false } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    return res;
  };
  return {
    model: opts.model,
    async complete(req, timeoutMs) {
      const t0 = Date.now();
      let res = await call(req, true, timeoutMs);
      // some models don't accept response_format (or enable_thinking): retry with the prompt-only JSON instruction
      if (res.status === 400) res = await call(req, false, timeoutMs === undefined ? undefined : Math.max(1000, timeoutMs - (Date.now() - t0)));
      if (!res.ok) throw new HttpError(502, `model ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content ?? '';
      return extractJson(text);
    },
  };
}

/** Cambridge marking (KET writing/speaking) and 中译英 (#125): short tasks, no reasoning trace needed */
const quickTask = (req: JudgeRequest) => req.promptVersion.startsWith('cambridge-') || req.rubric.type === 'translation';

export function arkLlm(opts: ArkOpts & { timeoutMs?: number }): Llm {
  return {
    model: opts.model,
    async complete(req, timeoutMs) {
      const { system, user } = buildJudgePrompt(req, 'json');
      const noThinking = quickTask(req);
      const r = await arkText(opts, {
        system,
        user,
        json: true,
        noThinking,
        // a reasoning trace counts against the output budget
        maxTokens: noThinking ? 1024 : 4096,
        timeoutMs: timeoutMs ?? opts.timeoutMs ?? MODEL_TIMEOUT_MS,
      });
      if (!r.ok) throw new HttpError(502, `model ${r.status}: ${r.error}`);
      return extractJson(r.text);
    },
  };
}

export function anthropicLlm(opts: { apiKey: string; model: string }): Llm {
  return {
    model: opts.model,
    async complete(req, timeoutMs) {
      const { system, user } = buildJudgePrompt(req, 'tool');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': opts.apiKey, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(timeoutMs ?? MODEL_TIMEOUT_MS),
        body: JSON.stringify({
          model: opts.model,
          max_tokens: 1024,
          temperature: 0,
          system,
          tools: [{ name: 'record_judgement', description: 'Record the marking result.', input_schema: JUDGE_OUTPUT_SCHEMA }],
          tool_choice: { type: 'tool', name: 'record_judgement' },
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!res.ok) throw new HttpError(502, `model ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = (await res.json()) as { content: { type: string; input?: unknown }[] };
      const tool = body.content.find((c) => c.type === 'tool_use');
      if (!tool) throw new HttpError(502, 'no tool_use in model reply');
      return tool.input;
    },
  };
}

/** pick the provider from environment variables; null when no key is configured */
export function llmFromEnv(env: Record<string, string | undefined> = process.env): Llm | null {
  const ark = arkFromEnv(env);
  if (ark) return arkLlm(ark);
  if (env.SILICONFLOW_API_KEY) {
    return openAiCompatibleLlm({
      baseUrl: env.JUDGE_BASE_URL ?? 'https://api.siliconflow.cn/v1',
      apiKey: env.SILICONFLOW_API_KEY,
      model: env.JUDGE_MODEL ?? 'deepseek-ai/DeepSeek-V4.1-Flash',
    });
  }
  if (env.ANTHROPIC_API_KEY) return anthropicLlm({ apiKey: env.ANTHROPIC_API_KEY, model: env.JUDGE_MODEL ?? 'claude-sonnet-5-5' });
  return null;
}

/* ------------------------------------------------------------- judging */

const cache = new Map<string, JudgementT>();

export async function judgeCall(call: JudgeCall, opts: { contentRoot?: string; llm: Llm | null }): Promise<JudgementT> {
  if (!call || typeof call.questionId !== 'string') throw new HttpError(400, 'bad request');
  const { item, key, playlist } = await loadItem(call.itemId, opts.contentRoot, true);
  const q = allQuestions(item).find((x) => x.id === call.questionId);
  const k = key.answers[call.questionId];
  const judged = q?.interaction.kind === 'extendedText' || q?.interaction.kind === 'speaking';
  if (!q || !judged || !k || !('sampleAnswer' in k)) throw new HttpError(400, 'not a judged question');

  const req = buildJudgeRequest(item, q, k, String(call.response ?? ''), playlist.gradeBand);
  const rules = shortCircuit(req);
  if (rules) return rules;
  if (!opts.llm) throw new HttpError(503, 'judge model not configured');

  const id = createHash('sha256').update(JSON.stringify([item.status.version, req, opts.llm.model])).digest('hex');
  const hit = cache.get(id);
  if (hit) return hit;
  const llm = opts.llm;
  const started = Date.now();
  const left = () => JUDGE_BUDGET_MS - (Date.now() - started);
  const attempt = async () => {
    try {
      return parseJudgement(await llm.complete(req, Math.min(MODEL_TIMEOUT_MS, left())), req, llm.model);
    } catch (e) {
      throw transportError(e) ?? e;
    }
  };
  const once = async (): Promise<JudgementT> => {
    try {
      return await attempt();
    } catch (e) {
      // provider error, timeout or unreachable: no retry. Malformed output: one retry while there is time for it
      if (e instanceof HttpError || left() < MIN_RETRY_MS) throw e instanceof HttpError ? e : new HttpError(502, 'judge model reply unusable');
      try {
        return await attempt();
      } catch (e2) {
        throw e2 instanceof HttpError ? e2 : new HttpError(502, 'judge model reply unusable');
      }
    }
  };
  // every answer is marked once (decision 2026-11-12); Cambridge writing uses the writing model (llmFromEnv)
  const verdict = await once();
  if (cache.size > 500) cache.clear();
  cache.set(id, verdict);
  return verdict;
}
