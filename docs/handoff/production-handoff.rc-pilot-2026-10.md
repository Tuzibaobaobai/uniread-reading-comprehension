# 本次生产交接 · RC 试点（rc-pilot-2026-10）

> 配套规约：[`14-agent-production-rules.md`](../14-agent-production-rules.md) v0.3；模板：[`14-production-handoff.template.md`](../14-production-handoff.template.md)。本文是给人和 Agent 读的附录，不是平台 API JSON。
> 只引用私有答案的位置和摘要，不粘贴答案、密钥或带 Token 的链接。

## 本次交付范围

- **任务／来源项目**：UniRead 阅读理解（RC）原型仓库 `Tuzibaobaobai/uniread-reading-comprehension`
- **规约版本与项目依据**：
  - 规约 v0.3
  - Schema `schema/index.ts`（zod，`SCHEMA_VERSION` 1.0）
  - 内容流程 `docs/04-content-pipeline.md`
  - 题型 `docs/02-question-types.md`；主观题 `docs/09-subjective-scoring.md`
  - 无缺失项
- **交付类型**：**试点选材**。不是整卷，也不是完整书籍目录
- **来源 revision**：交接时 `main` 分支（本文与内容同一提交）。每个 item 的 `status.version` 均为 1.0.0
- **原书总量／已生产／本次交付**：

  | 合集 | 原书 | 已生产 = 本次交付 |
  | --- | --- | --- |
  | ci-g3 | 60 篇 | 8 篇 |
  | ci-xsc | 90 篇 | 6 篇 |
  | ci-g7 | 90 篇 | 5 篇（Week 1 Mon–Fri） |
  | ci-g5 | 60 篇 | 1 篇（Week 12 Thu，原书“一对多连线”，按产品决定每句一道单选，issue #13） |
- **paperId（稳定逻辑标识，不是平台 DB ID）**：
  - `ci-g3.pilot-1`：W1 Mon–Fri、W2/W3/W4 Thu，覆盖题型的选材
  - `ci-xsc.pilot-1`：6 篇题型代表
  - `ci-g7.w01`：7 年级第 1 周
  - `ci-g5.pilot-1`：5 年级 W12 Thu 一篇
  - 同一逻辑试卷不因样式修改而换 ID
- **标题／简介／语言**：见各合集 `playlist.json` 的 `title`、`shortTitle`、`description`；语言 `en`，界面中文
- **适用学校年级**：`gradeBand` 取自书名，分别为 G3、G5、小升初（G6）、G7。是学校年级，**不等于** UniRead L 等级
- **原书难度量表**：书中信息框的“难度 N 级”（1–5），量表由出版方定义。**不等同** UniRead 等级或 Lexile，本次不生成这两项
- **词数／建议用时**：取自原书信息框。词数为出版方标注，统计范围按原书（正文）。缺原书值的单独标“估算”及方法（见下表）

## 大题与共享材料映射

- 每个 Section 即一个大题资源（`resourceId = <itemId>.<sectionId>`）。文章是共享材料（`materialId = <itemId>.article`），同一 item 的各大题共用；统计词数时按材料去重。
- **共享 bank**：只出现在共享词／句库（`gapMatch`）大题中，作用域就是该大题（section），不跨资源。每项限用一次。把已用词条填到别的空时，在**同一次更新**中从原空释放并填入新空（`setResponses` 一次提交），不会出现只保存一半的情况。
- **拆合与重排**：本次没有拆合或重排，不适用旧新映射。所有 Item／Section／Question／blank／选项／词块 ID 均为首次发布值。
- **顺序与分值**：顺序为 item `order`（周→日）加 section 顺序。分值为题目 `points`：
  - 默认每小题 1 分
  - 连线题 = 配对数
  - 7 年级回答问题 = 要点数（1–2）
  - 题号是展示用编号，不是身份

## 封面、缩略图与依赖

