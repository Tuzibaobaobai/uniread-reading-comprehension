# HANDOFF · RC 阅读理解模块 → UniRead 主平台

> 交接版本：`v0.1-handoff`（Git tag）。演示站：https://uniread-reading-comprehension.vercel.app
> 本文是入口，大约 15 分钟读完；细节都链接到已有文档，不在这里重复。

## 1. 这是什么

把《Current Insights 时文阅读｜提分训练3+X》练习册（扫描 PDF）转成可交互的阅读理解练习：左栏是文章，右栏是一题一页的作答区，提交后显示判分、解析和定位原文；开放问答题由 LLM 评分。适配 PC 与 iPad。

本仓库是**原型和内容来源**，不是生产前端。主平台需要的是下面三样东西：**内容**、**数据格式**和**判分逻辑**。页面可以照着做，也可以重写。

| 拿走 | 位置 | 说明 |
| --- | --- | --- |
| 内容包 | `content/` | 4 个合集共 20 篇：catalog、playlist、item、图片；答案键（keys）单独交付，见 §5 |
| 数据格式 | `schema/index.ts`（zod），JSON Schema 在 `schema/json/` | 题型按 1EdTech QTI 3.0 命名；题目与答案分离 |
| 判分逻辑 | `src/lib/grading.ts`（客观题）、`src/lib/judge.ts`（开放题 LLM 评分）、`server/*.ts`（参考服务端） | 都是纯函数，可直接在 Node 服务端运行 |
| 交互规范 | [docs/02](docs/02-question-types.md)、[docs/05](docs/05-ui-spec.md)；视觉见 [Figma 登记表](docs/design/figma-registry.md) | 每种题型的行为、复盘和响应式 |

**可以丢弃的**：
- `localStorage` 作答存储（`src/lib/storage.ts`）
- `/api/rc/*` 原型接口
- Vercel 部署脚本
- 独立站路由和返回按钮

## 2. 内容与状态

| 合集 | 原书 | 已做 | 答案来源 | 说明 |
| --- | --- | --- | --- | --- |
| `ci-g3` 3 年级 | 60 篇 | 8 篇 | generated（官方答案册在手，未逐题核对） | 题型覆盖试点 |
| `ci-xsc` 小升初 | 90 篇 | 6 篇 | generated | 题型覆盖试点 |
| `ci-g7` 7 年级（第 3 辑） | 90 篇 | 5 篇（第 1 周） | official（答案册页码见 key） | 含句型转换、连词成句、LLM 评分 |
| `ci-g5` 5 年级 | 60 篇 | 1 篇（W12 Thu） | official | 原书为一对多连线，按每句一道单选呈现 |

- **复核**：
  - 内容经过 AI Agent 转录，再由另一个独立 Agent 对照页面图复核，**没有人工复核**。
  - 所有 key 都是 `reviewStatus: pending`，需要人工确认后才能视为批准。
- **完整清单**：[docs/handoff/production-handoff.rc-pilot-2026-10.md](docs/handoff/production-handoff.rc-pilot-2026-10.md)，按 UniRead 规约 [docs/14](docs/14-agent-production-rules.md) 填写。内容包括：
  - 大题与材料映射、元数据来源、资产和缩略图策略
  - key 位置与 sha256、源 PDF 摘要
  - 验证结果和阻塞项

## 3. 题型与平台适配

| 题型（interaction） | 学生回答形状 | 判分 | 平台 |
| --- | --- | --- | --- |
| 单选／判断 `choice` | `["B"]` | 规则 | 可适配 single-selection |
| 完形 `inlineChoice` | 每空一题，`["A"]` | 规则 | 可适配，需逐题核对 |
| 共享词库 `gapMatch` | `{blankId: bankId}`，每项限用一次，移动时原子释放 | 规则，逐空计分 | 可适配 slot-selection |
| 文本填空 `textEntry` | `{blankId: "原始字符串"}` | 规则，逐空计分或整题计分（句型转换） | 待适配 |
| 连线 `match` | `{leftId: rightId}` | 规则，逐对计分 | 待适配 |
| 连词成句 `order` | `["w3","w1",…]` | 规则，可有多个正确顺序 | 待适配 |
| 开放问答 `extendedText` | `"原始文本"` | LLM 按要点评分；低置信度标“待老师确认” | 待适配，含评分服务 |

