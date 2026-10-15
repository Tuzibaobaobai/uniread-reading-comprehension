/**
 * POST /api/rc/judge — LLM judge for constructed responses (docs/09 §5).
 * API key: SILICONFLOW_API_KEY in the Vercel project's Environment Variables.
 */
import { judgeCall, llmFromEnv } from './judge-core';
import { jsonPost } from './http';
import type { JudgeCall } from '../src/lib/judge';

export default jsonPost((body) => judgeCall(body as JudgeCall, { llm: llmFromEnv() }));
