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
- 当前：`staticContent` 从静态文件读取 catalog、playlist 和 item；**判分与答案走 API**（`POST /api/rc/grade`、`POST /api/rc/judge`，由 Vercel 函数 `server/*.ts` 提供，开发和预览时由 Vite 中间件提供）。`LocalAttemptStore` 用 localStorage（key `uniread.rc.attempt.<itemId>`）
- UniRead：实现 `ApiContentProvider` / `ApiAttemptStore`，组件无需改动

## 2. 建议的 REST API
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/rc/catalog` | = `catalog.json` |
| GET | `/api/rc/playlists/:playlistId` | = `playlist.json` |
| GET | `/api/rc/items/:itemId` | = `items/<id>.json`（**不含** keys） |
| POST | `/api/rc/grade`（当前实现） | body: `{ itemId, responses }` → `{ result, key }`；服务端判分，答案和解析只在提交后通过该接口返回 |
| POST | `/api/rc/items/:itemId/attempts` | body: `{ responses, startedAt, durationSec }` → 服务端用 keys 判分（复用 `src/lib/grading.ts`），返回 `{ attempt, key }` |
| GET | `/api/rc/attempts?playlistId=` | 当前用户作答记录（列表页状态与得分） |
| PATCH | `/api/rc/attempts/:attemptId` | 自评结果 `selfAssessed`、进行中草稿 |
| POST | `/api/rc/judge` | 主观题 LLM 评分：`{ itemId, itemVersion, questionId, response }` → `Judgement`；服务端读取 keys，调用 UniRead 大模型 API。契约、提示和校准见 [09](09-subjective-scoring.md) |

## 3. 答案安全
- `keys/` 不随前端部署：构建时由 `vite.config.ts` 的 `rc-api` 插件从 `dist/` 删除，开发服务器对 `/playlists/*/keys/*` 返回 404；`scripts/vercel-functions.mjs` 若在静态产物中发现 keys 会拒绝部署。keys 只打包进服务端函数
- 注意：在此之前的历史部署（带 hash 的独立 URL）仍包含 keys，可在 Vercel 控制台删除旧部署
- 判分逻辑 `src/lib/grading.ts` 与 `src/lib/judge.ts`（主观题请求、提示、校验）为纯函数，可直接在 Node 服务端运行；参考实现见 `server/grade.ts`、`server/judge.ts`

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
