# HANDOFF · RC 阅读理解模块 → UniRead 主平台

> 交接版本：`v0.4-handoff`（Git tag；按 UniRead 生产规约 [v0.6](docs/14-agent-production-rules.md)）。演示站：https://uniread-reading-comprehension.vercel.app
> 本文是入口，大约 15 分钟读完；细节都链接到已有文档，不在这里重复。

## 1. 这是什么

把《Current Insights 时文阅读｜提分训练3+X》练习册（扫描 PDF）转成可交互的阅读理解练习：左栏是文章，右栏是一题一页的作答区，提交后显示判分、解析和定位原文；开放问答题由 LLM 评分。适配 PC 与 iPad。

> **铁律：接入时必须还原 RC 的布局和交互。** 保留原页布局、字体、响应式与交互，只把数据、存储和通信换成平台适配；任何差异都算未完成，不能以“功能已通”验收（规约 v0.6 开头）。

主平台需要拿走的是：**页面源码**、**内容**、**数据格式**和**判分逻辑**。

| 拿走 | 位置 | 说明 |
| --- | --- | --- |
| 页面源码（原样还原） | `src/`（页面、交互）、`src/styles/`（token 与样式）、字体依赖 `@fontsource/*` | 构建 `npm ci && npm run build`；参考截图见 §5 |
| 内容包 | `content/` | 7 个合集共 540 篇：catalog、playlist、item、图片；答案键（keys）单独交付，见 §5 |
| 数据格式 | `schema/index.ts`（zod），JSON Schema 在 `schema/json/` | 题型按 1EdTech QTI 3.0 命名；题目与答案分离 |
| 判分逻辑 | `src/lib/grading.ts`（客观题）、`src/lib/judge.ts`（开放题 LLM 评分）、`server/*.ts`（参考服务端） | 都是纯函数，可直接在 Node 服务端运行 |
| 交互规范 | [docs/02](docs/02-question-types.md)、[docs/05](docs/05-ui-spec.md)；视觉见 [Figma 登记表](docs/design/figma-registry.md) | 每种题型的行为、复盘和响应式 |

**需要替换的适配层**（只换实现，不改页面）：
- `localStorage` 作答存储（`src/lib/storage.ts`）→ 平台作答保存
- `/api/rc/*` 原型接口 → 平台判分与评分接口
- 独立站路由和返回按钮 → 平台导航意图
- Vercel 部署脚本：不需要

## 2. 内容与状态

| 合集 | 原书 | 已做 | 答案来源 | 说明 |
| --- | --- | --- | --- | --- |
| `ci-g3` 3 年级 | 60 篇 | **60 篇（全书）** | official | 只经脚本核对 |
| `ci-g4` 4 年级 | 60 篇 | **60 篇（全书）** | official | 只经脚本核对 |
| `ci-g5` 5 年级 | 60 篇 | **60 篇（全书）** | official | 只经脚本核对；W12 Thu 原书一对多连线按每句一道单选呈现 |
| `ci-xsc3` 小升初（第 3 辑） | 90 篇 | **90 篇（全书）** | official | 只经脚本核对；取代旧版小升初 `ci-xsc`（已移除，ID 退役） |
| `ci-g7` 7 年级（第 3 辑） | 90 篇 | **90 篇（全书）** | official（答案册页码见 key） | 含句型转换、连词成句、LLM 评分；W2–W18 只经脚本核对 |
| `ci-g8` 8 年级（第 3 辑） | 90 篇 | **90 篇（全书）** | official | 只经脚本核对；含图片选项 |
| `ci-zk` 中考（第 3 辑） | 90 篇 | **90 篇（全书）** | official | 只经脚本核对 |

- **复核**：
  - 试点篇目经过 AI Agent 转录，再由另一个独立 Agent 对照页面图复核；全书批量生产的篇目（状态 `transcribed`）只经脚本核对（官方答案字母、OCR 文本覆盖、词数）。**都没有人工复核**。
  - 所有 key 都是 `reviewStatus: pending`，需要人工确认后才能视为批准。
- **完整清单**：[docs/handoff/production-handoff.rc-pilot-2026-10.md](docs/handoff/production-handoff.rc-pilot-2026-10.md)，按 UniRead 规约 [docs/14](docs/14-agent-production-rules.md) 填写。内容包括：
  - 大题与材料映射、元数据来源、资产和缩略图策略
  - key 位置与 sha256、源 PDF 摘要
  - 验证结果和阻塞项

## 3. 题型与平台适配

| 题型（interaction） | 学生回答形状 | 判分 | 平台 |
| --- | --- | --- | --- |
| 单选／判断 `choice`（选项可为图片 `Option.image`） | `["B"]` | 规则 | 可适配 single-selection |
| 完形 `inlineChoice` | 每空一题，`["A"]` | 规则 | 可适配，需逐题核对 |
| 共享词库 `gapMatch` | `{blankId: bankId}`，每项限用一次，移动时原子释放 | 规则，逐空计分 | 可适配 slot-selection |
| 文本填空 `textEntry` | `{blankId: "原始字符串"}` | 规则，逐空计分或整题计分（句型转换） | 待适配 |
| 连线 `match` | `{leftId: rightId}` | 规则，逐对计分 | 待适配 |
| 连词成句 `order` | `["w3","w1",…]` | 规则，可有多个正确顺序 | 待适配 |
| 开放问答 `extendedText` | `"原始文本"` | LLM 按要点评分；低置信度标“待老师确认” | 待适配，含评分服务 |