| 使用位置 | 文件相对路径／策略 | 来源／版权说明 | 是否实际交付 | 未完成项 |
| --- | --- | --- | --- | --- |
| 合集封面 | `content/assets/<pl>/cover.jpg`（各合集一张） | 书籍封面扫描；版权归出版方，使用许可**待确认** | 是 | 授权待确认 |
| 各大题缩略图 | 有原书配图的用独立文件（`thumbnail`，裁自原书）；无配图的用平台占位（RC 以标题生成文字卡），见下方逐篇表 | 同上 | 有图者已交付 | 无图题未强行裁图 |
| 文章配图 | `content/assets/<pl>/<itemId>-N.jpg` | 裁自原书扫描页 | 是 | 授权待确认 |

- **音视频**：不含。`hasVideo: true` 只是原书标记（书上印有“本篇配视频讲解课程”），本次**没有**交付视频。
- **字体**：自托管 `@fontsource/source-sans-3`、`@fontsource/noto-sans-sc`，随构建打包，无外链。
- **接口**（RC 原型适配器，**不是** UniRead 保存接口）：
  - `POST /api/rc/grade`：客观题判分；提交后返回 key
  - `POST /api/rc/judge`：开放问答的 LLM 评分
  - 作答保存在浏览器 localStorage
- **模型**：SiliconFlow `deepseek-ai/DeepSeek-V4.1-Flash`。密钥只在 Vercel 环境变量中，代码与文档不含密钥。
- **构建**：
  - 环境：Node ≥ 22
  - 命令：`npm ci && npm run build`，入口 `index.html`
  - 服务端函数：`server/grade.ts`、`server/judge.ts`，由 `scripts/vercel-functions.mjs` 打包
  - 依赖：见 `package.json`
- 不提供签名 URL、Token、本机绝对路径或 OSS 对象键。

## 来源、版权和私有答案

- **PDF 与页面图**：PDF 不在仓库内（`.gitignore`），存放于本地受控目录 `articles/`。页面图由 `scripts/render.swift` 生成到 `.work/pages/<pl>/p###.jpg`，可重新生成。

  | 文件 | sha256（前 12 位） | 大小（字节） |
  | --- | --- | --- |
  | 小学英语时文阅读提分训练3+X3年级.pdf | fc2760d0abdc | 131884741 |
  | 小学英语时文阅读提分训练3+X3年级答案.pdf | ede23ae14c06 | 62232994 |
  | ssp时文 小升初.pdf | 5fba7349a7b7 | 471662424 |
  | 初一第3辑初中时文阅读提分训练3+X第3辑7年级.pdf | 60e76ae2bdb1 | 239706499 |
  | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf | 90ab3ef47d06 | 116462838 |
  | 小学英语时文阅读提分训练3+X5年级.pdf | c8f641ffd7c3 | 152532965 |
  | 小学英语时文阅读提分训练3+X5年级答案.pdf | ea1d40b23853 | 74825195 |
- **页码映射**：逐书核对过目录页和正文页。
  - ci-g3：书页 N = PDF p(N+9)
  - ci-xsc：书页 N = PDF p(N+8)
  - ci-g7：书页 N = PDF p(N+9)，依据为 Week 1 Monday 位于书页 1 = PDF p010
  - ci-g5：书页 N = PDF p(N+9)，依据为 W12 Thu 位于书页 97 = PDF p106
  - 答案册页码按 PDF 页记录（`officialRef.pages`）
- **书名、编者、出版社**：Current Insights 时文阅读 提分训练3+X，上海学生英文报 编，华东理工大学出版社。
  - 7 年级为第 3 辑，2026 年 5 月第 1 版（CIP 页）
  - 3 年级、5 年级、小升初的版次**待补**
  - 作者为“编者”，个人作者未知
- **版权**：**待确认**。书名和出版社信息不等于已获使用许可。
- **私有 Key**：
  - 位置：`content/playlists/<pl>/keys/<itemId>.json`，每个文件的 sha256 见下方各合集表
  - 静态站构建时删除 keys，并扫描公开产物中是否出现解析或参考答案文本（`server/private-check.ts`，发现即构建失败）
  - 浏览器只在提交后通过判分接口拿到 key
  - 交付时 keys 应单独受控交付
