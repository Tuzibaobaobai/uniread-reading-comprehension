import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { asrFromEnv, azureAsr, speakCall, type Asr } from './speak';

const root = join(import.meta.dirname, '..', 'content');
const asr: Asr = { model: 'mock', transcribe: async (audio, mime, lang) => `heard ${audio.length} bytes (${mime}, ${lang})` };
const call = { itemId: 'ket1-t1-s', questionId: 'q1', turnId: 't1', audio: Buffer.from('fake-audio').toString('base64'), mime: 'audio/webm;codecs=opus' };

describe('POST /api/rc/speak', () => {
  it('transcribes one turn of a speaking question', async () => {
    await expect(speakCall(call, { contentRoot: root, asr })).resolves.toEqual({ text: 'heard 10 bytes (audio/webm, en)' });
  });
  it('rejects turns that are not part of a speaking question, and missing ASR', async () => {
    await expect(speakCall({ ...call, turnId: 't99' }, { contentRoot: root, asr })).rejects.toMatchObject({ status: 400 });
    await expect(speakCall({ ...call, itemId: 'ket1-t1-rw' }, { contentRoot: root, asr })).rejects.toMatchObject({ status: 400 });
    await expect(speakCall(call, { contentRoot: root, asr: null })).rejects.toMatchObject({ status: 503 });
  });
});

describe('ASR providers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses Azure when its key is set, SiliconFlow otherwise, and ASR_PROVIDER can force one', () => {
    expect(asrFromEnv({ AZURE_SPEECH_KEY: 'a', SILICONFLOW_API_KEY: 's' })?.model).toBe('azure-fast-transcription');
    expect(asrFromEnv({ SILICONFLOW_API_KEY: 's' })?.model).toBe('Qwen/Qwen3-ASR-1.7B');
    expect(asrFromEnv({ AZURE_SPEECH_KEY: 'a', SILICONFLOW_API_KEY: 's', ASR_PROVIDER: 'siliconflow' })?.model).toBe('Qwen/Qwen3-ASR-1.7B');
    expect(asrFromEnv({ ASR_PROVIDER: 'azure', SILICONFLOW_API_KEY: 's' })).toBeNull();
    expect(asrFromEnv({})).toBeNull();
  });

  it('Azure: posts the audio with a fixed locale and joins the recognised text', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      new Response(JSON.stringify({ combinedPhrases: [{ text: 'I go to school by bus.' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const text = await azureAsr({ endpoint: 'https://eastus.api.cognitive.microsoft.com/', apiKey: 'k' }).transcribe(Buffer.from('x'), 'audio/mp4', 'en');
    expect(text).toBe('I go to school by bus.');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://eastus.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15');
    expect((init.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe('k');
    const form = init.body as FormData;
    expect(JSON.parse(form.get('definition') as string)).toEqual({ locales: ['en-US'] });
    expect((form.get('audio') as File).name).toBe('answer.m4a');
  });

  it('Azure: silence gives empty text, errors become 502', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ combinedPhrases: [] }), { status: 200 })));
    const azure = azureAsr({ endpoint: 'https://x', apiKey: 'k' });
    await expect(azure.transcribe(Buffer.from('x'), 'audio/webm', 'zh')).resolves.toBe('');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota', { status: 429 })));
    await expect(azure.transcribe(Buffer.from('x'), 'audio/webm', 'zh')).rejects.toMatchObject({ status: 502 });
    // QA 2026-11-12: a hanging recogniser was a raw 500
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(Object.assign(new Error('t'), { name: 'TimeoutError' }))));
    await expect(azure.transcribe(Buffer.from('x'), 'audio/webm', 'zh')).rejects.toMatchObject({ status: 504, message: 'speech recognition timed out' });
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))));
    await expect(azure.transcribe(Buffer.from('x'), 'audio/webm', 'zh')).rejects.toMatchObject({ status: 502 });
  });
});
