/** tiny helpers shared by the API handlers (Vercel functions + Vite dev/preview middleware) */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ItemKeyT, ItemT, PlaylistT } from '@schema';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** content/ next to the function (Vercel bundles it in) or at the project root (dev) */
export const contentRoot = () => join(process.cwd(), 'content');

const ID = /^[a-z0-9]+(-[a-z0-9]+)*-w\d{2}-(mon|tue|wed|thu|fri)$|^[a-z0-9]+-t\d+-(rw|r|w|l|s)$/;
/** item id → playlist folder: <pl>-wNN-<day> (时文阅读) or <pl>-t<N>-<paper> (exam papers) */
export const playlistOf = (itemId: string) => itemId.replace(/-w\d{2}-(mon|tue|wed|thu|fri)$|-t\d+-(rw|r|w|l|s)$/, '');

export async function loadItem(itemId: unknown, root = contentRoot()): Promise<{ item: ItemT; key: ItemKeyT; playlist: PlaylistT }> {
  if (typeof itemId !== 'string' || !ID.test(itemId)) throw new HttpError(400, 'bad itemId');
  const pl = playlistOf(itemId);
  const read = async <T>(p: string) => JSON.parse(await readFile(join(root, 'playlists', pl, p), 'utf8')) as T;
  try {
    const [item, key, playlist] = await Promise.all([
      read<ItemT>(`items/${itemId}.json`),
      read<ItemKeyT>(`keys/${itemId}.json`),
      read<PlaylistT>('playlist.json'),
    ]);
    return { item, key, playlist };
  } catch {
    throw new HttpError(404, 'unknown item');
  }
}

/** wrap a JSON POST handler: body parsing, size limit, error → status */
export function jsonPost(fn: (body: unknown) => Promise<unknown>, maxBytes = 50000) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader('content-type', 'application/json');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return send(405, { error: 'POST only' });
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > maxBytes) throw new HttpError(413, 'payload too large');
      }
      send(200, await fn(JSON.parse(raw || '{}')));
    } catch (e) {
      const status = e instanceof HttpError ? e.status : e instanceof SyntaxError ? 400 : 500;
      if (status >= 500) console.error(e);
      send(status, { error: (e as Error).message });
    }
  };
}