- **答案来源**：
  - ci-g7、ci-g5：**official**，出处为答案册的 PDF 页
  - ci-g3、ci-xsc：**generated**。3 年级答案册已在手，但尚未逐题核对，**待补**
- **内容复核**：
  - 对象：上述 20 个 item 的 v1.0.0
  - 方法：先由转录 Agent 依据页面图逐字转录，再由另一个独立的 Claude Agent 对照页面图逐项复核（标题、信息框、正文、高亮、括注、题干、选项、空格编号），`npm run validate` 0 error
  - **结论**：`status.content = reviewed`，表示 AI Agent 复核，**没有人工复核**
- **答案复核**：
  - ci-g7：复核 Agent 独立作答并与官方答案逐题比对，结果一致（1 处解析措辞已修正）
  - ci-g5：复核 Agent 独立作答与官方答案一致；补充了第 5 句解析和配图 alt 文本
  - ci-g3、ci-xsc：由生成 Agent 加复核 Agent 完成，3 题仍有疑问（见阻塞清单）
  - 所有 key `reviewStatus = pending`：Agent 自检不算批准，需要人工确认
- **平台状态**：不填写“UniRead 已审批／已发布”。Vercel 站点 uniread-reading-comprehension.vercel.app 是 RC 原型演示，不是 UniRead 发布。

## 每类交互与验证

| 题型／小题 | 原始回答形状 | 清空／部分草稿／共享约束 | 私有评分规则位置 | 本地案例／证据 | 平台已验证或待适配 |
| --- | --- | --- | --- | --- | --- |
| 单选／判断 `choice` | `["B"]`（选项 ID，基数 1） | 未答 = 无记录；可改选，不能清空回未答；非法 ID 或多选判错，不报错 | key `correct` | `src/lib/answer-semantics.test.ts`（single choice） | 可适配 single-selection |
| 完形 `inlineChoice` | 每空一题 `["A"]`；空格归属 `blankId` | 同单选；点文中空格切到对应题 | key `correct` | 同上；e2e `flow.spec.ts` cloze | 可适配，需逐题核对 |
| 共享词库 `gapMatch` | `{blankId: bankId}` | 部分草稿逐空计分；同一词条只占一个空，移动时原子释放旧空；非法 bank／blank ID 不得分 | key `correct`（按空格顺序） | answer-semantics（shared word bank）；e2e word bank | 可适配 slot-selection |
| 文本填空 `textEntry` | `{blankId: "原始字符串"}`（不改写） | 空串／空白 = 未答；首字母提示不属于学生回答（判分时拼接）；`scoring: perBlank`（默认）或 `all`（句型转换整题计分） | key `slots[].accept` | answer-semantics（text entry）；e2e table fill、句型转换 | 待平台适配 |
| 连线 `match` | `{leftId: rightId}` | 一对一，重配时释放原配对；部分配对按对计分；不存坐标 | key `pairs` | answer-semantics（match）；e2e matching | 待平台适配 |
| 一对多连线（原书题型）→ 每句一道单选 `choice` | `["B"]`（每题一个类别选项 ID） | 同单选；7 道题分页，每题单独反馈和定位原文（精确到对应的那一行） | key `correct`（每题） | e2e “一对多连线：每句一题” | 可适配 single-selection（产品决定按单选呈现，原书为一对多连线） |
| 连词成句 `order` | `["w10","w8",…]`（词块 ID 顺序；标点 `ending` 固定） | 部分草稿 = 未答、0 分；撤回词块回到词池；重复文本靠 ID 区分；可有多个正确顺序（`sequences`） | key `sequence`／`sequences` | answer-semantics（order）；e2e 连词成句 | 待平台适配 |
| 开放问答 `extendedText` | `"原始文本"` | 判分流程 `pending` → `judge`（LLM，按要点给分，低置信度待老师确认）→ 失败时退回 `self`（学生自评，**不计分**） | key `sampleAnswer`、`keyPoints`、`match`、`rubricType` | `src/lib/judge.test.ts`、`server/judge-core.test.ts`；e2e 评分与退回 | 待平台适配（含评分服务） |