- 各题型的边界案例（未答、部分作答、清空、非法 ID、恢复）有对应测试：`src/lib/answer-semantics.test.ts`，规则写在 [docs/14 §7](docs/14-agent-production-rules.md)。
- 最后浏览位置记录的是 `questionId`，与学生回答分开保存。
- **小题 ID 是永久身份**，与展示题号分开（规约 §3.2）：同一道题保留 ID，新增或换题用从未用过的 ID，退役 ID 不复用。更新内容时用 `scripts/id-changes.ts` 对比上一版生成变更表；校验器已不再要求 `id = q{number}`。

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

**Release `v0.4-handoff` 附件**

| 文件 | 内容 |
| --- | --- |
| `rc-content-public.zip` | catalog、playlist、item、图片（**不含 keys**） |
| `MANIFEST.sha256` | 每个文件的 sha256 |
| `production-handoff.md` | 内容交接清单，即 §2 的完整文档（含稳定题目 ID 和布局还原两节） |
| `production-selection.<paperId>.json` | 机器选材清单（`rc-selection-2`），每份逻辑试卷一份 |
| `rc-reference-screens-<视口>.zip` | 布局还原基线：作答前的来源页面截图，按视口分 3 个包（desktop、ipad-landscape、ipad-portrait） |

**私有材料的交接流程**（答案键、提交后的复盘截图）

私有材料不作为 release 附件发布，平台开发直接从 GitHub 上同一个 tag 获取：

1. **答案键**（540 份）：在仓库 tag `v0.4-handoff` 的 `content/playlists/<合集>/keys/<itemId>.json`，与公开内容包里的 item 一一对应。
   ```bash
   git clone https://github.com/Tuzibaobaobai/uniread-reading-comprehension.git
   cd uniread-reading-comprehension && git checkout v0.4-handoff
   ls content/playlists/*/keys/*.json | wc -l      # 540
   npm ci && npm run validate                       # item 与 key 一致：0 error
   ```
   tag 对应固定提交，文件完整性以 Git 提交哈希为准，无需另外的校验清单。
2. **复盘截图**（提交后、显示答案，3 个视口共 1620 张）：在同一个 tag 下本地重新生成，内容与我方截图一致（像素可能因 Chrome 版本略有差异）。需要本机安装 Google Chrome。
   ```bash
   REFERENCE=1 npx playwright test e2e/reference.spec.ts
   # 作答前：.work/reference/public/<视口>/   复盘：.work/reference/private/<视口>/
   ```
3. **平台侧要求**：
   - key 只放在服务端，用于判分和提交后返回解析，不进入前端包、CDN 或公开接口（原型的做法见 §4）
   - 复盘截图只用于布局和交互验收，不对外分发

> ⚠️ **当前仓库是公开的**：上述答案键和原书内容实际上任何人都能看到。按产品决定暂不处理；正式上线前建议把仓库改为私有，或把 keys 移到只对平台开发开放的私有仓库。改为私有后，可改用 `node scripts/make-handoff-release.mjs <tag>` 生成的 `rc-keys-private.zip`、`rc-reference-review-private.zip` 作为 release 附件交付。

**本地验证**（Node ≥ 22）：

```bash
npm ci
npm run dev        # http://localhost:5173（判分与评分接口由 Vite 中间件提供；开放题评分需要环境变量 SILICONFLOW_API_KEY）
npm run validate   # 内容校验：540 篇，0 error
npm test           # 单元测试：判分、评分、答案语义、私有材料扫描
npm run e2e        # Playwright：桌面 / iPad 横屏 / iPad 竖屏
REFERENCE=1 npx playwright test e2e/reference.spec.ts   # 重新生成布局还原基线截图
```

## 6. 尚待决定或补齐

1. **账号与作答保存**：`learnerId`、服务端时间、真实提交接口（原型未实现）
2. **难度映射**：书中“难度 N 级”与 UniRead 等级／Lexile 的对应关系（本仓库未生成这两项）
3. **版权**：封面、配图、文本的使用许可待确认
4. **答案复核**：所有 key 待人工确认；原书与官方答案的疑似错误见 GitHub issue #14–#61（标签 `errata`），其中 7 题官方答案标“待复核”
5. **LLM 评分校准**：需要每本书 30–50 份教师评分样本，验收标准见 docs/09 §6
6. **待适配题型**：`textEntry`、`match`、`order`、`extendedText`
7. **布局还原验收**：平台容器与来源页面在相同内容、视口、作答和位置下的截图和交互对照（待平台）
8. **UI 组件**：Playlists 卡片、结果卡、对话框、填空输入、词库、连线等的 Figma 组件尚未提供（见登记表）

## 7. 联系与问题

问题和发现的差异请在 GitHub 提 Issue，加 `handoff` 标签；答复会同步更新到本文或相关文档。
