import { afterEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { extractJson, judgeCall, llmFromEnv, openAiCompatibleLlm } from './judge-core';

const contentRoot = join(process.cwd(), 'content');
const modelReply = {
  keyPoints: [{ id: 'k1', met: 'yes' }, { id: 'k2', met: 'yes' }],
  score: 2, languageIssues: [], feedbackZh: '两个要点都答到了，很棒！', confidence: 0.9, flags: [],
};

afterEach(() => vi.unstubAllGlobals());

describe('judge-core', () => {
  it('extracts JSON from fenced / chatty replies', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure: {"a":{"b":2}} done')).toEqual({ a: { b: 2 } });
  });

  it('picks SiliconFlow DeepSeek by default when its key is set', () => {
    expect(llmFromEnv({ SILICONFLOW_API_KEY: 'x' })?.model).toBe('deepseek-ai/DeepSeek-V4.1-Flash');
    expect(llmFromEnv({})).toBeNull();
  });

  it('calls the OpenAI-compatible endpoint in JSON mode and validates the verdict', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(modelReply) } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const llm = openAiCompatibleLlm({ baseUrl: 'https://api.siliconflow.cn/v1', apiKey: 'sk-test', model: 'deepseek-ai/DeepSeek-V4.1-Flash' });
    const v = await judgeCall({ itemId: 'ci-g7-w01-fri', itemVersion: '1', questionId: 'q3', response: 'They lose water and absorb fat.' }, { contentRoot, llm });
    expect(v).toMatchObject({ score: 2, maxPoints: 2, needsReview: false, model: 'deepseek-ai/DeepSeek-V4.1-Flash' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.siliconflow.cn/v1/chat/completions');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ model: 'deepseek-ai/DeepSeek-V4.1-Flash', temperature: 0, response_format: { type: 'json_object' } });
    expect(body.messages[0].content).toContain('Return ONLY one JSON object');
    expect(body.messages[1].content).toContain('<student_answer>');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-test');
  });

  it('retries without response_format when the model rejects it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('unsupported', { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(modelReply) } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const llm = openAiCompatibleLlm({ baseUrl: 'https://x/v1', apiKey: 'k', model: 'm' });
    await judgeCall({ itemId: 'ci-g7-w01-fri', itemVersion: '1', questionId: 'q1', response: 'High calories and trans fats are bad for health.' }, { contentRoot, llm });
    expect(JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body))).not.toHaveProperty('response_format');
  });

  it('rejects unknown items and non-judged questions', async () => {
    await expect(judgeCall({ itemId: '../etc', itemVersion: '1', questionId: 'q1', response: 'x' }, { contentRoot, llm: null })).rejects.toMatchObject({ status: 400 });
    await expect(judgeCall({ itemId: 'ci-g7-w01-fri', itemVersion: '1', questionId: 'q7', response: 'x' }, { contentRoot, llm: null })).rejects.toMatchObject({ status: 400 });
  });
});
