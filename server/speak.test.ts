import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { speakCall, type Asr } from './speak';

const root = join(import.meta.dirname, '..', 'content');
const asr: Asr = { model: 'mock', transcribe: async (audio, mime) => `heard ${audio.length} bytes (${mime})` };
const call = { itemId: 'ket1-t1-s', questionId: 'q1', turnId: 't1', audio: Buffer.from('fake-audio').toString('base64'), mime: 'audio/webm;codecs=opus' };

describe('POST /api/rc/speak', () => {
  it('transcribes one turn of a speaking question', async () => {
    await expect(speakCall(call, { contentRoot: root, asr })).resolves.toEqual({ text: 'heard 10 bytes (audio/webm)' });
  });
  it('rejects turns that are not part of a speaking question, and missing ASR', async () => {
    await expect(speakCall({ ...call, turnId: 't99' }, { contentRoot: root, asr })).rejects.toMatchObject({ status: 400 });
    await expect(speakCall({ ...call, itemId: 'ket1-t1-w' }, { contentRoot: root, asr })).rejects.toMatchObject({ status: 400 });
    await expect(speakCall(call, { contentRoot: root, asr: null })).rejects.toMatchObject({ status: 503 });
  });
});