- **最后浏览位置**：保存为 questionId，与回答分开，未答题也能作为恢复点（`src/lib/storage.ts`）。验证：e2e `restore: answers and the last viewed (unanswered) question survive a reload`。
- **已运行的检查**（2026-10-18，本机）：
  - `npm run validate`：20 个 item，0 error、3 warning。三个 warning 都是词表词条在正文中没有高亮，忠于原书：`ci-g3-w01-fri` 的 v-green、`ci-g3-w01-wed` 的 v-pet、`ci-g5-w12-thu` 的 v-growth（只出现在标题和彩色小标题中）
  - `npm test`：40 项通过
  - `npm run e2e`：90 项通过，覆盖 desktop 1440×900、iPad 横屏、iPad 竖屏
  - `npm run build`：通过，含私有材料扫描
- **未运行**：UniRead 平台接入验证、真实学生作答保存、平台提交评分（均不在本仓库能力范围）；LLM 评分与教师评分的一致性校准（无金标集，见 docs/09 §6）。
- **阻塞／待补／待确认**：
  1. 封面、配图和文本的版权使用许可：待确认
  2. ci-g3 的 8 篇按 3 年级官方答案册逐题核对，改为 official：待补
  3. ci-xsc 复核遗留：w10-thu q1（B/C）、w17-fri 连线 3-D、w12-thu b3 只接受 “distances”：待人工确认
  4. 所有 key 和内容的人工复核：待人工
  5. textEntry、match、order、extendedText 的平台适配，以及 LLM 评分的金标校准：待平台／待数据
  6. 3 年级、小升初的出版版次：待补
  7. 5 年级其余 59 篇：不在本次范围（本次只做一对多连线样例）

## 附：由内容生成的清单

由 `npx tsx scripts/handoff-inventory.ts ci-g3 ci-xsc ci-g7 ci-g5` 生成；内容变更后重新生成。

### ci-g3 · 小学英语时文阅读｜提分训练3+X｜3年级

