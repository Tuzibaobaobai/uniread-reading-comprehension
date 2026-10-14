/**
 * ContentProvider — the only way UI code loads content. v1 reads static JSON from content/
 * and grades in the browser; a UniRead implementation would call the API (docs/06).
 */
import type { CatalogT, ItemKeyT, ItemT, PlaylistT } from '@schema';
import { gradeItem, type ResponseValue, type Result } from './grading';

export interface ContentProvider {
  getCatalog(): Promise<CatalogT>;
  getPlaylist(id: string): Promise<PlaylistT>;
  getItem(id: string): Promise<ItemT>;
  /** grade a submission; the key is only revealed after submitting */
  grade(item: ItemT, responses: Record<string, ResponseValue>): Promise<{ result: Result; key: ItemKeyT }>;
  /** key for reviewing an already-submitted attempt */
  getKey(item: ItemT): Promise<ItemKeyT>;
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
  getItem: (id) => cached<ItemT>(`playlists/${id.replace(/-w\d{2}-\w{3}$/, '')}/items/${id}.json`),
  getKey: (item) => cached<ItemKeyT>(`playlists/${item.playlistId}/keys/${item.id}.json`),
  async grade(item, responses) {
    const key = await this.getKey(item);
    return { result: gradeItem(item, key, responses), key };
  },
  assetUrl: (path) => `${base}${path}`,
};