- 各题型的边界案例（未答、部分作答、清空、非法 ID、恢复）有对应测试：`src/lib/answer-semantics.test.ts`，规则写在 [docs/14 §7](docs/14-agent-production-rules.md)。
- 最后浏览位置记录的是 `questionId`，与学生回答分开保存。

## 4. 接入契约（主平台需要提供的）

完整说明见 [docs/06](docs/06-uniread-integration.md)，开放题评分见 [docs/09](docs/09-subjective-scoring.md)。前端只依赖两个接口：

- `ContentProvider`（`src/lib/content.ts`）：取 catalog、playlist、item；提交判分；开放题评分
- `AttemptStore`（`src/lib/storage.ts`）：读写作答记录

原型接口与主平台的对应关系：

| 原型 | 主平台对应 | 请求 → 响应 |
| --- | --- | --- |
| 静态文件 `catalog.json`、`playlists/<pl>/items/<id>.json` | 内容接口 | item **不含**答案 |
| `POST /api/rc/grade` | 提交并判分 | `{itemId, responses}` → `{result, key}`；key 只在提交后返回 |
| `POST /api/rc/judge` | 开放题评分（调用平台的大模型） | `{itemId, itemVersion, questionId, response}` → `Judgement`（分数、要点、反馈、置信度、needsReview） |
| `localStorage` | 学生作答与位置保存 | `Attempt` 结构见 schema |

- **服务端复用**：判分直接复用 `gradeItem()`；开放题按 `buildJudgeRequest → buildJudgePrompt → 平台 LLM（结构化输出）→ parseJudgement → applyJudgement` 的顺序调用。参考实现见 `server/judge-core.ts`。
- **答案安全**：
  - keys 只放在服务端。
  - 原型的构建产物会删除 keys，并扫描公开文件中是否出现解析或参考答案文本（`server/private-check.ts`），发现即构建失败。
- **模型**：演示站用 SiliconFlow 的 `deepseek-ai/DeepSeek-V4.1-Flash`，密钥只存在于 Vercel 环境变量中。提示版本 `rc-judge-v3`，规则见 docs/09。

## 5. 交付物与验证

**Release `v0.1-handoff` 附件**

| 文件 | 内容 |
| --- | --- |
| `rc-content-public.zip` | catalog、playlist、item、图片（**不含 keys**） |
| `MANIFEST.sha256` | 每个文件的 sha256 |
| `production-handoff.md` | 内容交接清单，即 §2 的完整文档 |

答案键 `rc-keys-private.zip` 由内容负责人通过受控渠道单独提供，不放进 release。

**本地验证**（Node ≥ 22）：

```bash
npm ci
npm run dev        # http://localhost:5173（判分与评分接口由 Vite 中间件提供；开放题评分需要环境变量 SILICONFLOW_API_KEY）
npm run validate   # 内容校验：20 篇，0 error
npm test           # 单元测试：判分、评分、答案语义、私有材料扫描
npm run e2e        # Playwright：桌面 / iPad 横屏 / iPad 竖屏
```

## 6. 尚待决定或补齐

1. **账号与作答保存**：`learnerId`、服务端时间、真实提交接口（原型未实现）
2. **难度映射**：书中“难度 N 级”与 UniRead 等级／Lexile 的对应关系（本仓库未生成这两项）
3. **版权**：封面、配图、文本的使用许可待确认
4. **答案复核**：所有 key 待人工确认；3 年级按官方答案册核对；小升初还有 3 题存疑（见交接清单）
5. **LLM 评分校准**：需要每本书 30–50 份教师评分样本，验收标准见 docs/09 §6
6. **待适配题型**：`textEntry`、`match`、`order`、`extendedText`
7. **UI 组件**：Playlists 卡片、结果卡、对话框、填空输入、词库、连线等的 Figma 组件尚未提供（见登记表）

## 7. 联系与问题

问题和发现的差异请在 GitHub 提 Issue，加 `handoff` 标签；答复会同步更新到本文或相关文档。