- 合集封面：`assets/ci-g3/cover.jpg`（书籍封面扫描，sha256:7c1a05d3652b）；gradeBand：G3（学校年级，不等于 UniRead L 等级）；本次交付 8 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-g3-w01-mon.s1` | Tiny “Embryos” Begin Space Test · Choose the best answer. | `ci-g3-w01-mon` | `s1` | `ci-g3-w01-mon.article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 2 | `ci-g3-w01-tue.s1` | Kids Find Maths and Magic in Flowers · Choose the best answer. | `ci-g3-w01-tue` | `s1` | `ci-g3-w01-tue.article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 3 | `ci-g3-w01-wed.s1` | Pets Are Part of the Family! · Choose the best answer to complete the passage. | `ci-g3-w01-wed` | `s1` | `ci-g3-w01-wed.article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 4 | `ci-g3-w01-thu.s1` | Little Beads, Big Fun · Choose the proper words to complete the following passage. | `ci-g3-w01-thu` | `s1` | `ci-g3-w01-thu.article`（1 个大题共用） | q1–q6／6 | 6 | 共享词／句库 | 本大题内 8 项供 6 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-g3-w01-fri.s1` | Going GREEN · I. Choose the words or phrases to fill in the blanks. | `ci-g3-w01-fri` | `s1` | `ci-g3-w01-fri.article`（2 个大题共用） | q1–q3／3 | 3 | 共享词／句库 | 本大题内 4 项供 3 空，每项限用一次，改选即从原空释放 |
| 6 | `ci-g3-w01-fri.s2` | Going GREEN · II. Choose the correct answer. | `ci-g3-w01-fri` | `s2` | `ci-g3-w01-fri.article`（2 个大题共用） | q4–q6／3 | 3 | 单选 | — |
| 7 | `ci-g3-w02-thu.s1` | Shakira Sings New World Cup Song · Fill in each blank in the article with a proper sentence given below. Each sentence can be used only once. Note that there are two more sentences than you will need. | `ci-g3-w02-thu` | `s1` | `ci-g3-w02-thu.article`（1 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 6 项供 4 空，每项限用一次，改选即从原空释放 |
| 8 | `ci-g3-w03-thu.s1` | Please Come Out, Groundhog! · Please match the characters on the left with their respective words on the right based on the passage. | `ci-g3-w03-thu` | `s1` | `ci-g3-w03-thu.article`（1 个大题共用） | q1–q1／1 | 4 | 连线 | — |
| 9 | `ci-g3-w04-thu.s1` | Playing With Buildings · Decide if the following statements are True (T) or False (F) according to the text. | `ci-g3-w04-thu` | `s1` | `ci-g3-w04-thu.article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-g3-w01-mon` | 10／1 | 4（原书） | 126（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w01-tue` | 11,12／2,3 | 3（原书） | 129（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w01-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w01-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w01-wed` | 13／4 | 2（原书） | 114（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w01-thu` | 14／5 | 2（原书） | 124（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w01-thu-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w01-thu-1.jpg`（裁自原书图片） |
| `ci-g3-w01-fri` | 15,16／6,7 | 2（原书） | 104（原书信息框） | 8 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w01-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w01-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w02-thu` | 21／12 | 3（原书） | 124（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w03-thu` | 28／19 | 4（原书） | 175（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w04-thu` | 36／27 | 3（原书） | 129（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-g3-w01-mon` | `content/playlists/ci-g3/keys/ci-g3-w01-mon.json` | e27ad3f3cf2a | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w01-tue` | `content/playlists/ci-g3/keys/ci-g3-w01-tue.json` | 29a8dd49e173 | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w01-wed` | `content/playlists/ci-g3/keys/ci-g3-w01-wed.json` | 6d9f2cb0aabb | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w01-thu` | `content/playlists/ci-g3/keys/ci-g3-w01-thu.json` | 46da9cb64dfb | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w01-fri` | `content/playlists/ci-g3/keys/ci-g3-w01-fri.json` | d15680657adb | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w02-thu` | `content/playlists/ci-g3/keys/ci-g3-w02-thu.json` | a03d1c9605da | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w03-thu` | `content/playlists/ci-g3/keys/ci-g3-w03-thu.json` | b99a0918bb05 | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-g3-w04-thu` | `content/playlists/ci-g3/keys/ci-g3-w04-thu.json` | bab58604c206 | generated | —（生成） | pending | reviewed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 14 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 6 | 可适配（single-selection，按空；需逐题核对） |
| 共享词／句库（gapMatch） | 13 | 可适配（slot-selection） |
| 连线（match） | 1 | 待平台适配（含一对多） |

### ci-xsc · 英语时文阅读｜提分训练3+X｜小升初

