# 06 · UniRead 接入契约

v1 是独立静态站；数据与代码按“可直接接入 UniRead”设计。本文件定义接入时的契约。

## 1. 前端依赖的两个接口
```ts
// src/lib/content.ts
interface ContentProvider {
  getCatalog(): Promise<Catalog>;                 // playlists + item 摘要
  getPlaylist(id: string): Promise<Playlist>;
  getItem(id: string): Promise<Item>;             // 不含答案
  grade(itemId: string, responses: Responses): Promise<{ result: Result; key: ItemKey }>; // 提交后才返回答案与解析
}
// src/lib/storage.ts
interface AttemptStore {
  get(itemId: string): Attempt | null;
  save(attempt: Attempt): void;
  list(playlistId: string): Attempt[];
  clear(itemId: string): void;
}
```
- v1：`StaticContentProvider` 读 `content/` 静态 JSON，在前端判分；`LocalAttemptStore` 用 localStorage（key `uniread.rc.attempt.<itemId>`）
- UniRead：实现 `ApiContentProvider` / `ApiAttemptStore`，组件无需改动

## 2. 建议的 REST API
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/rc/catalog` | = `catalog.json` |
| GET | `/api/rc/playlists/:playlistId` | = `playlist.json` |
| GET | `/api/rc/items/:itemId` | = `items/<id>.json`（**不含** keys） |
| POST | `/api/rc/items/:itemId/attempts` | body: `{ responses, startedAt, durationSec }` → 服务端用 keys 判分（复用 `src/lib/grading.ts`），返回 `{ attempt, key }` |
| GET | `/api/rc/attempts?playlistId=` | 当前用户作答记录（列表页状态与得分） |
| PATCH | `/api/rc/attempts/:attemptId` | 自评结果 `selfAssessed`、进行中草稿 |

## 3. 答案安全
- `keys/` 不随前端部署；只在判分服务中加载
- 判分逻辑 `src/lib/grading.ts` 为纯函数，可直接在 Node 服务端运行

## 4. 学习记录（可选 xAPI）
| 事件 | verb | object | result |
|---|---|---|---|
| 打开 item | `launched` | item | – |
| 提交 | `completed` | item | `score.raw/max/scaled`、`duration` |
| 每题 | `answered` | `item#qid` | `success`、`response` |

## 5. 内容交付物
- `content/`（JSON + 图片）
- `schema/json/*.schema.json`（`npm run schema:export`）
- 可选：QTI 3.0 题包导出（后续）

## 6. 尚需 UniRead 确认
- 账号体系与 `learnerId`
- 难度体系映射（书中“难度 N 级” → UniRead `L` 等级 / Lexile）
- 内容版权授权
- 资源 CDN 路径
