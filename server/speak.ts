/**
 * POST /api/rc/speak {itemId, questionId, turnId, audio (base64), mime} → {text}
 * Speech-to-text for one recorded answer in a speaking task (KET 口语). Only transcribes: the whole
 * exchange is scored afterwards by /api/rc/judge with the Cambridge speaking scale.
 * Provider (asrFromEnv): Azure AI Speech fast transcription when AZURE_SPEECH_KEY is set (AZURE_SPEECH_REGION, default
 * eastus, or AZURE_SPEECH_URL for the resource endpoint); otherwise SiliconFlow with SILICONFLOW_API_KEY (same as the judge)
 * and ASR_MODEL (default Qwen/Qwen3-ASR-1.7B: no errors, ~0.2 s in the #110 test; SenseVoice 1–4 %, ~2 s).
 * ASR_PROVIDER=azure|siliconflow forces one.
 */
import { allQuestions } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';

/** a 45-second answer in webm/opus or mp4/aac is well under this */
export const MAX_AUDIO_BYTES = 2_000_000;

/** the language the learner is expected to speak; providers that need a locale use it, others ignore it */
export type AsrLang = 'en' | 'zh';

export interface Asr {
  model: string;
  transcribe(audio: Buffer, mime: string, lang?: AsrLang): Promise<string>;
}

function audioExt(mime: string): string {
  return mime.includes('mp4') || mime.includes('aac') ? 'm4a' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
}

/** a recogniser call that timed out or never got through: 504 / 502 with a short message, not a raw 500 */
async function asrFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const name = (e as Error)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') throw new HttpError(504, 'speech recognition timed out');
    throw new HttpError(502, 'speech recognition unreachable');
  }
}

export function siliconFlowAsr(opts: { baseUrl: string; apiKey: string; model: string }): Asr {
  return {
    model: opts.model,
    async transcribe(audio, mime) {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(audio)], { type: mime }), `answer.${audioExt(mime)}`);
      form.append('model', opts.model);
      const res = await asrFetch(`${opts.baseUrl.replace(/\/$/, '')}/audio/transcriptions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${opts.apiKey}` },
        body: form,
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new HttpError(502, `asr ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = (await res.json()) as { text?: string };
      return (body.text ?? '').trim();
    },
  };
}

/**
 * Azure AI Speech fast transcription (synchronous, accepts webm/opus and mp4/aac as recorded by Chrome and Safari).
 * The locale is fixed per answer (en-US / zh-CN) so accented English is never identified as Chinese.
 */
export function azureAsr(opts: { endpoint: string; apiKey: string }): Asr {
  const url = `${opts.endpoint.replace(/\/$/, '')}/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;
  return {
    model: 'azure-fast-transcription',
    async transcribe(audio, mime, lang) {
      const form = new FormData();
      form.append('audio', new Blob([new Uint8Array(audio)], { type: mime }), `answer.${audioExt(mime)}`);
      form.append('definition', JSON.stringify(lang ? { locales: [lang === 'zh' ? 'zh-CN' : 'en-US'] } : {}));
      const res = await asrFetch(url, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': opts.apiKey },
        body: form,
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new HttpError(502, `asr ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = (await res.json()) as { combinedPhrases?: { text?: string }[] };
      return (body.combinedPhrases ?? []).map((p) => p.text ?? '').join(' ').trim();
    },
  };
}

export function asrFromEnv(env: Record<string, string | undefined> = process.env): Asr | null {
  const provider = env.ASR_PROVIDER ?? (env.AZURE_SPEECH_KEY ? 'azure' : 'siliconflow');
  if (provider === 'azure') {
    if (!env.AZURE_SPEECH_KEY) return null;
    return azureAsr({
      endpoint: env.AZURE_SPEECH_URL || `https://${env.AZURE_SPEECH_REGION || 'eastus'}.api.cognitive.microsoft.com`,
      apiKey: env.AZURE_SPEECH_KEY,
    });
  }
  if (!env.SILICONFLOW_API_KEY) return null;
  return siliconFlowAsr({
    baseUrl: env.JUDGE_BASE_URL ?? 'https://api.siliconflow.cn/v1',
    apiKey: env.SILICONFLOW_API_KEY,
    model: env.ASR_MODEL ?? 'Qwen/Qwen3-ASR-1.7B',
  });
}

export interface SpeakCall {
  itemId: string;
  questionId: string;
  turnId: string;
  audio: string;
  mime: string;
}

export async function speakCall(body: unknown, opts: { contentRoot?: string; asr: Asr | null }): Promise<{ text: string }> {
  const c = (body ?? {}) as Partial<SpeakCall>;
  if (typeof c.questionId !== 'string' || typeof c.turnId !== 'string' || typeof c.audio !== 'string') throw new HttpError(400, 'bad request');
  const { item } = await loadItem(c.itemId, opts.contentRoot);
  const q = allQuestions(item).find((x) => x.id === c.questionId);
  if (!q || q.interaction.kind !== 'speaking' || !q.interaction.turns.some((t) => t.id === c.turnId)) throw new HttpError(400, 'not a speaking turn');
  const audio = Buffer.from(c.audio, 'base64');
  if (!audio.length) throw new HttpError(400, 'empty audio');
  if (audio.length > MAX_AUDIO_BYTES) throw new HttpError(413, 'recording too long');
  if (!opts.asr) throw new HttpError(503, 'speech recognition not configured');
  const mime = typeof c.mime === 'string' && /^audio\/[\w.+-]+(;.*)?$/.test(c.mime) ? c.mime.split(';')[0] : 'audio/webm';
  // speaking tasks are answered in English
  return { text: await opts.asr.transcribe(audio, mime, 'en') };
}

// base64 grows the body by 4/3
export default jsonPost((body) => speakCall(body, { asr: asrFromEnv() }), Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 1000);