- 合集封面：`assets/ci-xsc/cover.jpg`（书籍封面扫描，sha256:fc79e67ecafd）；gradeBand：G6（学校年级，不等于 UniRead L 等级）；本次交付 6 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-xsc-w05-thu.s1` | Beijing Gives First License to Robot Chefs · Fill in each blank with a proper word or the proper form of the word in brackets. | `ci-xsc-w05-thu` | `s1` | `ci-xsc-w05-thu.article`（1 个大题共用） | q1–q10／10 | 10 | 文本填空 | — |
| 2 | `ci-xsc-w06-mon.s1` | Various Advertisements · Choose the best answer. | `ci-xsc-w06-mon` | `s1` | `ci-xsc-w06-mon.article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 3 | `ci-xsc-w06-thu.s1` | Aiming for the Top · Fill in each blank in the passage with a proper sentence given below. Each sentence can be used only once. There are two more sentences than you will need. | `ci-xsc-w06-thu` | `s1` | `ci-xsc-w06-thu.article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 4 | `ci-xsc-w10-thu.s1` | A Trip to England · Choose the proper sentences to complete the following dialogue. | `ci-xsc-w10-thu` | `s1` | `ci-xsc-w10-thu.article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-xsc-w12-thu.s1` | Is Mars Similar to Earth? · Complete the table below according to the passage. | `ci-xsc-w12-thu` | `s1` | `ci-xsc-w12-thu.article`（1 个大题共用） | q1–q7／7 | 7 | 文本填空 | — |
| 6 | `ci-xsc-w17-fri.s1` | A Day in Space · I. Decide whether the following statements are true (T) or false (F). | `ci-xsc-w17-fri` | `s1` | `ci-xsc-w17-fri.article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 7 | `ci-xsc-w17-fri.s2` | A Day in Space · II. Match the items on the left with the correct items on the right. | `ci-xsc-w17-fri` | `s2` | `ci-xsc-w17-fri.article`（2 个大题共用） | q5–q5／1 | 4 | 连线 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-xsc-w05-thu` | 41／33 | 3（原书） | 180（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-xsc/ci-xsc-w05-thu-1.jpg` | 独立文件 `assets/ci-xsc/ci-xsc-w05-thu-1.jpg`（裁自原书图片） |
| `ci-xsc-w06-mon` | 43,44／35,36 | 2（原书） | 128（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-xsc/ci-xsc-w06-mon-1.jpg`<br>`assets/ci-xsc/ci-xsc-w06-mon-2.jpg`<br>`assets/ci-xsc/ci-xsc-w06-mon-3.jpg`<br>`assets/ci-xsc/ci-xsc-w06-mon-4.jpg` | 独立文件 `assets/ci-xsc/ci-xsc-w06-mon-1.jpg`（裁自原书图片） |
| `ci-xsc-w06-thu` | 48／40 | 3（原书） | 277（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-xsc-w10-thu` | 69／61 | 1（原书） | 155（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-xsc/ci-xsc-w10-thu-1.jpg` | 独立文件 `assets/ci-xsc/ci-xsc-w10-thu-1.jpg`（裁自原书图片） |
| `ci-xsc-w12-thu` | 82／74 | 3（原书） | 233（原书信息框） | 9 分钟（原书） | 否 | `assets/ci-xsc/ci-xsc-w12-thu-1.jpg` | 独立文件 `assets/ci-xsc/ci-xsc-w12-thu-1.jpg`（裁自原书图片） |
| `ci-xsc-w17-fri` | 116／108 | 3（原书） | 184（原书信息框） | 7 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-xsc-w05-thu` | `content/playlists/ci-xsc/keys/ci-xsc-w05-thu.json` | 574cda8e8aae | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-xsc-w06-mon` | `content/playlists/ci-xsc/keys/ci-xsc-w06-mon.json` | 0c111eaa00f1 | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-xsc-w06-thu` | `content/playlists/ci-xsc/keys/ci-xsc-w06-thu.json` | a96306fc07ee | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-xsc-w10-thu` | `content/playlists/ci-xsc/keys/ci-xsc-w10-thu.json` | ae5c0b4bd09f | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-xsc-w12-thu` | `content/playlists/ci-xsc/keys/ci-xsc-w12-thu.json` | c7dba68e89ff | generated | —（生成） | pending | reviewed v1.0.0 |
| `ci-xsc-w17-fri` | `content/playlists/ci-xsc/keys/ci-xsc-w17-fri.json` | 3b6cb4722539 | generated | —（生成） | pending | reviewed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 文本填空（textEntry） | 17 | 待平台适配 |
| 单选（choice） | 9 | 可适配（single-selection） |
| 共享词／句库（gapMatch） | 10 | 可适配（slot-selection） |
| 连线（match） | 1 | 待平台适配（含一对多） |

### ci-g7 · 初中英语时文阅读｜提分训练3+X｜7年级（第3辑）

