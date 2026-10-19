/**
 * ContentProvider — the only way UI code loads content. Items/catalog are static JSON;
 * grading and keys come from the API (/api/rc/grade, /api/rc/judge) so answers are never published (docs/06).
 */
import { httpJudge, type JudgeProvider } from './judge';
import type { CatalogT, ItemKeyT, ItemT, PlaylistT } from '@schema';
import type { ResponseValue, Result } from './grading';

export interface ContentProvider {
  getCatalog(): Promise<CatalogT>;
  getPlaylist(id: string): Promise<PlaylistT>;
  getItem(id: string): Promise<ItemT>;
  /** grade a submission; the key is only revealed after submitting */
  grade(item: ItemT, responses: Record<string, ResponseValue>): Promise<{ result: Result; key: ItemKeyT }>;
  /** key for reviewing an already-submitted attempt (re-grades the saved responses) */
  getKey(item: ItemT, responses: Record<string, ResponseValue>): Promise<ItemKeyT>;
  /** LLM judge for constructed responses (docs/09); absent → learners self-assess */
  judge?: JudgeProvider;
  /** speech-to-text for one recorded speaking answer (exam 口语); absent → recording is not available */
  speak?(call: { itemId: string; questionId: string; turnId: string; audio: Blob }): Promise<string>;
  assetUrl(path: string): string;
}

const base = import.meta.env.BASE_URL;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

const cache = new Map<string, Promise<unknown>>();
function cached<T>(path: string): Promise<T> {
  if (!cache.has(path)) cache.set(path, getJson<T>(path).catch((e) => (cache.delete(path), Promise.reject(e))));
  return cache.get(path) as Promise<T>;
}

export const staticContent: ContentProvider = {
  getCatalog: () => cached<CatalogT>('catalog.json'),
  getPlaylist: (id) => cached<PlaylistT>(`playlists/${id}/playlist.json`),
  // <pl>-wNN-<day> (时文阅读) or <pl>-t<N>-<paper> (exam papers)
  getItem: (id) => cached<ItemT>(`playlists/${id.replace(/-w\d{2}-\w{3}$|-t\d+-(rw|l|s)$/, '')}/items/${id}.json`),
  async grade(item, responses) {
    const res = await fetch(`${base}api/rc/grade`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, responses }),
    });
    if (!res.ok) throw Object.assign(new Error(`grade ${res.status}`), { status: res.status });
    return res.json() as Promise<{ result: Result; key: ItemKeyT }>;
  },
  async getKey(item, responses) {
    return (await this.grade(item, responses)).key;
  },
  assetUrl: (path) => `${base}${path}`,
  // served by the Vercel function / UniRead, and by the Vite dev+preview middleware; unavailable → self-assessment
  judge: httpJudge(import.meta.env.VITE_JUDGE_URL ?? `${base}api/rc/judge`),
  async speak({ itemId, questionId, turnId, audio }) {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const res = await fetch(`${base}api/rc/speak`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ itemId, questionId, turnId, audio: btoa(bin), mime: audio.type }),
    });
    if (!res.ok) throw Object.assign(new Error(`speak ${res.status}`), { status: res.status });
    return ((await res.json()) as { text: string }).text;
  },
};
