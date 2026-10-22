import { afterEach, describe, expect, it } from 'vitest';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import i18n, { applyExamLocale, normalizeLocale } from './index';

type Tree = { [k: string]: string | Tree };
const keys = (o: Tree, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));
const vars = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

describe('locale files (#106)', () => {
  const zh = keys(zhCN as Tree);
  const en = keys(enUS as Tree);
  it('zh-CN and en-US have the same key set', () => {
    expect(en.filter((k) => !zh.includes(k))).toEqual([]);
    expect(zh.filter((k) => !en.includes(k))).toEqual([]);
  });
  it('no empty strings and the same interpolation variables', () => {
    const get = (o: Tree, k: string) => k.split('.').reduce<string | Tree>((n, p) => (n as Tree)[p], o) as string;
    for (const k of zh) {
      expect(get(zhCN as Tree, k), k).not.toBe('');
      expect(get(enUS as Tree, k), k).not.toBe('');
      expect(vars(get(enUS as Tree, k)), k).toEqual(vars(get(zhCN as Tree, k)));
    }
  });
});

describe('normalizeLocale', () => {
  it('en* → en-US', () => {
    for (const raw of ['en', 'en-US', 'en-GB', 'EN', 'en_US', ' en-us ']) expect(normalizeLocale(raw)).toBe('en-US');
  });
  it('everything else (including empty) → zh-CN', () => {
    for (const raw of [undefined, '', 'zh', 'zh-CN', 'zh-TW', 'fr-FR', 'ja', 'xen']) expect(normalizeLocale(raw)).toBe('zh-CN');
  });
});

describe('applyExamLocale', () => {
  afterEach(() => applyExamLocale('zh-CN'));
  it('switches the language and falls back to zh-CN', async () => {
    expect(i18n.language).toBe('zh-CN');
    const t = await applyExamLocale('en-GB');
    expect(i18n.language).toBe('en-US');
    expect(t('exam.mode.practice')).toBe('Practice mode');
    await applyExamLocale('fr');
    expect(i18n.language).toBe('zh-CN');
    expect(i18n.t('exam.mode.practice')).toBe('练习模式');
  });
  it('plurals and interpolation', async () => {
    expect(i18n.t('reader.unansweredTitle', { count: 3 })).toBe('还有 3 题没有作答');
    await applyExamLocale('en-US');
    expect(i18n.t('reader.unansweredTitle', { count: 1 })).toBe('1 question not answered');
    expect(i18n.t('reader.unansweredTitle', { count: 3 })).toBe('3 questions not answered');
  });
});
