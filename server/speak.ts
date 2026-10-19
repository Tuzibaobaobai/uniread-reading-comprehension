/**
 * POST /api/rc/speak {itemId, questionId, turnId, audio (base64), mime} → {text}
 * Speech-to-text for one recorded answer in a speaking task (KET 口语). Only transcribes: the whole
 * exchange is scored afterwards by /api/rc/judge with the Cambridge speaking scale.
 * API key: SILICONFLOW_API_KEY (same as the judge); model ASR_MODEL (default FunAudioLLM/SenseVoiceSmall).
 */
import { allQuestions } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';

/** a 45-second answer in webm/opus or mp4/aac is well under this */
export const MAX_AUDIO_BYTES = 2_000_000;

export interface Asr {
  model: string;
  transcribe(audio: Buffer, mime: string): Promise<string>;
}

export function siliconFlowAsr(opts: { baseUrl: string; apiKey: string; model: string }): Asr {
  return {
    model: opts.model,
    async transcribe(audio, mime) {
      const form = new FormData();
      const ext = mime.includes('mp4') || mime.includes('aac') ? 'm4a' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
      form.append('file', new Blob([new Uint8Array(audio)], { type: mime }), `answer.${ext}`);
      form.append('model', opts.model);
      const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/audio/transcriptions`, {
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

export function asrFromEnv(env: Record<string, string | undefined> = process.env): Asr | null {
  if (!env.SILICONFLOW_API_KEY) return null;
  return siliconFlowAsr({
    baseUrl: env.JUDGE_BASE_URL ?? 'https://api.siliconflow.cn/v1',
    apiKey: env.SILICONFLOW_API_KEY,
    model: env.ASR_MODEL ?? 'FunAudioLLM/SenseVoiceSmall',
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
  return { text: await opts.asr.transcribe(audio, mime) };
}

// base64 grows the body by 4/3
export default jsonPost((body) => speakCall(body, { asr: asrFromEnv() }), Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 1000);
