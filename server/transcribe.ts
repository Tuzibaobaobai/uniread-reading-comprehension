/**
 * POST /api/rc/transcribe {itemId, questionId, part, audio (base64), mime} → {text}
 * 词汇天天练 (#110): voice input for a Chinese meaning (wordProfile `zh`, wordFamily `f<n>.zh`) or a 中译英 answer
 * (`text`). Other answer parts are spelling practice and are typed. Same speech model and size limit as /api/rc/speak.
 */
import { isVocabDay } from '../schema/index';
import type { QuestionT } from '@schema';
import { allQuestions } from '../src/lib/grading';
import { HttpError, jsonPost, loadItem } from './http';
import { MAX_AUDIO_BYTES, asrFromEnv, type Asr } from './speak';

export function voiceAllowed(q: QuestionT, part: string): boolean {
  const it = q.interaction;
  if (it.kind === 'wordProfile') return part === 'zh';
  if (it.kind === 'wordFamily') return it.slots.some((s) => part === `${s.id}.zh`);
  return it.kind === 'extendedText' && part === 'text';
}

export async function transcribeCall(body: unknown, opts: { contentRoot?: string; asr: Asr | null }): Promise<{ text: string }> {
  const c = (body ?? {}) as { itemId?: unknown; questionId?: unknown; part?: unknown; audio?: unknown; mime?: unknown };
  if (typeof c.questionId !== 'string' || typeof c.part !== 'string' || typeof c.audio !== 'string') throw new HttpError(400, 'bad request');
  const { item } = await loadItem(c.itemId, opts.contentRoot, true);
  const q = isVocabDay(item) ? allQuestions(item).find((x) => x.id === c.questionId) : undefined;
  if (!q || !voiceAllowed(q, c.part)) throw new HttpError(400, 'voice input is not available for this answer');
  const audio = Buffer.from(c.audio, 'base64');
  if (!audio.length) throw new HttpError(400, 'empty audio');
  if (audio.length > MAX_AUDIO_BYTES) throw new HttpError(413, 'recording too long');
  if (!opts.asr) throw new HttpError(503, 'speech recognition not configured');
  const mime = typeof c.mime === 'string' && /^audio\/[\w.+-]+(;.*)?$/.test(c.mime) ? c.mime.split(';')[0] : 'audio/webm';
  return { text: await opts.asr.transcribe(audio, mime) };
}

export default jsonPost((body) => transcribeCall(body, { asr: asrFromEnv() }), Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 1000);