- 合集封面：`assets/ci-g7/cover.jpg`（书籍封面扫描，sha256:d0ba4da5a560）；gradeBand：G7（学校年级，不等于 UniRead L 等级）；本次交付 5 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-g7-w01-mon.s1` | Bye Bye, Balltze · Choose the best answer. | `ci-g7-w01-mon` | `s1` | `ci-g7-w01-mon.article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 2 | `ci-g7-w01-tue.s1` | Swords Into Plowshares: A Road to Peace · Choose the best answer. | `ci-g7-w01-tue` | `s1` | `ci-g7-w01-tue.article`（1 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 3 | `ci-g7-w01-wed.s1` | Meet the 19-Year-Old Lego Star · Choose the best answer to complete the passage. | `ci-g7-w01-wed` | `s1` | `ci-g7-w01-wed.article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 4 | `ci-g7-w01-thu.s1` | Phantom Blade Zero: A Playable Kung Fu Movie · Choose the best answer. | `ci-g7-w01-thu` | `s1` | `ci-g7-w01-thu.article`（1 个大题共用） | q1–q10／10 | 10 | 共享词／句库 | 本大题内 12 项供 10 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-g7-w01-fri.s1` | Why Are Fried Foods Bad for You? · I. Answer the questions. | `ci-g7-w01-fri` | `s1` | `ci-g7-w01-fri.article`（3 个大题共用） | q1–q6／6 | 10 | 开放问答 | — |
| 6 | `ci-g7-w01-fri.s2` | Why Are Fried Foods Bad for You? · II. Complete the sentences with the given words in their proper forms. | `ci-g7-w01-fri` | `s2` | `ci-g7-w01-fri.article`（3 个大题共用） | q7–q12／6 | 6 | 文本填空 | — |
| 7 | `ci-g7-w01-fri.s3` | Why Are Fried Foods Bad for You? · III. Complete the following sentences as required. | `ci-g7-w01-fri` | `s3` | `ci-g7-w01-fri.article`（3 个大题共用） | q13–q17／5 | 5 | 文本填空、连词成句 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-g7-w01-mon` | 10／1 | 3（原书） | 213（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-tue` | 11,12／2,3 | 4（原书） | 222（原书信息框） | 11 分钟（估算：原书缺，按词数÷约20词/分） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-wed` | 13／4 | 4（原书） | 230（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-thu` | 14／5 | 4（原书） | 226（原书信息框） | 12 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-fri` | 15,16／6,7 | 2（原书） | 155（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g7/ci-g7-w01-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w01-fri-1.jpg`（裁自原书图片） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-g7-w01-mon` | `content/playlists/ci-g7/keys/ci-g7-w01-mon.json` | e31293ec92fa | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g7-w01-tue` | `content/playlists/ci-g7/keys/ci-g7-w01-tue.json` | 8a81faeec6ad | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g7-w01-wed` | `content/playlists/ci-g7/keys/ci-g7-w01-wed.json` | 89de827e6439 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.2,3 | pending | reviewed v1.0.0 |
| `ci-g7-w01-thu` | `content/playlists/ci-g7/keys/ci-g7-w01-thu.json` | d3fd83ee8624 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.3 | pending | reviewed v1.0.0 |
| `ci-g7-w01-fri` | `content/playlists/ci-g7/keys/ci-g7-w01-fri.json` | 83ef666135d7 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.3,4 | pending | reviewed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 9 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 10 | 可适配（single-selection，按空；需逐题核对） |
| 共享词／句库（gapMatch） | 10 | 可适配（slot-selection） |
| 开放问答（extendedText） | 6 | 待平台适配（含 LLM 评分） |
| 文本填空（textEntry） | 10 | 待平台适配 |
| 连词成句（order） | 1 | 待平台适配 |

### ci-g5 · 小学英语时文阅读｜提分训练3+X｜5年级

- 合集封面：`assets/ci-g5/cover.jpg`（书籍封面扫描，sha256:04c35a8030db）；gradeBand：G5（学校年级，不等于 UniRead L 等级）；本次交付 1 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-g5-w12-thu.s1` | Fixed Mindset vs Growth Mindset · Please match the items on the left with correct answers on the right based on the passage. | `ci-g5-w12-thu` | `s1` | `ci-g5-w12-thu.article`（1 个大题共用） | q1–q1／1 | 7 | 连线 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-g5-w12-thu` | 106,107／97,98 | 3（原书） | 172（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w12-thu-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w12-thu-1.jpg`（裁自原书图片） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-g5-w12-thu` | `content/playlists/ci-g5/keys/ci-g5-w12-thu.json` | 5bb1e7028b2d | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.26 | pending | reviewed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 连线（match） | 1 | 待平台适配（含一对多） |

