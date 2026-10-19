/**
 * Server side of the LLM judge (docs/09 §5): load item + key, build the request, call a model, validate.
 * Used by server/judge.ts (Vercel function, and Vite dev/preview middleware).
 *
 * Model providers (env):
 *   SiliconFlow (default when SILICONFLOW_API_KEY is set) — OpenAI-compatible chat completions, JSON mode
 *     SILICONFLOW_API_KEY, JUDGE_MODEL (default deepseek-ai/DeepSeek-V4.1-Flash), JUDGE_BASE_URL (default https://api.siliconflow.cn/v1)
 *   Anthropic — forced tool call
 *     ANTHROPIC_API_KEY, JUDGE_MODEL (default claude-sonnet-5-5)
 */
import { createHash } from 'node:crypto';
import type { JudgementT } from '@schema';
import { HttpError, loadItem } from './http';
import { allQuestions } from '../src/lib/grading';
import {
  CAMBRIDGE_PROMPT_VERSION,
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

export interface Llm {
  model: string;
  /** returns the raw structured output (parsed JSON) */
  complete(req: JudgeRequest): Promise<unknown>;
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
  const call = async (req: JudgeRequest, jsonMode: boolean) => {
    const { system, user } = buildJudgePrompt(req, 'json');
    const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      signal: AbortSignal.timeout(opts.timeoutMs ?? MODEL_TIMEOUT_MS),
      body: JSON.stringify({
        model: opts.model,
        temperature: 0,
        max_tokens: 1024,
        stream: false,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        // Cambridge marking (KET writing/speaking): no reasoning trace — 4–5 s instead of 10–35 s, same bands in tests
        // (SiliconFlow hybrid models); a provider that rejects the flag gets the plain request below
        ...(jsonMode && req.promptVersion === CAMBRIDGE_PROMPT_VERSION ? { enable_thinking: false } : {}),
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
    async complete(req) {
      let res = await call(req, true);
      // some models don't accept response_format (or enable_thinking): retry with the prompt-only JSON instruction
      if (res.status === 400) res = await call(req, false);
      if (!res.ok) throw new HttpError(502, `model ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content ?? '';
      return extractJson(text);
    },
  };
}

export function anthropicLlm(opts: { apiKey: string; model: string }): Llm {
  return {
    model: opts.model,
    async complete(req) {
      const { system, user } = buildJudgePrompt(req, 'tool');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': opts.apiKey, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
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
  const { item, key, playlist } = await loadItem(call.itemId, opts.contentRoot);
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
  let verdict: JudgementT;
  try {
    verdict = parseJudgement(await opts.llm.complete(req), req, opts.llm.model);
  } catch (e) {
    if (e instanceof HttpError) throw e;
    // malformed output: one retry
    verdict = parseJudgement(await opts.llm.complete(req), req, opts.llm.model);
  }
  if (cache.size > 500) cache.clear();
  cache.set(id, verdict);
  return verdict;
}
