# 本次生产交接 · RC（rc-pilot-2026-10，第 4 版：3／5／7 年级全书）

> 配套规约：[`14-agent-production-rules.md`](../14-agent-production-rules.md) v0.6（2026-10-17）；模板：[`14-production-handoff.template.md`](../14-production-handoff.template.md)。本文是给人和 Agent 读的附录，不是平台 API JSON。
> 只引用私有答案的位置和摘要，不粘贴答案、密钥或带 Token 的链接。

## 本次交付范围

- **任务／来源项目**：UniRead 阅读理解（RC）原型仓库 `Tuzibaobaobai/uniread-reading-comprehension`
- **规约版本与项目依据**：
  - 规约 v0.6
  - Schema `schema/index.ts`（zod，`SCHEMA_VERSION` 1.0）
  - 内容流程 `docs/04-content-pipeline.md`
  - 题型 `docs/02-question-types.md`；主观题 `docs/09-subjective-scoring.md`
  - 无缺失项
- **交付类型**：3 年级、5 年级、7 年级为**书籍目录**（全书）；小升初仍为**试点选材**
- **来源 revision**：上一版交付为 tag `v0.2-handoff`（d7b77a6）；本版为 `v0.3-handoff`（本文与内容同一提交）。每个 item 的 `status.version` 均为 1.0.0
- **原书总量／已生产／本次交付**：

  | 合集 | 原书 | 已生产 = 本次交付 |
  | --- | --- | --- |
  | ci-g3 | 60 篇 | **60 篇（全书 12 周）** |
  | ci-xsc | 90 篇 | 6 篇 |
  | ci-g7 | 90 篇 | **90 篇（全书 18 周）** |
  | ci-g5 | 60 篇 | **60 篇（全书 12 周）**；W12 Thu 原书为“一对多连线”，按产品决定每句一道单选 |
- **paperId（稳定逻辑标识，不是平台 DB ID）**：
  - `ci-g3-pilot-1`：W1 Mon–Fri、W2/W3/W4 Thu，覆盖题型的选材
  - `ci-xsc-pilot-1`：6 篇题型代表
  - `ci-g7-w01`：7 年级第 1 周（保留）
  - `ci-g7-full`：7 年级全书 18 周
  - `ci-g3-full`、`ci-g5-full`：3 年级、5 年级全书 12 周（新增）
  - `ci-g5-pilot-1`：5 年级 W12 Thu 一篇
  - 规约 v0.6 要求逻辑 ID 只用小写字母、数字和连字符，因此本版把第 1 版中带“.”的写法（如 `ci-g7.w01`、`ci-g7-w01-mon.s1`）改为连字符形式。平台尚未接入第 1 版，旧写法未被使用
  - 同一逻辑试卷不因样式修改而换 ID
- **标题／简介／语言**：见各合集 `playlist.json` 的 `title`、`shortTitle`、`description`；语言 `en`，界面中文
- **适用学校年级**：`gradeBand` 取自书名，分别为 G3、G5、小升初（G6）、G7。是学校年级，**不等于** UniRead L 等级
- **原书难度量表**：书中信息框的“难度 N 级”（1–5），量表由出版方定义。**不等同** UniRead 等级或 Lexile，本次不生成这两项
- **词数／建议用时**：取自原书信息框。词数为出版方标注，统计范围按原书（正文）。缺原书值的单独标“估算”及方法（见下表）

## 大题与共享材料映射

- 每个 Section 即一个大题资源（`resourceId = <itemId>-<sectionId>`）。文章是共享材料（`materialId = <itemId>-article`），同一 item 的各大题共用；统计词数时按材料去重。
- 多 Section 的文章（`ci-g3-w01-fri`、`ci-xsc-w17-fri`、`ci-g7-w01-fri`）正文中没有空格，所以不存在未归属空格；共享 bank 都只在单个 Section 内。
- **共享 bank**：只出现在共享词／句库（`gapMatch`）大题中，作用域就是该大题（section），不跨资源。每项限用一次。把已用词条填到别的空时，在**同一次更新**中从原空释放并填入新空（`setResponses` 一次提交），不会出现只保存一半的情况。
- **拆合与重排**：没有拆合资源，受影响 ID 见下一节。
- **顺序与分值**：顺序为 item `order`（周→日）加 section 顺序。分值为题目 `points`：
  - 默认每小题 1 分
  - 连线题 = 配对数
  - 7 年级回答问题 = 要点数（1–2）
  - 题号是展示用编号，不是身份

## 本次更新与稳定题目ID

- **本次类型**：更新已有试卷（相对上一版交付 `v0.2-handoff`）
- **对照旧版**：tag `v0.2-handoff`（d7b77a6），以及各 item 文件的完整 Git 历史
- **历史已用／退役 ID 的核对依据**：`npx tsx scripts/id-changes.ts --base v0.2-handoff ci-g3 ci-xsc ci-g7 ci-g5`。结果：已有 20 篇**全部沿用**；新增 196 篇为**首次生产**（q1…qN）；**没有复用**退役 ID
- **是否涉及共享文章／图片／bank**：无

**相对 `v0.2-handoff`**：已有 20 篇的小题 ID 全部沿用；新增 196 篇：7 年级 W2–W18 共 85 篇、3 年级 52 篇、5 年级 59 篇。

**首次公开发布以来的变化**（供平台核对，均早于 `v0.1-handoff`）：

`ci-g7-w01-fri` 的回答问题改为 LLM 评分，分值随要点数调整。题面和回答方式（原始文本）不变，所以保留原 ID。基线为首次公开版本 93e9ab0：

| resourceId／Item | 操作 | 原小题ID | 更新后小题ID | 展示题号变化 | 原因与证据位置 |
| --- | --- | --- | --- | --- | --- |
| `ci-g7-w01-fri` | 评分方式修正 | `q1` | `q1` | — | self → judge |
| `ci-g7-w01-fri` | 分值修正 | `q1` | `q1` | — | 1 → 2 分 |
| `ci-g7-w01-fri` | 评分方式修正 | `q2` | `q2` | — | self → judge |
| `ci-g7-w01-fri` | 评分方式修正 | `q3` | `q3` | — | self → judge |
| `ci-g7-w01-fri` | 分值修正 | `q3` | `q3` | — | 1 → 2 分 |
| `ci-g7-w01-fri` | 评分方式修正 | `q4` | `q4` | — | self → judge |
| `ci-g7-w01-fri` | 评分方式修正 | `q5` | `q5` | — | self → judge |
| `ci-g7-w01-fri` | 分值修正 | `q5` | `q5` | — | 1 → 2 分 |
| `ci-g7-w01-fri` | 评分方式修正 | `q6` | `q6` | — | none → judge |
| `ci-g7-w01-fri` | 分值修正 | `q6` | `q6` | — | 1 → 2 分 |

- `ci-g5-w12-thu` 在首次发布前从“一题连线”改为每句一道单选，发布版本即为 q1–q7，不涉及旧 ID。
- 7 年级 5 个 key 的 `reviewStatus` 从 approved 改回 pending（只有 AI 复核），不影响题目 ID。

**检查**
- [x] 原题 ID 没有因页面重生成、调序、样式或标题修改而整体重编（`id-changes` 报告全部沿用）。
- [x] 没有新增或退役 ID；旧版可通过 tag `v0.1-handoff` 定位。
- [x] Item、Key.answers、blank／选项／bank、选材与位置引用一致（`npm run validate` 0 error；位置按 questionId 保存）。
- [x] RC 校验器的 ID 与题号耦合**已解除**：`scripts/validate.ts` 只要求 ID 在 item 内唯一、题号连续（规约 §3.2 指出的工具缺口，由本项目作为维护方处理）。插题时 `q1/number=1, q3/number=2, q2/number=3` 可以通过校验。
- 跨版本答案继承和历史快照是平台待实现的能力，本表只是交接证据。

## 7 年级全书生产说明（W2–W18）

- **生产方式**（省 token）：
  - 用 `scripts/pdf-text.swift` 抽取书和答案册的 OCR 文本层，用 `scripts/pack-week.mjs` 打成每周一个文本包
  - 转录 Agent（Sonnet）按 `docs/production-brief.md` 工作，每周一个 Agent；页面图只看一次，用于确认高亮、下划线、括注和配图
  - 平均每篇约 21k tokens
- **核对方式**（脚本，`scripts/check-week.ts`）：
  - 字母答案与答案册 `【X】` 比对：只比对能按题目内容确信匹配的条目，双栏 OCR 交错会导致部分无法匹配
  - 正文和题目文字须出现在 OCR 中
  - 正文词数与书中“词数”比对
  - `hasVideo` 以页面上的“本篇配视频讲解课程”为准
  - 结果：90 篇 `validate` 0 error；所有能匹配的字母答案都与官方一致；文字与 OCR 的吻合率为 93–100%
  - 七选五的词数偏低属正常：原书词数包含句库
- **状态**：
  - W2–W18 的内容状态为 `transcribed`：只经脚本核对，**没有独立复核 Agent，也没有人工复核**
  - 所有 key 为 `pending`
  - 建议人工抽查
- **生产中修正的问题**：
  - 并行 Agent 共用临时脚本，导致 W3 的词汇引用出现重复前缀 `v-v-`，已修复并复核
  - W8 周一、周二的页码范围漏了第二页，已补齐；之后改由页码规则检查
  - W2 周一误标 `hasVideo`（目录里的 ● 不是视频标记），已改正
- **需人工确认**：
  1. 原书和官方答案的疑似错误一律按原书照录，已提 GitHub issue（标签 `errata`），人工在 issue 中确认后再改：`ci-g7-w12-thu` q6 官方参考答案语法错误（#18）、`ci-g7-w13-wed` 第 10 空 “his project”（#19）、`ci-g7-w18-fri` “jewellry”（#20）、`ci-g7-w16-thu` “9 钟”（#21）
  2. 估算的建议用时：`ci-g7-w01-tue` 9 分钟、`ci-g7-w02-thu` 10 分钟、`ci-g7-w03-wed` 12 分钟。估算方法：词数 ÷ 40 词/分钟（初一学生的平均英文阅读速度，与本书已印用时吻合），加每道客观题 0.5 分钟、每道作答题 1 分钟，取整；记入 errata
  5. 有讲解视频标记的共 17 篇（W1、W3–W18 的周五），本次都没有交付视频

## 3 年级、5 年级全书生产说明

- **生产方式**：与 7 年级相同（OCR 文本包 + Sonnet 转录 Agent + 脚本核对），共 23 个周 Agent，平均每篇约 20k tokens。页码映射集中在 `scripts/book-maps.mjs`。
- **核对结果**：
  - 120 篇 `validate` 0 error
  - 所有能匹配的字母答案都与官方一致。脚本给出的 3 处 ✗ 已人工核对答案册，均为双栏 OCR 交错造成的误报：`ci-g3-w06-fri` q3、`ci-g3-w08-mon` q4、`ci-g5-w12-mon` q4
  - 词数偏低的篇目逐篇核对过：七选五、六选四的句库不计入，括注打断了行首匹配，没有漏句
- **讲解视频**：3 年级、5 年级书的前言写明“每周精读的视频讲解课程”通过封面二维码获取，文章页上没有标记。因此两本书的每周精读（周五）都标 `hasVideo: true`，共 12 + 12 篇，本次都没有交付视频。7 年级以文章页上的标记为准。
- **生产中修正的问题**：
  - 5 年级 W3 周一（Get a Taste of Bao）在目录 OCR 中丢失，周起始页已改为书页 16
  - `ci-g5-w12-fri` 的 PDF 页码错一页，已更正
  - 7 年级 W18 周五的范围误含封底，已更正
- **状态**：新增各篇为 `transcribed`，只经脚本核对，没有独立复核 Agent，也没有人工复核；所有 key 为 `pending`。
- **需人工确认**：
  1. `ci-g5-w10-wed` q6：官方答案 A（large），转录 Agent 认为 B（small）更合适；key 保持官方答案，标注“待复核”，已提 issue #14
  2. 原书疑似错误按原书照录，已提 issue，人工确认后再改：`ci-g3-w01-fri` “smoke. ( 尾烟 ).”（#15）、`ci-g3-w02-thu` 导读“夏拉奇”（#16）、`ci-g3-w07-fri` I-3 “Do every recipe…”（#17）
  3. 估算的建议用时：`ci-g3-w11-tue` 7 分钟。估算方法：词数 ÷ 30 词/分钟（三年级学生的平均英文阅读速度，与本书已印用时吻合），加每道题 0.6 分钟，取整

## 可选机器选材清单

- **是否提供**：已提供，格式 `rc-selection-2`，每份逻辑试卷一份：
  - `docs/handoff/production-selection.ci-g3-pilot-1.json`（8 个材料，9 个大题）
  - `docs/handoff/production-selection.ci-xsc-pilot-1.json`（6 个材料，7 个大题）
  - `docs/handoff/production-selection.ci-g7-w01.json`（5 个材料，7 个大题）
  - `docs/handoff/production-selection.ci-g7-full.json`（90 个材料，126 个大题）
  - `docs/handoff/production-selection.ci-g3-full.json`（60 个材料，72 个大题）
  - `docs/handoff/production-selection.ci-g5-full.json`（60 个材料，72 个大题）
  - `docs/handoff/production-selection.ci-g5-pilot-1.json`（1 个材料，1 个大题）
- **生成方式**：`npx tsx scripts/selection-json.ts`，与下方清单使用同一套 ID 规则。脚本检查：ID 格式（小写字母、数字、连字符，≤128）、标题非空（≤512，无控制字符）、同一 Item 的 Section 不重复选用、每份材料都被使用。
- **与上表是否一致**：一致（同一函数生成）。每个 `materialId` 只代表一个 `Item.article`，同一 Item 的多道大题复用同一 ID。
- 不含平台数据库 ID 或 UUID。清单仍需接入方确认，并通过平台解析、构建和校验。

## RC 布局与交互还原交接

规约铁律：接入 UniRead 时必须保留 RC 原页的布局、字体、响应式和交互，只替换数据、存储和通信。

- **页面源码入口**：`index.html` → `src/main.tsx`。页面在 `src/pages/`（合集列表、合集详情）和 `src/reader/`（阅读页：文章栏、题卡、各题型交互、复盘、定位原文）。版本为 tag `v0.3-handoff`；构建命令 `npm ci && npm run build`，需要 Node ≥ 22。
- **样式与依赖**：
  - CSS：`src/styles/tokens.css`（全部视觉 token，来自 Figma，见 `docs/design/figma-registry.md`）、`global.css`、`app.css`
  - 字体：`@fontsource/source-sans-3` 和 `@fontsource/noto-sans-sc`，字重 400、500、700，自托管打包，无外链
  - 图标：`src/assets/icons/`（来自 Figma）
  - 图片：`content/assets/`
- **布局与响应式**：
  - ≥ 1024px：左右 50/50 分栏，各自滚动，滚动条留在卡片圆角以内
  - < 1024px：顶部“文章 / 题目”切换
  - 题卡按容器宽度（900px、560px）缩放分页栏
  - 合集详情在 1200px、1023px 两档调整
- **需保留的交互清单**：
  - 一题一页和题号分页（已答标记，提交后显示 ✓／✗）；有未答题时提交会弹出提醒
  - 选项行的默认、悬停、选中、错误、正确-展开（解析嵌在正确选项下）
  - 完形、选词填空中左栏空格与题目双向联动；空格为单横线，选词题只显示字母
  - 共享词库点选填入并原子移动；文本填空带首字母或原词提示
  - 连线点选配对；连词成句点词块组句、点回撤销
  - 开放题：“正在批改…”后显示 AI 评分卡，失败时退回自评
  - 定位原文精确到句（换行也算句子边界）
  - 每道题上方显示原书大题提示
  - 浏览位置和作答恢复
  - 对应的行为测试在 `e2e/*.spec.ts`
- **对照证据**：
  - 来源页面基线：`REFERENCE=1 npx playwright test e2e/reference.spec.ts`，覆盖 20 篇 × 3 视口（1440×900、iPad 横屏 1180×820、iPad 竖屏 820×1180），在字体加载完成后截图
  - 作答前的截图（80 张）可公开；提交后的复盘截图（60 张）含答案，属私有材料，随答案键受控交付
  - 打包产物与平台容器的对照：**待验证**，由平台在相同内容、视口、作答和位置下截图对比
- **差异与未完成**：
  1. 打包产物与平台容器的对照尚未做：待平台
  2. 部分组件还没有 Figma 设计，暂用现有实现：合集卡片、结果、对话框、填空输入、词库、连线、开放题评分卡
  3. 原型的 `/api/rc/*` 接口和 localStorage 需要替换为平台接口，替换时不改页面
  4. 有差异就写未完成，不能以“功能已通”验收

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
  - ci-g3、ci-g5、ci-g7：**official**，出处为答案册的 PDF 页。3 年级原有 8 篇的生成答案已逐题与官方答案册核对，全部一致，已改为 official
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
  - `npm run validate`：216 个 item，0 error、51 warning，均为词表词条在正文中没有高亮，忠于原书（如 `ci-g5-w12-thu` 的 v-growth 只出现在标题和彩色小标题中）
  - `npm test`：40 项通过
  - `npm run e2e`：91 项通过（含逐篇打开 216 篇的冒烟测试），覆盖 desktop 1440×900、iPad 横屏、iPad 竖屏
  - `npm run build`：通过，含私有材料扫描
- **未运行**：UniRead 平台接入验证、真实学生作答保存、平台提交评分（均不在本仓库能力范围）；LLM 评分与教师评分的一致性校准（无金标集，见 docs/09 §6）。
- **阻塞／待补／待确认**：
  1. 封面、配图和文本的版权使用许可：待确认
  2. ci-xsc 复核遗留：w10-thu q1（B/C）、w17-fri 连线 3-D、w12-thu b3 只接受 “distances”：待人工确认
  3. 原书与官方答案的疑似错误（GitHub issue #14–#21，标签 `errata`）：内容按原书照录，待人工在 issue 中确认后再改
  4. 所有 key 和内容的人工复核：待人工
  5. textEntry、match、order、extendedText 的平台适配，以及 LLM 评分的金标校准：待平台／待数据
  6. 3 年级、小升初的出版版次：待补

## 附：由内容生成的清单

由 `npx tsx scripts/handoff-inventory.ts ci-g3 ci-xsc ci-g7 ci-g5` 生成；内容变更后重新生成。

### ci-g3 · 小学英语时文阅读｜提分训练3+X｜3年级

- 合集封面：`assets/ci-g3/cover.jpg`（书籍封面扫描，sha256:7c1a05d3652b）；gradeBand：G3（学校年级，不等于 UniRead L 等级）；本次交付 60 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-g3-w01-mon-s1` | Tiny “Embryos” Begin Space Test · 阅读选择 | `ci-g3-w01-mon` | `s1` | `ci-g3-w01-mon-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 2 | `ci-g3-w01-tue-s1` | Kids Find Maths and Magic in Flowers · 阅读选择 | `ci-g3-w01-tue` | `s1` | `ci-g3-w01-tue-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 3 | `ci-g3-w01-wed-s1` | Pets Are Part of the Family! · 完形填空 | `ci-g3-w01-wed` | `s1` | `ci-g3-w01-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 4 | `ci-g3-w01-thu-s1` | Little Beads, Big Fun · 选词填空 | `ci-g3-w01-thu` | `s1` | `ci-g3-w01-thu-article`（1 个大题共用） | q1–q6／6 | 6 | 共享词／句库 | 本大题内 8 项供 6 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-g3-w01-fri-s1` | Going GREEN · I. 选词填空 | `ci-g3-w01-fri` | `s1` | `ci-g3-w01-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 共享词／句库 | 本大题内 4 项供 3 空，每项限用一次，改选即从原空释放 |
| 6 | `ci-g3-w01-fri-s2` | Going GREEN · II. 阅读选择 | `ci-g3-w01-fri` | `s2` | `ci-g3-w01-fri-article`（2 个大题共用） | q4–q6／3 | 3 | 单选 | — |
| 7 | `ci-g3-w02-mon-s1` | Court Says AI Mistakes Are Not Always Illegal · 阅读选择 | `ci-g3-w02-mon` | `s1` | `ci-g3-w02-mon-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 8 | `ci-g3-w02-tue-s1` | Zhang Xue: From a Bike-Loving Boy to a World Champion · 阅读选择 | `ci-g3-w02-tue` | `s1` | `ci-g3-w02-tue-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 9 | `ci-g3-w02-wed-s1` | New Helpers at Hospitals · 完形填空 | `ci-g3-w02-wed` | `s1` | `ci-g3-w02-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 10 | `ci-g3-w02-thu-s1` | Shakira Sings New World Cup Song · 选词填空 | `ci-g3-w02-thu` | `s1` | `ci-g3-w02-thu-article`（1 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 6 项供 4 空，每项限用一次，改选即从原空释放 |
| 11 | `ci-g3-w02-fri-s1` | The Elephant House: The Birthplace of Harry Potter · I. 回答问题 | `ci-g3-w02-fri` | `s1` | `ci-g3-w02-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 开放问答 | — |
| 12 | `ci-g3-w02-fri-s2` | The Elephant House: The Birthplace of Harry Potter · II. 选词填空 | `ci-g3-w02-fri` | `s2` | `ci-g3-w02-fri-article`（2 个大题共用） | q4–q6／3 | 3 | 共享词／句库 | 本大题内 3 项供 3 空，每项限用一次，改选即从原空释放 |
| 13 | `ci-g3-w03-mon-s1` | A City Where Street Trees Grow Lychees · 阅读选择 | `ci-g3-w03-mon` | `s1` | `ci-g3-w03-mon-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 14 | `ci-g3-w03-tue-s1` | Yellowstone National Park · 阅读选择 | `ci-g3-w03-tue` | `s1` | `ci-g3-w03-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 15 | `ci-g3-w03-wed-s1` | Fish Do Sleep · 完形填空 | `ci-g3-w03-wed` | `s1` | `ci-g3-w03-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 16 | `ci-g3-w03-thu-s1` | Please Come Out, Groundhog! · 连线 | `ci-g3-w03-thu` | `s1` | `ci-g3-w03-thu-article`（1 个大题共用） | q1–q1／1 | 4 | 连线 | — |
| 17 | `ci-g3-w03-fri-s1` | Working at Port Lockroy · I. 判断正误 | `ci-g3-w03-fri` | `s1` | `ci-g3-w03-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 18 | `ci-g3-w03-fri-s2` | Working at Port Lockroy · II. 回答问题 | `ci-g3-w03-fri` | `s2` | `ci-g3-w03-fri-article`（2 个大题共用） | q5–q7／3 | 3 | 开放问答 | — |
| 19 | `ci-g3-w04-mon-s1` | The Teen Who Counts Super Fast · 阅读选择 | `ci-g3-w04-mon` | `s1` | `ci-g3-w04-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 20 | `ci-g3-w04-tue-s1` | French Fry Lip Balm · 阅读选择 | `ci-g3-w04-tue` | `s1` | `ci-g3-w04-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 21 | `ci-g3-w04-wed-s1` | Shadow Puppet Show · 完形填空 | `ci-g3-w04-wed` | `s1` | `ci-g3-w04-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 22 | `ci-g3-w04-thu-s1` | Playing With Buildings · 判断正误 | `ci-g3-w04-thu` | `s1` | `ci-g3-w04-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 23 | `ci-g3-w04-fri-s1` | Children’s Day Around the World · I. 选词填空 | `ci-g3-w04-fri` | `s1` | `ci-g3-w04-fri-article`（2 个大题共用） | q1–q2／2 | 2 | 共享词／句库 | 本大题内 6 项供 2 空，每项限用一次，改选即从原空释放 |
| 24 | `ci-g3-w04-fri-s2` | Children’s Day Around the World · II. 阅读选择 | `ci-g3-w04-fri` | `s2` | `ci-g3-w04-fri-article`（2 个大题共用） | q3–q5／3 | 3 | 单选 | — |
| 25 | `ci-g3-w05-mon-s1` | Animals Make Art · 阅读选择 | `ci-g3-w05-mon` | `s1` | `ci-g3-w05-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 26 | `ci-g3-w05-tue-s1` | Girls Want to Wear Trousers · 阅读选择 | `ci-g3-w05-tue` | `s1` | `ci-g3-w05-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 27 | `ci-g3-w05-wed-s1` | My Family Story · 完形填空 | `ci-g3-w05-wed` | `s1` | `ci-g3-w05-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 28 | `ci-g3-w05-thu-s1` | The Gerbil Museum · 回答问题 | `ci-g3-w05-thu` | `s1` | `ci-g3-w05-thu-article`（1 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 29 | `ci-g3-w05-fri-s1` | Wheeling Round the World · I. 阅读选择 | `ci-g3-w05-fri` | `s1` | `ci-g3-w05-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 30 | `ci-g3-w05-fri-s2` | Wheeling Round the World · II. 判断正误 | `ci-g3-w05-fri` | `s2` | `ci-g3-w05-fri-article`（2 个大题共用） | q4–q7／4 | 4 | 单选 | — |
| 31 | `ci-g3-w06-mon-s1` | The Secret to a Perfect Bowling Strike · 阅读选择 | `ci-g3-w06-mon` | `s1` | `ci-g3-w06-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 32 | `ci-g3-w06-tue-s1` | Zero-Carbon Service Area · 阅读选择 | `ci-g3-w06-tue` | `s1` | `ci-g3-w06-tue-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 33 | `ci-g3-w06-wed-s1` | Holi Celebration · 完形填空 | `ci-g3-w06-wed` | `s1` | `ci-g3-w06-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 34 | `ci-g3-w06-thu-s1` | How and When to Wash Your Hands · 判断正误 | `ci-g3-w06-thu` | `s1` | `ci-g3-w06-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 35 | `ci-g3-w06-fri-s1` | Tennis Game-Set-Match · I. 判断正误 | `ci-g3-w06-fri` | `s1` | `ci-g3-w06-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 36 | `ci-g3-w06-fri-s2` | Tennis Game-Set-Match · II. 阅读选择 | `ci-g3-w06-fri` | `s2` | `ci-g3-w06-fri-article`（2 个大题共用） | q5–q7／3 | 3 | 单选 | — |
| 37 | `ci-g3-w07-mon-s1` | Post Boxes Go Solar! · 阅读选择 | `ci-g3-w07-mon` | `s1` | `ci-g3-w07-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 38 | `ci-g3-w07-tue-s1` | The Giant Chocolate Egg · 阅读选择 | `ci-g3-w07-tue` | `s1` | `ci-g3-w07-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 39 | `ci-g3-w07-wed-s1` | Tracing Bees · 完形填空 | `ci-g3-w07-wed` | `s1` | `ci-g3-w07-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 40 | `ci-g3-w07-thu-s1` | A Stylish Dog · 选词填空 | `ci-g3-w07-thu` | `s1` | `ci-g3-w07-thu-article`（1 个大题共用） | q1–q6／6 | 6 | 共享词／句库 | 本大题内 8 项供 6 空，每项限用一次，改选即从原空释放 |
| 41 | `ci-g3-w07-fri-s1` | Meet Chef Lenny · I. 阅读选择 | `ci-g3-w07-fri` | `s1` | `ci-g3-w07-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 42 | `ci-g3-w07-fri-s2` | Meet Chef Lenny · II. 选词填空 | `ci-g3-w07-fri` | `s2` | `ci-g3-w07-fri-article`（2 个大题共用） | q4–q7／4 | 4 | 共享词／句库 | 本大题内 4 项供 4 空，每项限用一次，改选即从原空释放 |
| 43 | `ci-g3-w08-mon-s1` | Dog Waits Outside Hospital · 阅读选择 | `ci-g3-w08-mon` | `s1` | `ci-g3-w08-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 44 | `ci-g3-w08-tue-s1` | New Year’s Celebrations in Central and South America · 阅读选择 | `ci-g3-w08-tue` | `s1` | `ci-g3-w08-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 45 | `ci-g3-w08-wed-s1` | Should Kids Use Skincare? · 完形填空 | `ci-g3-w08-wed` | `s1` | `ci-g3-w08-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 46 | `ci-g3-w08-thu-s1` | Museum Blind Boxes · 选词填空 | `ci-g3-w08-thu` | `s1` | `ci-g3-w08-thu-article`（1 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 6 项供 4 空，每项限用一次，改选即从原空释放 |
| 47 | `ci-g3-w08-fri-s1` | What Is Cosplay? · I. 判断正误 | `ci-g3-w08-fri` | `s1` | `ci-g3-w08-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 48 | `ci-g3-w08-fri-s2` | What Is Cosplay? · II. 回答问题 | `ci-g3-w08-fri` | `s2` | `ci-g3-w08-fri-article`（2 个大题共用） | q5–q8／4 | 7 | 开放问答 | — |
| 49 | `ci-g3-w09-mon-s1` | Riley’s Five Emotions · 阅读选择 | `ci-g3-w09-mon` | `s1` | `ci-g3-w09-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 50 | `ci-g3-w09-tue-s1` | The Chocolate Capital of the World · 阅读选择 | `ci-g3-w09-tue` | `s1` | `ci-g3-w09-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 51 | `ci-g3-w09-wed-s1` | Ways to Feel Calm · 完形填空 | `ci-g3-w09-wed` | `s1` | `ci-g3-w09-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 52 | `ci-g3-w09-thu-s1` | Peter Rabbit · 回答问题 | `ci-g3-w09-thu` | `s1` | `ci-g3-w09-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 开放问答 | — |
| 53 | `ci-g3-w09-fri-s1` | What CAN You Give? · I. 选词填空 | `ci-g3-w09-fri` | `s1` | `ci-g3-w09-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 共享词／句库 | 本大题内 5 项供 3 空，每项限用一次，改选即从原空释放 |
| 54 | `ci-g3-w09-fri-s2` | What CAN You Give? · II. 回答问题 | `ci-g3-w09-fri` | `s2` | `ci-g3-w09-fri-article`（2 个大题共用） | q4–q6／3 | 3 | 开放问答 | — |
| 55 | `ci-g3-w10-mon-s1` | Mipig: A Piglet Cafe in Tokyo · 阅读选择 | `ci-g3-w10-mon` | `s1` | `ci-g3-w10-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 56 | `ci-g3-w10-tue-s1` | Little World, Big Fun · 阅读选择 | `ci-g3-w10-tue` | `s1` | `ci-g3-w10-tue-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 57 | `ci-g3-w10-wed-s1` | Sunlight-Warming Fabric · 完形填空 | `ci-g3-w10-wed` | `s1` | `ci-g3-w10-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 58 | `ci-g3-w10-thu-s1` | Getting to Know Happiness · 连线 | `ci-g3-w10-thu` | `s1` | `ci-g3-w10-thu-article`（1 个大题共用） | q1–q1／1 | 5 | 连线 | — |
| 59 | `ci-g3-w10-fri-s1` | Wild Weather · I. 连线 | `ci-g3-w10-fri` | `s1` | `ci-g3-w10-fri-article`（2 个大题共用） | q1–q1／1 | 5 | 连线 | — |
| 60 | `ci-g3-w10-fri-s2` | Wild Weather · II. 阅读选择 | `ci-g3-w10-fri` | `s2` | `ci-g3-w10-fri-article`（2 个大题共用） | q2–q4／3 | 3 | 单选 | — |
| 61 | `ci-g3-w11-mon-s1` | Dr Dan the Pancake Man · 阅读选择 | `ci-g3-w11-mon` | `s1` | `ci-g3-w11-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 62 | `ci-g3-w11-tue-s1` | Paella: Rice Dish From Spain · 阅读选择 | `ci-g3-w11-tue` | `s1` | `ci-g3-w11-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 63 | `ci-g3-w11-wed-s1` | Smelling Mummies · 完形填空 | `ci-g3-w11-wed` | `s1` | `ci-g3-w11-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 64 | `ci-g3-w11-thu-s1` | Fire Safety for Kids · 判断正误 | `ci-g3-w11-thu` | `s1` | `ci-g3-w11-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 65 | `ci-g3-w11-fri-s1` | Making Maths Fun with Colours · I. 回答问题 | `ci-g3-w11-fri` | `s1` | `ci-g3-w11-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 开放问答 | — |
| 66 | `ci-g3-w11-fri-s2` | Making Maths Fun with Colours · II. 判断正误 | `ci-g3-w11-fri` | `s2` | `ci-g3-w11-fri-article`（2 个大题共用） | q5–q8／4 | 4 | 单选 | — |
| 67 | `ci-g3-w12-mon-s1` | The Young Mountain Climber · 阅读选择 | `ci-g3-w12-mon` | `s1` | `ci-g3-w12-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 68 | `ci-g3-w12-tue-s1` | Karla Cares for Zoo Animals · 阅读选择 | `ci-g3-w12-tue` | `s1` | `ci-g3-w12-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 69 | `ci-g3-w12-wed-s1` | Art Auction for a Park · 完形填空 | `ci-g3-w12-wed` | `s1` | `ci-g3-w12-wed-article`（1 个大题共用） | q1–q5／5 | 5 | 完形（每空单选） | — |
| 70 | `ci-g3-w12-thu-s1` | The Real Stars in Houtong Are Cats · 选词填空 | `ci-g3-w12-thu` | `s1` | `ci-g3-w12-thu-article`（1 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 6 项供 4 空，每项限用一次，改选即从原空释放 |
| 71 | `ci-g3-w12-fri-s1` | New Ravens at the Tower of London · I. 阅读选择 | `ci-g3-w12-fri` | `s1` | `ci-g3-w12-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 72 | `ci-g3-w12-fri-s2` | New Ravens at the Tower of London · II. 判断正误 | `ci-g3-w12-fri` | `s2` | `ci-g3-w12-fri-article`（2 个大题共用） | q4–q7／4 | 4 | 单选 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-g3-w01-mon` | 10／1 | 4（原书） | 126（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w01-tue` | 11,12／2,3 | 3（原书） | 129（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w01-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w01-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w01-wed` | 13／4 | 2（原书） | 114（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w01-thu` | 14／5 | 2（原书） | 124（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w01-thu-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w01-thu-1.jpg`（裁自原书图片） |
| `ci-g3-w01-fri` | 15,16／6,7 | 2（原书） | 104（原书信息框） | 8 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w01-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w01-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w02-mon` | 17,18／8,9 | 4（原书） | 129（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w02-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w02-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w02-tue` | 19／10 | 3（原书） | 108（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w02-wed` | 20／11 | 3（原书） | 109（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w02-thu` | 21／12 | 3（原书） | 124（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w02-fri` | 22／13 | 3（原书） | 125（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w03-mon` | 23,24／14,15 | 3（原书） | 130（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w03-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w03-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w03-tue` | 25,26／16,17 | 3（原书） | 144（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w03-wed` | 27／18 | 5（原书） | 152（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w03-thu` | 28／19 | 4（原书） | 175（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w03-fri` | 29,30／20,21 | 2（原书） | 114（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w03-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w03-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w04-mon` | 31,32／22,23 | 4（原书） | 130（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w04-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w04-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w04-tue` | 33,34／24,25 | 3（原书） | 130（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w04-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w04-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w04-wed` | 35／26 | 3（原书） | 123（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w04-thu` | 36／27 | 3（原书） | 129（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w04-fri` | 37,38／28,29 | 3（原书） | 134（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w04-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w04-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w05-mon` | 39,40／30,31 | 3（原书） | 133（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w05-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w05-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w05-tue` | 41,42／32,33 | 3（原书） | 129（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w05-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w05-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w05-wed` | 43／34 | 3（原书） | 147（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w05-thu` | 44／35 | 3（原书） | 113（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w05-fri` | 45,46／36,37 | 2（原书） | 119（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w05-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w05-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w06-mon` | 47,48／38,39 | 4（原书） | 128（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w06-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w06-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w06-tue` | 49／40 | 3（原书） | 126（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w06-wed` | 50／41 | 4（原书） | 116（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w06-thu` | 51,52／42,43 | 3（原书） | 146（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w06-thu-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w06-thu-1.jpg`（裁自原书图片） |
| `ci-g3-w06-fri` | 53,54／44,45 | 3（原书） | 138（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w06-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w06-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w07-mon` | 55,56／46,47 | 3（原书） | 126（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w07-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w07-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w07-tue` | 57,58／48,49 | 3（原书） | 122（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w07-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w07-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w07-wed` | 59／50 | 2（原书） | 114（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w07-thu` | 60／51 | 3（原书） | 130（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w07-thu-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w07-thu-1.jpg`（裁自原书图片） |
| `ci-g3-w07-fri` | 61,62／52,53 | 3（原书） | 147（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w07-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w07-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w08-mon` | 63／54 | 2（原书） | 109（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w08-tue` | 64／55 | 2（原书） | 107（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w08-wed` | 65／56 | 2（原书） | 100（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w08-thu` | 66／57 | 3（原书） | 139（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w08-fri` | 67,68／58,59 | 3（原书） | 127（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w08-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w08-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w09-mon` | 69,70／60,61 | 1（原书） | 111（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w09-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w09-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w09-tue` | 71,72／62,63 | 3（原书） | 119（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w09-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w09-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w09-wed` | 73／64 | 3（原书） | 104（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w09-thu` | 74／65 | 3（原书） | 118（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w09-fri` | 75,76／66,67 | 3（原书） | 133（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w09-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w09-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w10-mon` | 77,78／68,69 | 3（原书） | 129（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w10-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w10-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w10-tue` | 79,80／70,71 | 3（原书） | 127（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w10-tue-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w10-tue-1.jpg`（裁自原书图片） |
| `ci-g3-w10-wed` | 81／72 | 5（原书） | 121（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w10-thu` | 82／73 | 4（原书） | 147（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w10-fri` | 83,84／74,75 | 3（原书） | 133（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w10-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w10-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w11-mon` | 85／76 | 3（原书） | 118（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w11-tue` | 86／77 | 4（原书） | 141（原书信息框） | 7 分钟（估算：原书未印，按该年级学生平均阅读速度加做题时间估算：阅读 141 词 ÷ 30 词/分钟 ≈ 4.7 分钟 + 4 道客观题 × 0.6 分钟，取整） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w11-wed` | 87／78 | 4（原书） | 105（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w11-thu` | 88／79 | 3（原书） | 126（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w11-fri` | 89,90／80,81 | 3（原书） | 116（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w11-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w11-fri-1.jpg`（裁自原书图片） |
| `ci-g3-w12-mon` | 91,92／82,83 | 3（原书） | 115（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g3/ci-g3-w12-mon-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w12-mon-1.jpg`（裁自原书图片） |
| `ci-g3-w12-tue` | 93／84 | 3（原书） | 140（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w12-wed` | 94／85 | 3（原书） | 103（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w12-thu` | 95／86 | 2（原书） | 134（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g3-w12-fri` | 96,97／87,88 | 4（原书） | 119（原书信息框） | 10 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g3/ci-g3-w12-fri-1.jpg` | 独立文件 `assets/ci-g3/ci-g3-w12-fri-1.jpg`（裁自原书图片） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-g3-w01-mon` | `content/playlists/ci-g3/keys/ci-g3-w01-mon.json` | 307eda3f73a4 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g3-w01-tue` | `content/playlists/ci-g3/keys/ci-g3-w01-tue.json` | 86f9366b10fe | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g3-w01-wed` | `content/playlists/ci-g3/keys/ci-g3-w01-wed.json` | e8176a6f17ed | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g3-w01-thu` | `content/playlists/ci-g3/keys/ci-g3-w01-thu.json` | 652cc83ecae4 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g3-w01-fri` | `content/playlists/ci-g3/keys/ci-g3-w01-fri.json` | 291e408cf6a1 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.3 | pending | reviewed v1.0.0 |
| `ci-g3-w02-mon` | `content/playlists/ci-g3/keys/ci-g3-w02-mon.json` | c92cc429f6c2 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.3 | pending | transcribed v1.0.0 |
| `ci-g3-w02-tue` | `content/playlists/ci-g3/keys/ci-g3-w02-tue.json` | 5076758a4f71 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.3 | pending | transcribed v1.0.0 |
| `ci-g3-w02-wed` | `content/playlists/ci-g3/keys/ci-g3-w02-wed.json` | b4eca8e165d6 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.4 | pending | transcribed v1.0.0 |
| `ci-g3-w02-thu` | `content/playlists/ci-g3/keys/ci-g3-w02-thu.json` | 012d55fed5e7 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.4 | pending | reviewed v1.0.0 |
| `ci-g3-w02-fri` | `content/playlists/ci-g3/keys/ci-g3-w02-fri.json` | 4890ea1f6ca1 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.4 | pending | transcribed v1.0.0 |
| `ci-g3-w03-mon` | `content/playlists/ci-g3/keys/ci-g3-w03-mon.json` | 1331fb86bf0b | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.5 | pending | transcribed v1.0.0 |
| `ci-g3-w03-tue` | `content/playlists/ci-g3/keys/ci-g3-w03-tue.json` | 8b42f13d2992 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.5 | pending | transcribed v1.0.0 |
| `ci-g3-w03-wed` | `content/playlists/ci-g3/keys/ci-g3-w03-wed.json` | f9d6f1c0797e | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.5 | pending | transcribed v1.0.0 |
| `ci-g3-w03-thu` | `content/playlists/ci-g3/keys/ci-g3-w03-thu.json` | 2078f50539c6 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.5,6 | pending | reviewed v1.0.0 |
| `ci-g3-w03-fri` | `content/playlists/ci-g3/keys/ci-g3-w03-fri.json` | 4210618866d9 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.6 | pending | transcribed v1.0.0 |
| `ci-g3-w04-mon` | `content/playlists/ci-g3/keys/ci-g3-w04-mon.json` | fcfba2a4a7a9 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.5,6 | pending | transcribed v1.0.0 |
| `ci-g3-w04-tue` | `content/playlists/ci-g3/keys/ci-g3-w04-tue.json` | 5523f4880382 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.6,7 | pending | transcribed v1.0.0 |
| `ci-g3-w04-wed` | `content/playlists/ci-g3/keys/ci-g3-w04-wed.json` | f9088907566c | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.7 | pending | transcribed v1.0.0 |
| `ci-g3-w04-thu` | `content/playlists/ci-g3/keys/ci-g3-w04-thu.json` | 8d6b71958e23 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.6,7 | pending | reviewed v1.0.0 |
| `ci-g3-w04-fri` | `content/playlists/ci-g3/keys/ci-g3-w04-fri.json` | 1f39363ded93 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.7 | pending | transcribed v1.0.0 |
| `ci-g3-w05-mon` | `content/playlists/ci-g3/keys/ci-g3-w05-mon.json` | 9c027abee6b5 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.8 | pending | transcribed v1.0.0 |
| `ci-g3-w05-tue` | `content/playlists/ci-g3/keys/ci-g3-w05-tue.json` | 105941a8663d | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.8 | pending | transcribed v1.0.0 |
| `ci-g3-w05-wed` | `content/playlists/ci-g3/keys/ci-g3-w05-wed.json` | 707137cde9c6 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.8 | pending | transcribed v1.0.0 |
| `ci-g3-w05-thu` | `content/playlists/ci-g3/keys/ci-g3-w05-thu.json` | 9c0cc56f9970 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.8,9 | pending | transcribed v1.0.0 |
| `ci-g3-w05-fri` | `content/playlists/ci-g3/keys/ci-g3-w05-fri.json` | b0ea088548d4 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.9 | pending | transcribed v1.0.0 |
| `ci-g3-w06-mon` | `content/playlists/ci-g3/keys/ci-g3-w06-mon.json` | e5ef9b782913 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.8,9,10 | pending | transcribed v1.0.0 |
| `ci-g3-w06-tue` | `content/playlists/ci-g3/keys/ci-g3-w06-tue.json` | 3c4acc7773a1 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.10 | pending | transcribed v1.0.0 |
| `ci-g3-w06-wed` | `content/playlists/ci-g3/keys/ci-g3-w06-wed.json` | 4795ef518a96 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.10 | pending | transcribed v1.0.0 |
| `ci-g3-w06-thu` | `content/playlists/ci-g3/keys/ci-g3-w06-thu.json` | 71d7615ffcfc | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.10 | pending | transcribed v1.0.0 |
| `ci-g3-w06-fri` | `content/playlists/ci-g3/keys/ci-g3-w06-fri.json` | ef01562c42ef | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.10,11 | pending | transcribed v1.0.0 |
| `ci-g3-w07-mon` | `content/playlists/ci-g3/keys/ci-g3-w07-mon.json` | c86ff3e0b9ee | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.10,11 | pending | transcribed v1.0.0 |
| `ci-g3-w07-tue` | `content/playlists/ci-g3/keys/ci-g3-w07-tue.json` | 01ce2b49f342 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.11 | pending | transcribed v1.0.0 |
| `ci-g3-w07-wed` | `content/playlists/ci-g3/keys/ci-g3-w07-wed.json` | ac24a62bf4d3 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.11 | pending | transcribed v1.0.0 |
| `ci-g3-w07-thu` | `content/playlists/ci-g3/keys/ci-g3-w07-thu.json` | 4eae13596a1a | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.12 | pending | transcribed v1.0.0 |
| `ci-g3-w07-fri` | `content/playlists/ci-g3/keys/ci-g3-w07-fri.json` | d02d4f14f7d5 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.12 | pending | transcribed v1.0.0 |
| `ci-g3-w08-mon` | `content/playlists/ci-g3/keys/ci-g3-w08-mon.json` | 217898038141 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.11 | pending | transcribed v1.0.0 |
| `ci-g3-w08-tue` | `content/playlists/ci-g3/keys/ci-g3-w08-tue.json` | 41334da921fb | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g3-w08-wed` | `content/playlists/ci-g3/keys/ci-g3-w08-wed.json` | f83b8de02c75 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g3-w08-thu` | `content/playlists/ci-g3/keys/ci-g3-w08-thu.json` | 68f6aa688393 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g3-w08-fri` | `content/playlists/ci-g3/keys/ci-g3-w08-fri.json` | aecb6fd63f4e | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.13,14 | pending | transcribed v1.0.0 |
| `ci-g3-w09-mon` | `content/playlists/ci-g3/keys/ci-g3-w09-mon.json` | ec18ef2602c8 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g3-w09-tue` | `content/playlists/ci-g3/keys/ci-g3-w09-tue.json` | 533ad2a13cf9 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.14 | pending | transcribed v1.0.0 |
| `ci-g3-w09-wed` | `content/playlists/ci-g3/keys/ci-g3-w09-wed.json` | 9a34f3bd57d8 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.14,15 | pending | transcribed v1.0.0 |
| `ci-g3-w09-thu` | `content/playlists/ci-g3/keys/ci-g3-w09-thu.json` | 5b668784367c | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.15 | pending | transcribed v1.0.0 |
| `ci-g3-w09-fri` | `content/playlists/ci-g3/keys/ci-g3-w09-fri.json` | 5be6b6eea7bd | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.15 | pending | transcribed v1.0.0 |
| `ci-g3-w10-mon` | `content/playlists/ci-g3/keys/ci-g3-w10-mon.json` | d2642367f058 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.16 | pending | transcribed v1.0.0 |
| `ci-g3-w10-tue` | `content/playlists/ci-g3/keys/ci-g3-w10-tue.json` | 08201f8ad4e7 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.16 | pending | transcribed v1.0.0 |
| `ci-g3-w10-wed` | `content/playlists/ci-g3/keys/ci-g3-w10-wed.json` | 9030fefd4e07 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.16 | pending | transcribed v1.0.0 |
| `ci-g3-w10-thu` | `content/playlists/ci-g3/keys/ci-g3-w10-thu.json` | 2960e7348207 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.16,17 | pending | transcribed v1.0.0 |
| `ci-g3-w10-fri` | `content/playlists/ci-g3/keys/ci-g3-w10-fri.json` | 158a0dcf64a3 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.16,17 | pending | transcribed v1.0.0 |
| `ci-g3-w11-mon` | `content/playlists/ci-g3/keys/ci-g3-w11-mon.json` | b4f28f8dfa43 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.17,18 | pending | transcribed v1.0.0 |
| `ci-g3-w11-tue` | `content/playlists/ci-g3/keys/ci-g3-w11-tue.json` | 8100542139e0 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g3-w11-wed` | `content/playlists/ci-g3/keys/ci-g3-w11-wed.json` | 978a533227e5 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g3-w11-thu` | `content/playlists/ci-g3/keys/ci-g3-w11-thu.json` | 60549f95d79f | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g3-w11-fri` | `content/playlists/ci-g3/keys/ci-g3-w11-fri.json` | 2fd5026a2395 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18,19 | pending | transcribed v1.0.0 |
| `ci-g3-w12-mon` | `content/playlists/ci-g3/keys/ci-g3-w12-mon.json` | 8db4c7c261b4 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g3-w12-tue` | `content/playlists/ci-g3/keys/ci-g3-w12-tue.json` | 25f29ddc72ab | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g3-w12-wed` | `content/playlists/ci-g3/keys/ci-g3-w12-wed.json` | 388795bc7b20 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.18,19 | pending | transcribed v1.0.0 |
| `ci-g3-w12-thu` | `content/playlists/ci-g3/keys/ci-g3-w12-thu.json` | 8a919c982ef4 | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.20 | pending | transcribed v1.0.0 |
| `ci-g3-w12-fri` | `content/playlists/ci-g3/keys/ci-g3-w12-fri.json` | aca7116e7d2e | official | 小学英语时文阅读提分训练3+X3年级答案.pdf p.19 | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 149 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 62 | 可适配（single-selection，按空；需逐题核对） |
| 共享词／句库（gapMatch） | 39 | 可适配（slot-selection） |
| 开放问答（extendedText） | 27 | 待平台适配（含 LLM 评分） |
| 连线（match） | 3 | 待平台适配（含一对多） |

### ci-xsc · 英语时文阅读｜提分训练3+X｜小升初

- 合集封面：`assets/ci-xsc/cover.jpg`（书籍封面扫描，sha256:fc79e67ecafd）；gradeBand：G6（学校年级，不等于 UniRead L 等级）；本次交付 6 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-xsc-w05-thu-s1` | Beijing Gives First License to Robot Chefs · 填空 | `ci-xsc-w05-thu` | `s1` | `ci-xsc-w05-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 文本填空 | — |
| 2 | `ci-xsc-w06-mon-s1` | Various Advertisements · 阅读选择 | `ci-xsc-w06-mon` | `s1` | `ci-xsc-w06-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 3 | `ci-xsc-w06-thu-s1` | Aiming for the Top · 选词填空 | `ci-xsc-w06-thu` | `s1` | `ci-xsc-w06-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 4 | `ci-xsc-w10-thu-s1` | A Trip to England · 选词填空 | `ci-xsc-w10-thu` | `s1` | `ci-xsc-w10-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-xsc-w12-thu-s1` | Is Mars Similar to Earth? · 填空 | `ci-xsc-w12-thu` | `s1` | `ci-xsc-w12-thu-article`（1 个大题共用） | q1–q7／7 | 7 | 文本填空 | — |
| 6 | `ci-xsc-w17-fri-s1` | A Day in Space · I. 判断正误 | `ci-xsc-w17-fri` | `s1` | `ci-xsc-w17-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 7 | `ci-xsc-w17-fri-s2` | A Day in Space · II. 连线 | `ci-xsc-w17-fri` | `s2` | `ci-xsc-w17-fri-article`（2 个大题共用） | q5–q5／1 | 4 | 连线 | — |

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

- 合集封面：`assets/ci-g7/cover.jpg`（书籍封面扫描，sha256:d0ba4da5a560）；gradeBand：G7（学校年级，不等于 UniRead L 等级）；本次交付 90 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-g7-w01-mon-s1` | Bye Bye, Balltze · 阅读选择 | `ci-g7-w01-mon` | `s1` | `ci-g7-w01-mon-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 2 | `ci-g7-w01-tue-s1` | Swords Into Plowshares: A Road to Peace · 阅读选择 | `ci-g7-w01-tue` | `s1` | `ci-g7-w01-tue-article`（1 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 3 | `ci-g7-w01-wed-s1` | Meet the 19-Year-Old Lego Star · 完形填空 | `ci-g7-w01-wed` | `s1` | `ci-g7-w01-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 4 | `ci-g7-w01-thu-s1` | Phantom Blade Zero: A Playable Kung Fu Movie · 选词填空 | `ci-g7-w01-thu` | `s1` | `ci-g7-w01-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 共享词／句库 | 本大题内 12 项供 10 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-g7-w01-fri-s1` | Why Are Fried Foods Bad for You? · I. 回答问题 | `ci-g7-w01-fri` | `s1` | `ci-g7-w01-fri-article`（3 个大题共用） | q1–q6／6 | 10 | 开放问答 | — |
| 6 | `ci-g7-w01-fri-s2` | Why Are Fried Foods Bad for You? · II. 填空 | `ci-g7-w01-fri` | `s2` | `ci-g7-w01-fri-article`（3 个大题共用） | q7–q12／6 | 6 | 文本填空 | — |
| 7 | `ci-g7-w01-fri-s3` | Why Are Fried Foods Bad for You? · III. 填空／连词成句 | `ci-g7-w01-fri` | `s3` | `ci-g7-w01-fri-article`（3 个大题共用） | q13–q17／5 | 5 | 文本填空、连词成句 | — |
| 8 | `ci-g7-w02-mon-s1` | EV Batteries Get New Life · 阅读选择 | `ci-g7-w02-mon` | `s1` | `ci-g7-w02-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 9 | `ci-g7-w02-tue-s1` | Small Island, Big Goal! · 阅读选择 | `ci-g7-w02-tue` | `s1` | `ci-g7-w02-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 10 | `ci-g7-w02-wed-s1` | Holding Out a “Paw” Overseas · 完形填空 | `ci-g7-w02-wed` | `s1` | `ci-g7-w02-wed-article`（1 个大题共用） | q1–q15／15 | 15 | 完形（每空单选） | — |
| 11 | `ci-g7-w02-thu-s1` | Raising Your OpenClaw Lobster: A Pet or a Beast? · 回答问题 | `ci-g7-w02-thu` | `s1` | `ci-g7-w02-thu-article`（1 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 12 | `ci-g7-w02-fri-s1` | Charging Bull · I. 阅读选择 | `ci-g7-w02-fri` | `s1` | `ci-g7-w02-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 13 | `ci-g7-w02-fri-s2` | Charging Bull · II. 填空 | `ci-g7-w02-fri` | `s2` | `ci-g7-w02-fri-article`（3 个大题共用） | q5–q9／5 | 5 | 文本填空 | — |
| 14 | `ci-g7-w02-fri-s3` | Charging Bull · III. 填空／连词成句 | `ci-g7-w02-fri` | `s3` | `ci-g7-w02-fri-article`（3 个大题共用） | q10–q14／5 | 5 | 文本填空、连词成句 | — |
| 15 | `ci-g7-w03-mon-s1` | Cloned AI Singers · 阅读选择 | `ci-g7-w03-mon` | `s1` | `ci-g7-w03-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 16 | `ci-g7-w03-tue-s1` | Bye, Wimbledon · 阅读选择 | `ci-g7-w03-tue` | `s1` | `ci-g7-w03-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 17 | `ci-g7-w03-wed-s1` | No More Scoring Pressure: A New Chapter for Biology and Geography · 完形填空 | `ci-g7-w03-wed` | `s1` | `ci-g7-w03-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 18 | `ci-g7-w03-thu-s1` | Faster than a Train: Meet “The Beast” and Its Creator · 填空 | `ci-g7-w03-thu` | `s1` | `ci-g7-w03-thu-article`（1 个大题共用） | q1–q8／8 | 8 | 文本填空 | — |
| 19 | `ci-g7-w03-fri-s1` | Here’s Your Ice Cream! · I. 回答问题 | `ci-g7-w03-fri` | `s1` | `ci-g7-w03-fri-article`（3 个大题共用） | q1–q4／4 | 8 | 开放问答 | — |
| 20 | `ci-g7-w03-fri-s2` | Here’s Your Ice Cream! · II. 填空 | `ci-g7-w03-fri` | `s2` | `ci-g7-w03-fri-article`（3 个大题共用） | q5–q9／5 | 5 | 文本填空 | — |
| 21 | `ci-g7-w03-fri-s3` | Here’s Your Ice Cream! · III. 填空／连词成句 | `ci-g7-w03-fri` | `s3` | `ci-g7-w03-fri-article`（3 个大题共用） | q10–q14／5 | 5 | 文本填空、连词成句 | — |
| 22 | `ci-g7-w04-mon-s1` | Playing the Erhu in Italy and Beyond · 阅读选择 | `ci-g7-w04-mon` | `s1` | `ci-g7-w04-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 23 | `ci-g7-w04-tue-s1` | The Other Side of Taylor Swift · 阅读选择 | `ci-g7-w04-tue` | `s1` | `ci-g7-w04-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 24 | `ci-g7-w04-wed-s1` | Let Them Glow · 完形填空 | `ci-g7-w04-wed` | `s1` | `ci-g7-w04-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 25 | `ci-g7-w04-thu-s1` | Teen’s Phone Scary Movie Wows Australia · 回答问题 | `ci-g7-w04-thu` | `s1` | `ci-g7-w04-thu-article`（1 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 26 | `ci-g7-w04-fri-s1` | Banana Women · I. 阅读选择 | `ci-g7-w04-fri` | `s1` | `ci-g7-w04-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 27 | `ci-g7-w04-fri-s2` | Banana Women · II. 填空 | `ci-g7-w04-fri` | `s2` | `ci-g7-w04-fri-article`（3 个大题共用） | q5–q10／6 | 6 | 文本填空 | — |
| 28 | `ci-g7-w04-fri-s3` | Banana Women · III. 填空／连词成句 | `ci-g7-w04-fri` | `s3` | `ci-g7-w04-fri-article`（3 个大题共用） | q11–q16／6 | 6 | 文本填空、连词成句 | — |
| 29 | `ci-g7-w05-mon-s1` | Jay’s Beat Goes On · 阅读选择 | `ci-g7-w05-mon` | `s1` | `ci-g7-w05-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 30 | `ci-g7-w05-tue-s1` | This Coffee Van Helps Stray Cats · 阅读选择 | `ci-g7-w05-tue` | `s1` | `ci-g7-w05-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 31 | `ci-g7-w05-wed-s1` | What a Perfect Match! · 完形填空 | `ci-g7-w05-wed` | `s1` | `ci-g7-w05-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 32 | `ci-g7-w05-thu-s1` | Samara Joy Is Helping Jazz Find New Ears · 选词填空 | `ci-g7-w05-thu` | `s1` | `ci-g7-w05-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 33 | `ci-g7-w05-fri-s1` | How Do Scabs Form? · I. 回答问题 | `ci-g7-w05-fri` | `s1` | `ci-g7-w05-fri-article`（3 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 34 | `ci-g7-w05-fri-s2` | How Do Scabs Form? · II. 填空 | `ci-g7-w05-fri` | `s2` | `ci-g7-w05-fri-article`（3 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 35 | `ci-g7-w05-fri-s3` | How Do Scabs Form? · III. 填空／连词成句 | `ci-g7-w05-fri` | `s3` | `ci-g7-w05-fri-article`（3 个大题共用） | q11–q15／5 | 5 | 文本填空、连词成句 | — |
| 36 | `ci-g7-w06-mon-s1` | The Daughter of Dunhuang · 阅读选择 | `ci-g7-w06-mon` | `s1` | `ci-g7-w06-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 37 | `ci-g7-w06-tue-s1` | “Diving Grandpas” in Tianjin · 阅读选择 | `ci-g7-w06-tue` | `s1` | `ci-g7-w06-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 38 | `ci-g7-w06-wed-s1` | Has Tipping Culture Gone Too Far? · 完形填空 | `ci-g7-w06-wed` | `s1` | `ci-g7-w06-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 39 | `ci-g7-w06-thu-s1` | “Oops, My Tooth Fell Out!” · 选词填空 | `ci-g7-w06-thu` | `s1` | `ci-g7-w06-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 共享词／句库 | 本大题内 12 项供 10 空，每项限用一次，改选即从原空释放 |
| 40 | `ci-g7-w06-fri-s1` | Why Do We Eat Birthday Cakes? · I. 回答问题 | `ci-g7-w06-fri` | `s1` | `ci-g7-w06-fri-article`（3 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 41 | `ci-g7-w06-fri-s2` | Why Do We Eat Birthday Cakes? · II. 填空 | `ci-g7-w06-fri` | `s2` | `ci-g7-w06-fri-article`（3 个大题共用） | q6–q11／6 | 6 | 文本填空 | — |
| 42 | `ci-g7-w06-fri-s3` | Why Do We Eat Birthday Cakes? · III. 填空／连词成句 | `ci-g7-w06-fri` | `s3` | `ci-g7-w06-fri-article`（3 个大题共用） | q12–q16／5 | 5 | 文本填空、连词成句 | — |
| 43 | `ci-g7-w07-mon-s1` | Pits? No, Pets! · 阅读选择 | `ci-g7-w07-mon` | `s1` | `ci-g7-w07-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 44 | `ci-g7-w07-tue-s1` | “Secret Code” for a Free Meal · 阅读选择 | `ci-g7-w07-tue` | `s1` | `ci-g7-w07-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 45 | `ci-g7-w07-wed-s1` | 500 Days of Darkness · 完形填空 | `ci-g7-w07-wed` | `s1` | `ci-g7-w07-wed-article`（1 个大题共用） | q1–q15／15 | 15 | 完形（每空单选） | — |
| 46 | `ci-g7-w07-thu-s1` | Harder Languages · 填空 | `ci-g7-w07-thu` | `s1` | `ci-g7-w07-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 文本填空 | — |
| 47 | `ci-g7-w07-fri-s1` | What Cheerleading Teaches Me · I. 阅读选择 | `ci-g7-w07-fri` | `s1` | `ci-g7-w07-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 48 | `ci-g7-w07-fri-s2` | What Cheerleading Teaches Me · II. 选词填空 | `ci-g7-w07-fri` | `s2` | `ci-g7-w07-fri-article`（3 个大题共用） | q5–q10／6 | 6 | 共享词／句库 | 本大题内 6 项供 6 空，每项限用一次，改选即从原空释放 |
| 49 | `ci-g7-w07-fri-s3` | What Cheerleading Teaches Me · III. 填空／连词成句 | `ci-g7-w07-fri` | `s3` | `ci-g7-w07-fri-article`（3 个大题共用） | q11–q15／5 | 5 | 文本填空、连词成句 | — |
| 50 | `ci-g7-w08-mon-s1` | Shout Your Stress Away · 阅读选择 | `ci-g7-w08-mon` | `s1` | `ci-g7-w08-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 51 | `ci-g7-w08-tue-s1` | The Dangers of Thirdhand Smoke · 阅读选择 | `ci-g7-w08-tue` | `s1` | `ci-g7-w08-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 52 | `ci-g7-w08-wed-s1` | Airport Pups Help Calm Nervous Flyers · 完形填空 | `ci-g7-w08-wed` | `s1` | `ci-g7-w08-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 53 | `ci-g7-w08-thu-s1` | The Art of the Brick · 回答问题 | `ci-g7-w08-thu` | `s1` | `ci-g7-w08-thu-article`（1 个大题共用） | q1–q6／6 | 6 | 开放问答 | — |
| 54 | `ci-g7-w08-fri-s1` | Eat Your Way Around Thailand · I. 阅读选择 | `ci-g7-w08-fri` | `s1` | `ci-g7-w08-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 55 | `ci-g7-w08-fri-s2` | Eat Your Way Around Thailand · II. 选词填空 | `ci-g7-w08-fri` | `s2` | `ci-g7-w08-fri-article`（3 个大题共用） | q5–q10／6 | 6 | 共享词／句库 | 本大题内 6 项供 6 空，每项限用一次，改选即从原空释放 |
| 56 | `ci-g7-w08-fri-s3` | Eat Your Way Around Thailand · III. 填空／连词成句 | `ci-g7-w08-fri` | `s3` | `ci-g7-w08-fri-article`（3 个大题共用） | q11–q15／5 | 5 | 文本填空、连词成句 | — |
| 57 | `ci-g7-w09-mon-s1` | Waikiki Clears the Way for Seals · I. 阅读选择 | `ci-g7-w09-mon` | `s1` | `ci-g7-w09-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 58 | `ci-g7-w09-tue-s1` | 80-Year-Old Becomes Oldest Woman to Finish Ironman · I. 阅读选择 | `ci-g7-w09-tue` | `s1` | `ci-g7-w09-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 59 | `ci-g7-w09-wed-s1` | Who Is the World’s Cutest Panda? · I. 完形填空 | `ci-g7-w09-wed` | `s1` | `ci-g7-w09-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 60 | `ci-g7-w09-thu-s1` | Her Hidden Name · I. 填空 | `ci-g7-w09-thu` | `s1` | `ci-g7-w09-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 文本填空 | — |
| 61 | `ci-g7-w09-fri-s1` | Why Do Our Teeth Become Sensitive? · I. 回答问题 | `ci-g7-w09-fri` | `s1` | `ci-g7-w09-fri-article`（3 个大题共用） | q1–q6／6 | 9 | 开放问答 | — |
| 62 | `ci-g7-w09-fri-s2` | Why Do Our Teeth Become Sensitive? · II. 选词填空 | `ci-g7-w09-fri` | `s2` | `ci-g7-w09-fri-article`（3 个大题共用） | q7–q12／6 | 6 | 共享词／句库 | 本大题内 6 项供 6 空，每项限用一次，改选即从原空释放 |
| 63 | `ci-g7-w09-fri-s3` | Why Do Our Teeth Become Sensitive? · III. 填空／连词成句 | `ci-g7-w09-fri` | `s3` | `ci-g7-w09-fri-article`（3 个大题共用） | q13–q17／5 | 5 | 文本填空、连词成句 | — |
| 64 | `ci-g7-w10-mon-s1` | You’re Not Sick Anymore—Why Are You Still Coughing? · 阅读选择 | `ci-g7-w10-mon` | `s1` | `ci-g7-w10-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 65 | `ci-g7-w10-tue-s1` | Around the Bed in 60 Days · 阅读选择 | `ci-g7-w10-tue` | `s1` | `ci-g7-w10-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 66 | `ci-g7-w10-wed-s1` | No, They’re Not Photographs · 完形填空 | `ci-g7-w10-wed` | `s1` | `ci-g7-w10-wed-article`（1 个大题共用） | q1–q15／15 | 15 | 完形（每空单选） | — |
| 67 | `ci-g7-w10-thu-s1` | My Harry Potter Paper Artworks · 回答问题 | `ci-g7-w10-thu` | `s1` | `ci-g7-w10-thu-article`（1 个大题共用） | q1–q6／6 | 6 | 开放问答 | — |
| 68 | `ci-g7-w10-fri-s1` | Top Ski Resorts in Beijing · I. 回答问题 | `ci-g7-w10-fri` | `s1` | `ci-g7-w10-fri-article`（3 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 69 | `ci-g7-w10-fri-s2` | Top Ski Resorts in Beijing · II. 填空 | `ci-g7-w10-fri` | `s2` | `ci-g7-w10-fri-article`（3 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 70 | `ci-g7-w10-fri-s3` | Top Ski Resorts in Beijing · III. 填空／连词成句 | `ci-g7-w10-fri` | `s3` | `ci-g7-w10-fri-article`（3 个大题共用） | q11–q15／5 | 5 | 文本填空、连词成句 | — |
| 71 | `ci-g7-w11-mon-s1` | Helping Babies Like Her · 阅读选择 | `ci-g7-w11-mon` | `s1` | `ci-g7-w11-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 72 | `ci-g7-w11-tue-s1` | From Small Town Girl to International Star · 阅读选择 | `ci-g7-w11-tue` | `s1` | `ci-g7-w11-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 73 | `ci-g7-w11-wed-s1` | Let’s Play Ping Pong! · 完形填空 | `ci-g7-w11-wed` | `s1` | `ci-g7-w11-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 74 | `ci-g7-w11-thu-s1` | Insects Up Close · 选词填空 | `ci-g7-w11-thu` | `s1` | `ci-g7-w11-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 75 | `ci-g7-w11-fri-s1` | A Field Trip to the Aquarium · I. 回答问题 | `ci-g7-w11-fri` | `s1` | `ci-g7-w11-fri-article`（3 个大题共用） | q1–q6／6 | 9 | 开放问答 | — |
| 76 | `ci-g7-w11-fri-s2` | A Field Trip to the Aquarium · II. 填空 | `ci-g7-w11-fri` | `s2` | `ci-g7-w11-fri-article`（3 个大题共用） | q7–q12／6 | 6 | 文本填空 | — |
| 77 | `ci-g7-w11-fri-s3` | A Field Trip to the Aquarium · III. 填空／连词成句 | `ci-g7-w11-fri` | `s3` | `ci-g7-w11-fri-article`（3 个大题共用） | q13–q17／5 | 5 | 文本填空、连词成句 | — |
| 78 | `ci-g7-w12-mon-s1` | “Yes, I Swallowed the Planet!” · I. 阅读选择 | `ci-g7-w12-mon` | `s1` | `ci-g7-w12-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 79 | `ci-g7-w12-tue-s1` | The Origins of Ice Sculpting · I. 阅读选择 | `ci-g7-w12-tue` | `s1` | `ci-g7-w12-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 80 | `ci-g7-w12-wed-s1` | Pictures of Cats Bring Visitors to an Old Street · I. 完形填空 | `ci-g7-w12-wed` | `s1` | `ci-g7-w12-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 81 | `ci-g7-w12-thu-s1` | Let’s Read More Novels! · I. 回答问题 | `ci-g7-w12-thu` | `s1` | `ci-g7-w12-thu-article`（1 个大题共用） | q1–q6／6 | 8 | 开放问答 | — |
| 82 | `ci-g7-w12-fri-s1` | Preparing a Picnic · I. 阅读选择 | `ci-g7-w12-fri` | `s1` | `ci-g7-w12-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 83 | `ci-g7-w12-fri-s2` | Preparing a Picnic · II. 填空 | `ci-g7-w12-fri` | `s2` | `ci-g7-w12-fri-article`（3 个大题共用） | q5–q9／5 | 5 | 文本填空 | — |
| 84 | `ci-g7-w12-fri-s3` | Preparing a Picnic · III. 填空／连词成句 | `ci-g7-w12-fri` | `s3` | `ci-g7-w12-fri-article`（3 个大题共用） | q10–q14／5 | 5 | 文本填空、连词成句 | — |
| 85 | `ci-g7-w13-mon-s1` | First-Ever 3D Scan of the Titanic · 阅读选择 | `ci-g7-w13-mon` | `s1` | `ci-g7-w13-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 86 | `ci-g7-w13-tue-s1` | Hail Is Getting Larger and More Dangerous · 阅读选择 | `ci-g7-w13-tue` | `s1` | `ci-g7-w13-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 87 | `ci-g7-w13-wed-s1` | Trash for Toilet Use · 完形填空 | `ci-g7-w13-wed` | `s1` | `ci-g7-w13-wed-article`（1 个大题共用） | q1–q15／15 | 15 | 完形（每空单选） | — |
| 88 | `ci-g7-w13-thu-s1` | World Radio Day · 填空 | `ci-g7-w13-thu` | `s1` | `ci-g7-w13-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 文本填空 | — |
| 89 | `ci-g7-w13-fri-s1` | Friendship Between Two Dogs · I. 阅读选择 | `ci-g7-w13-fri` | `s1` | `ci-g7-w13-fri-article`（3 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 90 | `ci-g7-w13-fri-s2` | Friendship Between Two Dogs · II. 填空 | `ci-g7-w13-fri` | `s2` | `ci-g7-w13-fri-article`（3 个大题共用） | q6–q11／6 | 6 | 文本填空 | — |
| 91 | `ci-g7-w13-fri-s3` | Friendship Between Two Dogs · III. 填空／连词成句 | `ci-g7-w13-fri` | `s3` | `ci-g7-w13-fri-article`（3 个大题共用） | q12–q15／4 | 4 | 文本填空、连词成句 | — |
| 92 | `ci-g7-w14-mon-s1` | Ocean Exploration Matters · 阅读选择 | `ci-g7-w14-mon` | `s1` | `ci-g7-w14-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 93 | `ci-g7-w14-tue-s1` | Disposing of E-Waste Responsibly · 阅读选择 | `ci-g7-w14-tue` | `s1` | `ci-g7-w14-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 94 | `ci-g7-w14-wed-s1` | World Bee Day · 完形填空 | `ci-g7-w14-wed` | `s1` | `ci-g7-w14-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 95 | `ci-g7-w14-thu-s1` | Learning a Skill, Enriching Your Life · 选词填空 | `ci-g7-w14-thu` | `s1` | `ci-g7-w14-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 96 | `ci-g7-w14-fri-s1` | Renting a Flat · I. 回答问题 | `ci-g7-w14-fri` | `s1` | `ci-g7-w14-fri-article`（3 个大题共用） | q1–q6／6 | 6 | 开放问答 | — |
| 97 | `ci-g7-w14-fri-s2` | Renting a Flat · II. 选词填空 | `ci-g7-w14-fri` | `s2` | `ci-g7-w14-fri-article`（3 个大题共用） | q7–q12／6 | 6 | 共享词／句库 | 本大题内 6 项供 6 空，每项限用一次，改选即从原空释放 |
| 98 | `ci-g7-w14-fri-s3` | Renting a Flat · III. 填空／连词成句 | `ci-g7-w14-fri` | `s3` | `ci-g7-w14-fri-article`（3 个大题共用） | q13–q16／4 | 4 | 文本填空、连词成句 | — |
| 99 | `ci-g7-w15-mon-s1` | Artist Brings Historical Figures Back to Life · 阅读选择 | `ci-g7-w15-mon` | `s1` | `ci-g7-w15-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 100 | `ci-g7-w15-tue-s1` | Kids Help Find 8,000-Year-Old Village · 阅读选择 | `ci-g7-w15-tue` | `s1` | `ci-g7-w15-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 101 | `ci-g7-w15-wed-s1` | Marie Curie—a Great Woman · 完形填空 | `ci-g7-w15-wed` | `s1` | `ci-g7-w15-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 102 | `ci-g7-w15-thu-s1` | An Unexpected Joy · 回答问题 | `ci-g7-w15-thu` | `s1` | `ci-g7-w15-thu-article`（1 个大题共用） | q1–q6／6 | 6 | 开放问答 | — |
| 103 | `ci-g7-w15-fri-s1` | Different Rules · I. 回答问题 | `ci-g7-w15-fri` | `s1` | `ci-g7-w15-fri-article`（3 个大题共用） | q1–q6／6 | 7 | 开放问答 | — |
| 104 | `ci-g7-w15-fri-s2` | Different Rules · II. 选词填空 | `ci-g7-w15-fri` | `s2` | `ci-g7-w15-fri-article`（3 个大题共用） | q7–q12／6 | 6 | 共享词／句库 | 本大题内 6 项供 6 空，每项限用一次，改选即从原空释放 |
| 105 | `ci-g7-w15-fri-s3` | Different Rules · III. 填空／连词成句 | `ci-g7-w15-fri` | `s3` | `ci-g7-w15-fri-article`（3 个大题共用） | q13–q17／5 | 5 | 文本填空、连词成句 | — |
| 106 | `ci-g7-w16-mon-s1` | How Dogs Could Make Children Better Readers · I. 阅读选择 | `ci-g7-w16-mon` | `s1` | `ci-g7-w16-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 107 | `ci-g7-w16-tue-s1` | Walking by the River · I. 阅读选择 | `ci-g7-w16-tue` | `s1` | `ci-g7-w16-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 108 | `ci-g7-w16-wed-s1` | What’s Your Expectation of an Ideal Life in the Future? · I. 完形填空 | `ci-g7-w16-wed` | `s1` | `ci-g7-w16-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 109 | `ci-g7-w16-thu-s1` | Creating Art Like a Child · I. 回答问题 | `ci-g7-w16-thu` | `s1` | `ci-g7-w16-thu-article`（1 个大题共用） | q1–q6／6 | 9 | 开放问答 | — |
| 110 | `ci-g7-w16-fri-s1` | Mark Twain on Stage · I. 阅读选择 | `ci-g7-w16-fri` | `s1` | `ci-g7-w16-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 111 | `ci-g7-w16-fri-s2` | Mark Twain on Stage · II. 填空 | `ci-g7-w16-fri` | `s2` | `ci-g7-w16-fri-article`（3 个大题共用） | q5–q9／5 | 5 | 文本填空 | — |
| 112 | `ci-g7-w16-fri-s3` | Mark Twain on Stage · III. 填空／连词成句 | `ci-g7-w16-fri` | `s3` | `ci-g7-w16-fri-article`（3 个大题共用） | q10–q13／4 | 4 | 文本填空、连词成句 | — |
| 113 | `ci-g7-w17-mon-s1` | The Best Is Yet to Come · I. 阅读选择 | `ci-g7-w17-mon` | `s1` | `ci-g7-w17-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 114 | `ci-g7-w17-tue-s1` | Let the Music Continue! · 阅读选择 | `ci-g7-w17-tue` | `s1` | `ci-g7-w17-tue-article`（1 个大题共用） | q1–q3／3 | 3 | 单选 | — |
| 115 | `ci-g7-w17-wed-s1` | An Unforgettable Bazaar · 完形填空 | `ci-g7-w17-wed` | `s1` | `ci-g7-w17-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 116 | `ci-g7-w17-thu-s1` | My Dancing Shoes · 填空 | `ci-g7-w17-thu` | `s1` | `ci-g7-w17-thu-article`（1 个大题共用） | q1–q10／10 | 10 | 文本填空 | — |
| 117 | `ci-g7-w17-fri-s1` | A Speech on Losing Weight · I. 阅读选择 | `ci-g7-w17-fri` | `s1` | `ci-g7-w17-fri-article`（3 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 118 | `ci-g7-w17-fri-s2` | A Speech on Losing Weight · II. 选词填空 | `ci-g7-w17-fri` | `s2` | `ci-g7-w17-fri-article`（3 个大题共用） | q5–q10／6 | 6 | 共享词／句库 | 本大题内 6 项供 6 空，每项限用一次，改选即从原空释放 |
| 119 | `ci-g7-w17-fri-s3` | A Speech on Losing Weight · III. 填空／连词成句 | `ci-g7-w17-fri` | `s3` | `ci-g7-w17-fri-article`（3 个大题共用） | q11–q16／6 | 6 | 文本填空、连词成句 | — |
| 120 | `ci-g7-w18-mon-s1` | A Bear Called Paddington · 阅读选择 | `ci-g7-w18-mon` | `s1` | `ci-g7-w18-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 121 | `ci-g7-w18-tue-s1` | Green Teen · 阅读选择 | `ci-g7-w18-tue` | `s1` | `ci-g7-w18-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 122 | `ci-g7-w18-wed-s1` | My Thoughts on Matilda · 完形填空 | `ci-g7-w18-wed` | `s1` | `ci-g7-w18-wed-article`（1 个大题共用） | q1–q10／10 | 10 | 完形（每空单选） | — |
| 123 | `ci-g7-w18-thu-s1` | Travelling Green Cases · 回答问题 | `ci-g7-w18-thu` | `s1` | `ci-g7-w18-thu-article`（1 个大题共用） | q1–q6／6 | 9 | 开放问答 | — |
| 124 | `ci-g7-w18-fri-s1` | Gym Safety Notice · I. 回答问题 | `ci-g7-w18-fri` | `s1` | `ci-g7-w18-fri-article`（3 个大题共用） | q1–q6／6 | 9 | 开放问答 | — |
| 125 | `ci-g7-w18-fri-s2` | Gym Safety Notice · II. 填空 | `ci-g7-w18-fri` | `s2` | `ci-g7-w18-fri-article`（3 个大题共用） | q7–q12／6 | 6 | 文本填空 | — |
| 126 | `ci-g7-w18-fri-s3` | Gym Safety Notice · III. 填空／连词成句 | `ci-g7-w18-fri` | `s3` | `ci-g7-w18-fri-article`（3 个大题共用） | q13–q16／4 | 4 | 文本填空、连词成句 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-g7-w01-mon` | 10／1 | 3（原书） | 213（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-tue` | 11,12／2,3 | 4（原书） | 222（原书信息框） | 9 分钟（估算：原书未印，按该年级学生平均阅读速度加做题时间估算：阅读 222 词 ÷ 40 词/分钟 ≈ 5.5 分钟 + 6 道客观题 × 0.5 分钟，取整） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-wed` | 13／4 | 4（原书） | 230（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-thu` | 14／5 | 4（原书） | 226（原书信息框） | 12 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w01-fri` | 15,16／6,7 | 2（原书） | 155（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g7/ci-g7-w01-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w01-fri-1.jpg`（裁自原书图片） |
| `ci-g7-w02-mon` | 17,18／8,9 | 5（原书） | 268（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w02-tue` | 19,20／10,11 | 3（原书） | 219（原书信息框） | 11 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w02-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w02-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w02-wed` | 21,22／12,13 | 4（原书） | 274（原书信息框） | 11 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w02-thu` | 23,24／14,15 | 3（原书） | 218（原书信息框） | 10 分钟（估算：原书未印，按该年级学生平均阅读速度加做题时间估算：阅读 218 词 ÷ 40 词/分钟 ≈ 5.5 分钟 + 5 道作答题 × 1.0 分钟，取整） | 否 | `assets/ci-g7/ci-g7-w02-thu-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w02-thu-1.jpg`（裁自原书图片） |
| `ci-g7-w02-fri` | 25,26／16,17 | 3（原书） | 156（原书信息框） | 10 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w02-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w02-fri-1.jpg`（裁自原书图片） |
| `ci-g7-w03-mon` | 27,28／18,19 | 4（原书） | 262（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w03-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w03-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w03-tue` | 29,30／20,21 | 3（原书） | 274（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w03-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w03-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w03-wed` | 31／22 | 4（原书） | 265（原书信息框） | 12 分钟（估算：原书未印，按该年级学生平均阅读速度加做题时间估算：阅读 265 词 ÷ 40 词/分钟 ≈ 6.6 分钟 + 10 道客观题 × 0.5 分钟，取整） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w03-thu` | 32／23 | 4（原书） | 212（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w03-fri` | 33,34／24,25 | 3（原书） | 254（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g7/ci-g7-w03-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w03-fri-1.jpg`（裁自原书图片） |
| `ci-g7-w04-mon` | 35,36／26,27 | 4（原书） | 214（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w04-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w04-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w04-tue` | 37,38／28,29 | 3（原书） | 223（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w04-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w04-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w04-wed` | 39／30 | 3（原书） | 189（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w04-thu` | 40／31 | 4（原书） | 211（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w04-fri` | 41,42／32,33 | 3（原书） | 187（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w05-mon` | 43,44／34,35 | 2（原书） | 274（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w05-tue` | 45,46／36,37 | 2（原书） | 205（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w05-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w05-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w05-wed` | 47／38 | 5（原书） | 229（原书信息框） | 11 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w05-thu` | 48／39 | 3（原书） | 255（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w05-fri` | 49,50／40,41 | 3（原书） | 179（原书信息框） | 14 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g7/ci-g7-w05-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w05-fri-1.jpg`（裁自原书图片） |
| `ci-g7-w06-mon` | 51,52／42,43 | 3（原书） | 231（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w06-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w06-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w06-tue` | 53,54／44,45 | 4（原书） | 247（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w06-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w06-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w06-wed` | 55／46 | 4（原书） | 237（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w06-thu` | 56／47 | 2（原书） | 207（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w06-fri` | 57,58／48,49 | 2（原书） | 184（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g7/ci-g7-w06-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w06-fri-1.jpg`（裁自原书图片） |
| `ci-g7-w07-mon` | 59,60／50,51 | 3（原书） | 221（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w07-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w07-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w07-tue` | 61,62／52,53 | 2（原书） | 195（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w07-wed` | 63／54 | 4（原书） | 226（原书信息框） | 12 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w07-thu` | 64／55 | 3（原书） | 213（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w07-fri` | 65,66／56,57 | 2（原书） | 188（原书信息框） | 10 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w08-mon` | 67,68／58,59 | 3（原书） | 194（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w08-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w08-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w08-tue` | 69,70／60,61 | 3（原书） | 176（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w08-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w08-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w08-wed` | 71／62 | 3（原书） | 188（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w08-thu` | 72／63 | 3（原书） | 169（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w08-fri` | 73,74／64,65 | 2（原书） | 199（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w09-mon` | 75,76／66,67 | 3（原书） | 208（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w09-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w09-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w09-tue` | 77,78／68,69 | 3（原书） | 186（原书信息框） | 10 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w09-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w09-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w09-wed` | 79／70 | 3（原书） | 271（原书信息框） | 9 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w09-thu` | 80／71 | 4（原书） | 244（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w09-fri` | 81,82／72,73 | 3（原书） | 148（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w10-mon` | 83,84／74,75 | 4（原书） | 178（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w10-tue` | 85,86／76,77 | 3（原书） | 239（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w10-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w10-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w10-wed` | 87／78 | 3（原书） | 224（原书信息框） | 11 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w10-thu` | 88／79 | 2（原书） | 178（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w10-fri` | 89,90／80,81 | 2（原书） | 211（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w11-mon` | 91,92／82,83 | 3（原书） | 186（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w11-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w11-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w11-tue` | 93,94／84,85 | 3（原书） | 183（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w11-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w11-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w11-wed` | 95／86 | 4（原书） | 217（原书信息框） | 11 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w11-thu` | 96／87 | 3（原书） | 268（原书信息框） | 9 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w11-fri` | 97,98／88,89 | 1（原书） | 224（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w12-mon` | 99,100／90,91 | 5（原书） | 226（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w12-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w12-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w12-tue` | 101,102／92,93 | 2（原书） | 198（原书信息框） | 10 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w12-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w12-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w12-wed` | 103／94 | 4（原书） | 235（原书信息框） | 9 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w12-thu` | 104／95 | 3（原书） | 167（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w12-fri` | 105,106／96,97 | 2（原书） | 165（原书信息框） | 8 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g7/ci-g7-w12-fri-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w12-fri-1.jpg`（裁自原书图片） |
| `ci-g7-w13-mon` | 107,108／98,99 | 3（原书） | 210（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w13-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w13-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w13-tue` | 109,110／100,101 | 5（原书） | 210（原书信息框） | 11 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w13-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w13-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w13-wed` | 111／102 | 3（原书） | 231（原书信息框） | 12 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w13-thu` | 112／103 | 3（原书） | 170（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w13-thu-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w13-thu-1.jpg`（裁自原书图片） |
| `ci-g7-w13-fri` | 113,114／104,105 | 2（原书） | 185（原书信息框） | 10 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w14-mon` | 115,116／106,107 | 3（原书） | 193（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w14-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w14-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w14-tue` | 117,118／108,109 | 3（原书） | 226（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w14-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w14-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w14-wed` | 119／110 | 3（原书） | 204（原书信息框） | 9 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w14-thu` | 120／111 | 3（原书） | 361（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w14-fri` | 121,122／112,113 | 1（原书） | 190（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w15-mon` | 123,124／114,115 | 4（原书） | 196（原书信息框） | 10 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w15-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w15-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w15-tue` | 125,126／116,117 | 3（原书） | 219（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w15-tue-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w15-tue-1.jpg`（裁自原书图片） |
| `ci-g7-w15-wed` | 127／118 | 4（原书） | 250（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w15-thu` | 128／119 | 3（原书） | 235（原书信息框） | 9 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w15-fri` | 129,130／120,121 | 3（原书） | 205（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w16-mon` | 131,132／122,123 | 3（原书） | 189（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w16-mon-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w16-mon-1.jpg`（裁自原书图片） |
| `ci-g7-w16-tue` | 133,134／124,125 | 3（原书） | 315（原书信息框） | 12 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w16-wed` | 135,136／126,127 | 3（原书） | 360（原书信息框） | 12 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w16-wed-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w16-wed-1.jpg`（裁自原书图片） |
| `ci-g7-w16-thu` | 137,138／128,129 | 4（原书） | 264（原书信息框） | 9 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w16-thu-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w16-thu-1.jpg`（裁自原书图片） |
| `ci-g7-w16-fri` | 139,140／130,131 | 4（原书） | 337（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w17-mon` | 141／132 | 3（原书） | 194（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w17-tue` | 142／133 | 3（原书） | 266（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w17-wed` | 143／134 | 3（原书） | 239（原书信息框） | 11 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w17-thu` | 144／135 | 4（原书） | 301（原书信息框） | 10 分钟（原书） | 否 | `assets/ci-g7/ci-g7-w17-thu-1.jpg` | 独立文件 `assets/ci-g7/ci-g7-w17-thu-1.jpg`（裁自原书图片） |
| `ci-g7-w17-fri` | 145,146／136,137 | 2（原书） | 199（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w18-mon` | 147／138 | 3（原书） | 217（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w18-tue` | 148／139 | 3（原书） | 200（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w18-wed` | 149／140 | 3（原书） | 216（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w18-thu` | 150／141 | 3（原书） | 177（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g7-w18-fri` | 151,152／142,143 | 2（原书） | 154（原书信息框） | 9 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-g7-w01-mon` | `content/playlists/ci-g7/keys/ci-g7-w01-mon.json` | e31293ec92fa | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g7-w01-tue` | `content/playlists/ci-g7/keys/ci-g7-w01-tue.json` | 8a81faeec6ad | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.2 | pending | reviewed v1.0.0 |
| `ci-g7-w01-wed` | `content/playlists/ci-g7/keys/ci-g7-w01-wed.json` | 89de827e6439 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.2,3 | pending | reviewed v1.0.0 |
| `ci-g7-w01-thu` | `content/playlists/ci-g7/keys/ci-g7-w01-thu.json` | d3fd83ee8624 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.3 | pending | reviewed v1.0.0 |
| `ci-g7-w01-fri` | `content/playlists/ci-g7/keys/ci-g7-w01-fri.json` | 83ef666135d7 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.3,4 | pending | reviewed v1.0.0 |
| `ci-g7-w02-mon` | `content/playlists/ci-g7/keys/ci-g7-w02-mon.json` | 3bc7304d4c2e | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.4 | pending | transcribed v1.0.0 |
| `ci-g7-w02-tue` | `content/playlists/ci-g7/keys/ci-g7-w02-tue.json` | 1bed2f2a67da | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.4 | pending | transcribed v1.0.0 |
| `ci-g7-w02-wed` | `content/playlists/ci-g7/keys/ci-g7-w02-wed.json` | f119a97b0d16 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.4,5 | pending | transcribed v1.0.0 |
| `ci-g7-w02-thu` | `content/playlists/ci-g7/keys/ci-g7-w02-thu.json` | bf7a7ac754ce | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.5,6 | pending | transcribed v1.0.0 |
| `ci-g7-w02-fri` | `content/playlists/ci-g7/keys/ci-g7-w02-fri.json` | 2760e3822f16 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.6 | pending | transcribed v1.0.0 |
| `ci-g7-w03-mon` | `content/playlists/ci-g7/keys/ci-g7-w03-mon.json` | c9ebd3d5bc23 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.6 | pending | transcribed v1.0.0 |
| `ci-g7-w03-tue` | `content/playlists/ci-g7/keys/ci-g7-w03-tue.json` | 0b56e56c9f98 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.6,7 | pending | transcribed v1.0.0 |
| `ci-g7-w03-wed` | `content/playlists/ci-g7/keys/ci-g7-w03-wed.json` | c18dcac9e522 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.7 | pending | transcribed v1.0.0 |
| `ci-g7-w03-thu` | `content/playlists/ci-g7/keys/ci-g7-w03-thu.json` | 3718b5f81791 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.7 | pending | transcribed v1.0.0 |
| `ci-g7-w03-fri` | `content/playlists/ci-g7/keys/ci-g7-w03-fri.json` | 49542b3cd393 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.8 | pending | transcribed v1.0.0 |
| `ci-g7-w04-mon` | `content/playlists/ci-g7/keys/ci-g7-w04-mon.json` | e8d79cb03ada | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.8 | pending | transcribed v1.0.0 |
| `ci-g7-w04-tue` | `content/playlists/ci-g7/keys/ci-g7-w04-tue.json` | 1a6bd9d93d68 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.8 | pending | transcribed v1.0.0 |
| `ci-g7-w04-wed` | `content/playlists/ci-g7/keys/ci-g7-w04-wed.json` | 29e5a4837c7d | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.9 | pending | transcribed v1.0.0 |
| `ci-g7-w04-thu` | `content/playlists/ci-g7/keys/ci-g7-w04-thu.json` | bb20cbcb78c1 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.9 | pending | transcribed v1.0.0 |
| `ci-g7-w04-fri` | `content/playlists/ci-g7/keys/ci-g7-w04-fri.json` | 8d96022b1ae2 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.9,10 | pending | transcribed v1.0.0 |
| `ci-g7-w05-mon` | `content/playlists/ci-g7/keys/ci-g7-w05-mon.json` | 175044524bbe | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.10 | pending | transcribed v1.0.0 |
| `ci-g7-w05-tue` | `content/playlists/ci-g7/keys/ci-g7-w05-tue.json` | 18c980c5ca2f | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.10 | pending | transcribed v1.0.0 |
| `ci-g7-w05-wed` | `content/playlists/ci-g7/keys/ci-g7-w05-wed.json` | d5de8ea13d6e | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.10,11 | pending | transcribed v1.0.0 |
| `ci-g7-w05-thu` | `content/playlists/ci-g7/keys/ci-g7-w05-thu.json` | 01c09c0d89ec | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.11 | pending | transcribed v1.0.0 |
| `ci-g7-w05-fri` | `content/playlists/ci-g7/keys/ci-g7-w05-fri.json` | 557298119b2e | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.11,12 | pending | transcribed v1.0.0 |
| `ci-g7-w06-mon` | `content/playlists/ci-g7/keys/ci-g7-w06-mon.json` | f25cac601be4 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.12 | pending | transcribed v1.0.0 |
| `ci-g7-w06-tue` | `content/playlists/ci-g7/keys/ci-g7-w06-tue.json` | e017e1b00ff1 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.12 | pending | transcribed v1.0.0 |
| `ci-g7-w06-wed` | `content/playlists/ci-g7/keys/ci-g7-w06-wed.json` | 17151f426ea7 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.12,13 | pending | transcribed v1.0.0 |
| `ci-g7-w06-thu` | `content/playlists/ci-g7/keys/ci-g7-w06-thu.json` | ca886fa9a358 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g7-w06-fri` | `content/playlists/ci-g7/keys/ci-g7-w06-fri.json` | 59dd9e3ce2b9 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g7-w07-mon` | `content/playlists/ci-g7/keys/ci-g7-w07-mon.json` | de2bc9314dcb | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.14 | pending | transcribed v1.0.0 |
| `ci-g7-w07-tue` | `content/playlists/ci-g7/keys/ci-g7-w07-tue.json` | 746561c03952 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.14 | pending | transcribed v1.0.0 |
| `ci-g7-w07-wed` | `content/playlists/ci-g7/keys/ci-g7-w07-wed.json` | 81b3cca5ab57 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.14,15 | pending | transcribed v1.0.0 |
| `ci-g7-w07-thu` | `content/playlists/ci-g7/keys/ci-g7-w07-thu.json` | 836f3acdda80 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.15 | pending | transcribed v1.0.0 |
| `ci-g7-w07-fri` | `content/playlists/ci-g7/keys/ci-g7-w07-fri.json` | 175762e72f51 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.15,16 | pending | transcribed v1.0.0 |
| `ci-g7-w08-mon` | `content/playlists/ci-g7/keys/ci-g7-w08-mon.json` | 9877cda78af5 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.16 | pending | transcribed v1.0.0 |
| `ci-g7-w08-tue` | `content/playlists/ci-g7/keys/ci-g7-w08-tue.json` | dfa520ceb5db | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.16 | pending | transcribed v1.0.0 |
| `ci-g7-w08-wed` | `content/playlists/ci-g7/keys/ci-g7-w08-wed.json` | a7de0506c65c | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.16,17 | pending | transcribed v1.0.0 |
| `ci-g7-w08-thu` | `content/playlists/ci-g7/keys/ci-g7-w08-thu.json` | d0c8ff9c2e7e | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.16,17 | pending | transcribed v1.0.0 |
| `ci-g7-w08-fri` | `content/playlists/ci-g7/keys/ci-g7-w08-fri.json` | af9ce754f578 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.16,17,18 | pending | transcribed v1.0.0 |
| `ci-g7-w09-mon` | `content/playlists/ci-g7/keys/ci-g7-w09-mon.json` | 4d0a436f02f3 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g7-w09-tue` | `content/playlists/ci-g7/keys/ci-g7-w09-tue.json` | f3aa3905b5de | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g7-w09-wed` | `content/playlists/ci-g7/keys/ci-g7-w09-wed.json` | 9abc3d4e334c | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.18,19 | pending | transcribed v1.0.0 |
| `ci-g7-w09-thu` | `content/playlists/ci-g7/keys/ci-g7-w09-thu.json` | 7938c65ea527 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.19 | pending | transcribed v1.0.0 |
| `ci-g7-w09-fri` | `content/playlists/ci-g7/keys/ci-g7-w09-fri.json` | 9838204b3022 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.19,20 | pending | transcribed v1.0.0 |
| `ci-g7-w10-mon` | `content/playlists/ci-g7/keys/ci-g7-w10-mon.json` | 2d34e567b44c | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.20 | pending | transcribed v1.0.0 |
| `ci-g7-w10-tue` | `content/playlists/ci-g7/keys/ci-g7-w10-tue.json` | 4ef0ca661091 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.20 | pending | transcribed v1.0.0 |
| `ci-g7-w10-wed` | `content/playlists/ci-g7/keys/ci-g7-w10-wed.json` | 6cfd2ccae88a | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.20,21 | pending | transcribed v1.0.0 |
| `ci-g7-w10-thu` | `content/playlists/ci-g7/keys/ci-g7-w10-thu.json` | eb6c4e61d752 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.21 | pending | transcribed v1.0.0 |
| `ci-g7-w10-fri` | `content/playlists/ci-g7/keys/ci-g7-w10-fri.json` | 887fb4f89250 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.21,22 | pending | transcribed v1.0.0 |
| `ci-g7-w11-mon` | `content/playlists/ci-g7/keys/ci-g7-w11-mon.json` | 34819b88c1e0 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.21 | pending | transcribed v1.0.0 |
| `ci-g7-w11-tue` | `content/playlists/ci-g7/keys/ci-g7-w11-tue.json` | 8669faeffe34 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.21 | pending | transcribed v1.0.0 |
| `ci-g7-w11-wed` | `content/playlists/ci-g7/keys/ci-g7-w11-wed.json` | 2300bc9b0451 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.22,23 | pending | transcribed v1.0.0 |
| `ci-g7-w11-thu` | `content/playlists/ci-g7/keys/ci-g7-w11-thu.json` | 947f2ebdd785 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.22,23 | pending | transcribed v1.0.0 |
| `ci-g7-w11-fri` | `content/playlists/ci-g7/keys/ci-g7-w11-fri.json` | 13022fb426c8 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.22,23,24 | pending | transcribed v1.0.0 |
| `ci-g7-w12-mon` | `content/playlists/ci-g7/keys/ci-g7-w12-mon.json` | 0a9624574836 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.24 | pending | transcribed v1.0.0 |
| `ci-g7-w12-tue` | `content/playlists/ci-g7/keys/ci-g7-w12-tue.json` | 880cc83a1849 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.24 | pending | transcribed v1.0.0 |
| `ci-g7-w12-wed` | `content/playlists/ci-g7/keys/ci-g7-w12-wed.json` | 9dae3116969e | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.24,25 | pending | transcribed v1.0.0 |
| `ci-g7-w12-thu` | `content/playlists/ci-g7/keys/ci-g7-w12-thu.json` | 4ba5c985c0fa | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.25 | pending | transcribed v1.0.0 |
| `ci-g7-w12-fri` | `content/playlists/ci-g7/keys/ci-g7-w12-fri.json` | df382c095581 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.25 | pending | transcribed v1.0.0 |
| `ci-g7-w13-mon` | `content/playlists/ci-g7/keys/ci-g7-w13-mon.json` | 4988fae0a24b | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.25,26 | pending | transcribed v1.0.0 |
| `ci-g7-w13-tue` | `content/playlists/ci-g7/keys/ci-g7-w13-tue.json` | 977761d8f4b2 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.26 | pending | transcribed v1.0.0 |
| `ci-g7-w13-wed` | `content/playlists/ci-g7/keys/ci-g7-w13-wed.json` | c54bf3e80242 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.26,27 | pending | transcribed v1.0.0 |
| `ci-g7-w13-thu` | `content/playlists/ci-g7/keys/ci-g7-w13-thu.json` | 02d8a40aec9a | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.27 | pending | transcribed v1.0.0 |
| `ci-g7-w13-fri` | `content/playlists/ci-g7/keys/ci-g7-w13-fri.json` | 07668d4d4c71 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.27 | pending | transcribed v1.0.0 |
| `ci-g7-w14-mon` | `content/playlists/ci-g7/keys/ci-g7-w14-mon.json` | 7bac25c6f7de | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.27,28 | pending | transcribed v1.0.0 |
| `ci-g7-w14-tue` | `content/playlists/ci-g7/keys/ci-g7-w14-tue.json` | ad0c51e21204 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.28 | pending | transcribed v1.0.0 |
| `ci-g7-w14-wed` | `content/playlists/ci-g7/keys/ci-g7-w14-wed.json` | c5d1bf1a13c7 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.28 | pending | transcribed v1.0.0 |
| `ci-g7-w14-thu` | `content/playlists/ci-g7/keys/ci-g7-w14-thu.json` | 59008e07ffec | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.29 | pending | transcribed v1.0.0 |
| `ci-g7-w14-fri` | `content/playlists/ci-g7/keys/ci-g7-w14-fri.json` | 88fd0edf1e68 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.29 | pending | transcribed v1.0.0 |
| `ci-g7-w15-mon` | `content/playlists/ci-g7/keys/ci-g7-w15-mon.json` | aeb5c36eed1c | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.29 | pending | transcribed v1.0.0 |
| `ci-g7-w15-tue` | `content/playlists/ci-g7/keys/ci-g7-w15-tue.json` | f540774bf1c0 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.30 | pending | transcribed v1.0.0 |
| `ci-g7-w15-wed` | `content/playlists/ci-g7/keys/ci-g7-w15-wed.json` | 6e7c2d96f556 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.30 | pending | transcribed v1.0.0 |
| `ci-g7-w15-thu` | `content/playlists/ci-g7/keys/ci-g7-w15-thu.json` | fff4d2bd5d24 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.30,31 | pending | transcribed v1.0.0 |
| `ci-g7-w15-fri` | `content/playlists/ci-g7/keys/ci-g7-w15-fri.json` | 14cd4a160988 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.31 | pending | transcribed v1.0.0 |
| `ci-g7-w16-mon` | `content/playlists/ci-g7/keys/ci-g7-w16-mon.json` | 4adaa51079da | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.31 | pending | transcribed v1.0.0 |
| `ci-g7-w16-tue` | `content/playlists/ci-g7/keys/ci-g7-w16-tue.json` | c45d752be49d | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.31,32 | pending | transcribed v1.0.0 |
| `ci-g7-w16-wed` | `content/playlists/ci-g7/keys/ci-g7-w16-wed.json` | 015678c65dc9 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.32 | pending | transcribed v1.0.0 |
| `ci-g7-w16-thu` | `content/playlists/ci-g7/keys/ci-g7-w16-thu.json` | 8e85885d9a64 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.32 | pending | transcribed v1.0.0 |
| `ci-g7-w16-fri` | `content/playlists/ci-g7/keys/ci-g7-w16-fri.json` | 9e45070db1c7 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.33 | pending | transcribed v1.0.0 |
| `ci-g7-w17-mon` | `content/playlists/ci-g7/keys/ci-g7-w17-mon.json` | 972d6d2f4a1e | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.33 | pending | transcribed v1.0.0 |
| `ci-g7-w17-tue` | `content/playlists/ci-g7/keys/ci-g7-w17-tue.json` | 0cb699178934 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.33 | pending | transcribed v1.0.0 |
| `ci-g7-w17-wed` | `content/playlists/ci-g7/keys/ci-g7-w17-wed.json` | 67eea21301f8 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.33,34 | pending | transcribed v1.0.0 |
| `ci-g7-w17-thu` | `content/playlists/ci-g7/keys/ci-g7-w17-thu.json` | c350a321c40d | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.34 | pending | transcribed v1.0.0 |
| `ci-g7-w17-fri` | `content/playlists/ci-g7/keys/ci-g7-w17-fri.json` | 72fa18bb9bce | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.34 | pending | transcribed v1.0.0 |
| `ci-g7-w18-mon` | `content/playlists/ci-g7/keys/ci-g7-w18-mon.json` | 28bb5ab8c3b0 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.35 | pending | transcribed v1.0.0 |
| `ci-g7-w18-tue` | `content/playlists/ci-g7/keys/ci-g7-w18-tue.json` | edc6d0bce568 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.35 | pending | transcribed v1.0.0 |
| `ci-g7-w18-wed` | `content/playlists/ci-g7/keys/ci-g7-w18-wed.json` | e260641c94c6 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.35 | pending | transcribed v1.0.0 |
| `ci-g7-w18-thu` | `content/playlists/ci-g7/keys/ci-g7-w18-thu.json` | 12774b3222b9 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.35,36 | pending | transcribed v1.0.0 |
| `ci-g7-w18-fri` | `content/playlists/ci-g7/keys/ci-g7-w18-fri.json` | 25f5fc043528 | official | 初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf p.35,36 | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 207 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 200 | 可适配（single-selection，按空；需逐题核对） |
| 共享词／句库（gapMatch） | 71 | 可适配（slot-selection） |
| 开放问答（extendedText） | 101 | 待平台适配（含 LLM 评分） |
| 文本填空（textEntry） | 184 | 待平台适配 |
| 连词成句（order） | 18 | 待平台适配 |

### ci-g5 · 小学英语时文阅读｜提分训练3+X｜5年级

- 合集封面：`assets/ci-g5/cover.jpg`（书籍封面扫描，sha256:04c35a8030db）；gradeBand：G5（学校年级，不等于 UniRead L 等级）；本次交付 60 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ci-g5-w01-mon-s1` | France’s Tax for Rich People · 阅读选择 | `ci-g5-w01-mon` | `s1` | `ci-g5-w01-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 2 | `ci-g5-w01-tue-s1` | A Painter Who Sees the World as a Garden · 阅读选择 | `ci-g5-w01-tue` | `s1` | `ci-g5-w01-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 3 | `ci-g5-w01-wed-s1` | UK Survey Shows Big Plastic Problem · 完形填空 | `ci-g5-w01-wed` | `s1` | `ci-g5-w01-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 4 | `ci-g5-w01-thu-s1` | Will AI Tools Become Expensive? · 选词填空 | `ci-g5-w01-thu` | `s1` | `ci-g5-w01-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 5 | `ci-g5-w01-fri-s1` | Strawberries and Cream at Wimbledon · I. 选词填空 | `ci-g5-w01-fri` | `s1` | `ci-g5-w01-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 4 项供 4 空，每项限用一次，改选即从原空释放 |
| 6 | `ci-g5-w01-fri-s2` | Strawberries and Cream at Wimbledon · II. 回答问题 | `ci-g5-w01-fri` | `s2` | `ci-g5-w01-fri-article`（2 个大题共用） | q5–q7／3 | 3 | 开放问答 | — |
| 7 | `ci-g5-w02-mon-s1` | Wu Yize Wins World Snooker Championship · 阅读选择 | `ci-g5-w02-mon` | `s1` | `ci-g5-w02-mon-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 8 | `ci-g5-w02-tue-s1` | Self-Driving Car · 阅读选择 | `ci-g5-w02-tue` | `s1` | `ci-g5-w02-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 9 | `ci-g5-w02-wed-s1` | Disney Songs Performed With Hands · 完形填空 | `ci-g5-w02-wed` | `s1` | `ci-g5-w02-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 10 | `ci-g5-w02-thu-s1` | Snowy Owl: A Large White Owl · 判断正误 | `ci-g5-w02-thu` | `s1` | `ci-g5-w02-thu-article`（1 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 11 | `ci-g5-w02-fri-s1` | AI Around Us · I. 回答问题 | `ci-g5-w02-fri` | `s1` | `ci-g5-w02-fri-article`（2 个大题共用） | q1–q5／5 | 5 | 开放问答 | — |
| 12 | `ci-g5-w02-fri-s2` | AI Around Us · II. 判断正误 | `ci-g5-w02-fri` | `s2` | `ci-g5-w02-fri-article`（2 个大题共用） | q6–q9／4 | 4 | 单选 | — |
| 13 | `ci-g5-w03-mon-s1` | Get a Taste of Bao, the Oscar-Winning Short · 阅读选择 | `ci-g5-w03-mon` | `s1` | `ci-g5-w03-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 14 | `ci-g5-w03-tue-s1` | China Sets New Rules for Fireworks · 阅读选择 | `ci-g5-w03-tue` | `s1` | `ci-g5-w03-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 15 | `ci-g5-w03-wed-s1` | The Grand Canyon · 完形填空 | `ci-g5-w03-wed` | `s1` | `ci-g5-w03-wed-article`（1 个大题共用） | q1–q8／8 | 8 | 完形（每空单选） | — |
| 16 | `ci-g5-w03-thu-s1` | Australia’s Social Media Ban for Kids · 回答问题 | `ci-g5-w03-thu` | `s1` | `ci-g5-w03-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 开放问答 | — |
| 17 | `ci-g5-w03-fri-s1` | Royal Ascot in Britain · I. 选词填空 | `ci-g5-w03-fri` | `s1` | `ci-g5-w03-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 6 项供 4 空，每项限用一次，改选即从原空释放 |
| 18 | `ci-g5-w03-fri-s2` | Royal Ascot in Britain · II. 回答问题 | `ci-g5-w03-fri` | `s2` | `ci-g5-w03-fri-article`（2 个大题共用） | q5–q8／4 | 4 | 开放问答 | — |
| 19 | `ci-g5-w04-mon-s1` | Anne Frank and Her Diary · 阅读选择 | `ci-g5-w04-mon` | `s1` | `ci-g5-w04-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 20 | `ci-g5-w04-tue-s1` | The World’s Fastest Ant · 阅读选择 | `ci-g5-w04-tue` | `s1` | `ci-g5-w04-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 21 | `ci-g5-w04-wed-s1` | From Tennis to Table Tennis · 完形填空 | `ci-g5-w04-wed` | `s1` | `ci-g5-w04-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 22 | `ci-g5-w04-thu-s1` | Darcie Helps in the School Library · 选词填空 | `ci-g5-w04-thu` | `s1` | `ci-g5-w04-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 23 | `ci-g5-w04-fri-s1` | Antarctica: The Seventh Continent · I. 连线 | `ci-g5-w04-fri` | `s1` | `ci-g5-w04-fri-article`（2 个大题共用） | q1–q1／1 | 5 | 连线 | — |
| 24 | `ci-g5-w04-fri-s2` | Antarctica: The Seventh Continent · II. 回答问题 | `ci-g5-w04-fri` | `s2` | `ci-g5-w04-fri-article`（2 个大题共用） | q2–q6／5 | 5 | 开放问答 | — |
| 25 | `ci-g5-w05-mon-s1` | Why Is Bluetooth Called Bluetooth? · 阅读选择 | `ci-g5-w05-mon` | `s1` | `ci-g5-w05-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 26 | `ci-g5-w05-tue-s1` | World Oceans Day · 阅读选择 | `ci-g5-w05-tue` | `s1` | `ci-g5-w05-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 27 | `ci-g5-w05-wed-s1` | Paella: A Rice Dish From Spain · 完形填空 | `ci-g5-w05-wed` | `s1` | `ci-g5-w05-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 28 | `ci-g5-w05-thu-s1` | Are You Afraid of Sharks? · 选词填空 | `ci-g5-w05-thu` | `s1` | `ci-g5-w05-thu-article`（1 个大题共用） | q1–q8／8 | 8 | 共享词／句库 | 本大题内 10 项供 8 空，每项限用一次，改选即从原空释放 |
| 29 | `ci-g5-w05-fri-s1` | Have a Jazzy Day! · I. 选词填空 | `ci-g5-w05-fri` | `s1` | `ci-g5-w05-fri-article`（2 个大题共用） | q1–q3／3 | 5 | 共享词／句库 | 本大题内 5 项供 3 空，每项限用一次，改选即从原空释放 |
| 30 | `ci-g5-w05-fri-s2` | Have a Jazzy Day! · II. 回答问题 | `ci-g5-w05-fri` | `s2` | `ci-g5-w05-fri-article`（2 个大题共用） | q4–q7／4 | 4 | 开放问答 | — |
| 31 | `ci-g5-w06-mon-s1` | Why Do Clocks Run Clockwise? · 阅读选择 | `ci-g5-w06-mon` | `s1` | `ci-g5-w06-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 32 | `ci-g5-w06-tue-s1` | Do Mosquitoes Love You? · 阅读选择 | `ci-g5-w06-tue` | `s1` | `ci-g5-w06-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 33 | `ci-g5-w06-wed-s1` | What Do Bees Do in Winter? · 完形填空 | `ci-g5-w06-wed` | `s1` | `ci-g5-w06-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 34 | `ci-g5-w06-thu-s1` | The Nobel Prize · 填空 | `ci-g5-w06-thu` | `s1` | `ci-g5-w06-thu-article`（1 个大题共用） | q1–q8／8 | 8 | 文本填空 | — |
| 35 | `ci-g5-w06-fri-s1` | Stan Lee: The Superhero of Marvel · I. 选词填空 | `ci-g5-w06-fri` | `s1` | `ci-g5-w06-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 共享词／句库 | 本大题内 3 项供 3 空，每项限用一次，改选即从原空释放 |
| 36 | `ci-g5-w06-fri-s2` | Stan Lee: The Superhero of Marvel · II. 回答问题 | `ci-g5-w06-fri` | `s2` | `ci-g5-w06-fri-article`（2 个大题共用） | q4–q7／4 | 7 | 开放问答 | — |
| 37 | `ci-g5-w07-mon-s1` | Most Popular Passwords—Is Yours on the List? · 阅读选择 | `ci-g5-w07-mon` | `s1` | `ci-g5-w07-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 38 | `ci-g5-w07-tue-s1` | Making Healthy Foods Fun · 阅读选择 | `ci-g5-w07-tue` | `s1` | `ci-g5-w07-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 39 | `ci-g5-w07-wed-s1` | Do You Know About Viruses? · 完形填空 | `ci-g5-w07-wed` | `s1` | `ci-g5-w07-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 40 | `ci-g5-w07-thu-s1` | How Expensive! · 选词填空 | `ci-g5-w07-thu` | `s1` | `ci-g5-w07-thu-article`（1 个大题共用） | q1–q8／8 | 8 | 共享词／句库 | 本大题内 10 项供 8 空，每项限用一次，改选即从原空释放 |
| 41 | `ci-g5-w07-fri-s1` | Why Is the Sensitive Plant So Shy? · I. 选词填空 | `ci-g5-w07-fri` | `s1` | `ci-g5-w07-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 共享词／句库 | 本大题内 4 项供 4 空，每项限用一次，改选即从原空释放 |
| 42 | `ci-g5-w07-fri-s2` | Why Is the Sensitive Plant So Shy? · II. 回答问题 | `ci-g5-w07-fri` | `s2` | `ci-g5-w07-fri-article`（2 个大题共用） | q5–q8／4 | 4 | 开放问答 | — |
| 43 | `ci-g5-w08-mon-s1` | Why Don’t Penguins’ Feet Freeze? · 阅读选择 | `ci-g5-w08-mon` | `s1` | `ci-g5-w08-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 44 | `ci-g5-w08-tue-s1` | Sudoku · 阅读选择 | `ci-g5-w08-tue` | `s1` | `ci-g5-w08-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 45 | `ci-g5-w08-wed-s1` | Bears Become Honey Tasters · 完形填空 | `ci-g5-w08-wed` | `s1` | `ci-g5-w08-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 46 | `ci-g5-w08-thu-s1` | Can I Give You a Call Bark? · 选词填空 | `ci-g5-w08-thu` | `s1` | `ci-g5-w08-thu-article`（1 个大题共用） | q1–q5／5 | 5 | 共享词／句库 | 本大题内 7 项供 5 空，每项限用一次，改选即从原空释放 |
| 47 | `ci-g5-w08-fri-s1` | Layers of the Ocean · I. 判断正误 | `ci-g5-w08-fri` | `s1` | `ci-g5-w08-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 48 | `ci-g5-w08-fri-s2` | Layers of the Ocean · II. 回答问题 | `ci-g5-w08-fri` | `s2` | `ci-g5-w08-fri-article`（2 个大题共用） | q5–q8／4 | 4 | 开放问答 | — |
| 49 | `ci-g5-w09-mon-s1` | Why Do We Eat Cake on Birthdays? · 阅读选择 | `ci-g5-w09-mon` | `s1` | `ci-g5-w09-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 50 | `ci-g5-w09-tue-s1` | Why Do We Get Hiccups? · 阅读选择 | `ci-g5-w09-tue` | `s1` | `ci-g5-w09-tue-article`（1 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 51 | `ci-g5-w09-wed-s1` | Why Do We Put Salt on Roads in Winter? · 完形填空 | `ci-g5-w09-wed` | `s1` | `ci-g5-w09-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 52 | `ci-g5-w09-thu-s1` | How Much Does the Sky Weigh? · 回答问题 | `ci-g5-w09-thu` | `s1` | `ci-g5-w09-thu-article`（1 个大题共用） | q1–q5／5 | 6 | 开放问答 | — |
| 53 | `ci-g5-w09-fri-s1` | Electricity Around Us · I. 回答问题 | `ci-g5-w09-fri` | `s1` | `ci-g5-w09-fri-article`（2 个大题共用） | q1–q4／4 | 5 | 开放问答 | — |
| 54 | `ci-g5-w09-fri-s2` | Electricity Around Us · II. 选词填空 | `ci-g5-w09-fri` | `s2` | `ci-g5-w09-fri-article`（2 个大题共用） | q5–q7／3 | 3 | 共享词／句库 | 本大题内 6 项供 3 空，每项限用一次，改选即从原空释放 |
| 55 | `ci-g5-w10-mon-s1` | Why Are Bugs So Loud? · 阅读选择 | `ci-g5-w10-mon` | `s1` | `ci-g5-w10-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 56 | `ci-g5-w10-tue-s1` | How Do Vaccines Work? · 阅读选择 | `ci-g5-w10-tue` | `s1` | `ci-g5-w10-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 57 | `ci-g5-w10-wed-s1` | What Is Nessie? · 完形填空 | `ci-g5-w10-wed` | `s1` | `ci-g5-w10-wed-article`（1 个大题共用） | q1–q6／6 | 6 | 完形（每空单选） | — |
| 58 | `ci-g5-w10-thu-s1` | The World’s Biggest Iceberg Gets Stuck · 选词填空 | `ci-g5-w10-thu` | `s1` | `ci-g5-w10-thu-article`（1 个大题共用） | q1–q8／8 | 8 | 共享词／句库 | 本大题内 10 项供 8 空，每项限用一次，改选即从原空释放 |
| 59 | `ci-g5-w10-fri-s1` | The Land of Snow · I. 判断正误 | `ci-g5-w10-fri` | `s1` | `ci-g5-w10-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 60 | `ci-g5-w10-fri-s2` | The Land of Snow · II. 回答问题 | `ci-g5-w10-fri` | `s2` | `ci-g5-w10-fri-article`（2 个大题共用） | q5–q7／3 | 4 | 开放问答 | — |
| 61 | `ci-g5-w11-mon-s1` | Origins of Everyday Hand Gestures · 阅读选择 | `ci-g5-w11-mon` | `s1` | `ci-g5-w11-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 62 | `ci-g5-w11-tue-s1` | Why Is Italian the Language of Music? · 阅读选择 | `ci-g5-w11-tue` | `s1` | `ci-g5-w11-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 63 | `ci-g5-w11-wed-s1` | New Rules for Zoos in Britain · 完形填空 | `ci-g5-w11-wed` | `s1` | `ci-g5-w11-wed-article`（1 个大题共用） | q1–q7／7 | 7 | 完形（每空单选） | — |
| 64 | `ci-g5-w11-thu-s1` | Shakespeare’s Old Home Found in London · 填空 | `ci-g5-w11-thu` | `s1` | `ci-g5-w11-thu-article`（1 个大题共用） | q1–q8／8 | 8 | 文本填空 | — |
| 65 | `ci-g5-w11-fri-s1` | What Is Boxing Day? · I. 判断正误 | `ci-g5-w11-fri` | `s1` | `ci-g5-w11-fri-article`（2 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 66 | `ci-g5-w11-fri-s2` | What Is Boxing Day? · II. 回答问题 | `ci-g5-w11-fri` | `s2` | `ci-g5-w11-fri-article`（2 个大题共用） | q5–q7／3 | 3 | 开放问答 | — |
| 67 | `ci-g5-w12-mon-s1` | Why Do Brits Call Dessert Pudding? · 阅读选择 | `ci-g5-w12-mon` | `s1` | `ci-g5-w12-mon-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 68 | `ci-g5-w12-tue-s1` | Music Makes Us Happy · 阅读选择 | `ci-g5-w12-tue` | `s1` | `ci-g5-w12-tue-article`（1 个大题共用） | q1–q4／4 | 4 | 单选 | — |
| 69 | `ci-g5-w12-wed-s1` | Space Oven Can Cook Food in Space · 完形填空 | `ci-g5-w12-wed` | `s1` | `ci-g5-w12-wed-article`（1 个大题共用） | q1–q8／8 | 8 | 完形（每空单选） | — |
| 70 | `ci-g5-w12-thu-s1` | Fixed Mindset vs Growth Mindset · 阅读选择 | `ci-g5-w12-thu` | `s1` | `ci-g5-w12-thu-article`（1 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 71 | `ci-g5-w12-fri-s1` | Cooking Outside in Antarctica · I. 选词填空 | `ci-g5-w12-fri` | `s1` | `ci-g5-w12-fri-article`（2 个大题共用） | q1–q3／3 | 3 | 共享词／句库 | 本大题内 5 项供 3 空，每项限用一次，改选即从原空释放 |
| 72 | `ci-g5-w12-fri-s2` | Cooking Outside in Antarctica · II. 回答问题 | `ci-g5-w12-fri` | `s2` | `ci-g5-w12-fri-article`（2 个大题共用） | q4–q7／4 | 4 | 开放问答 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ci-g5-w01-mon` | 10／1 | 2（原书） | 122（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w01-tue` | 11,12／2,3 | 4（原书） | 188（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w01-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w01-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w01-wed` | 13／4 | 3（原书） | 159（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w01-thu` | 14／5 | 4（原书） | 180（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w01-fri` | 15,16／6,7 | 3（原书） | 146（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w01-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w01-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w02-mon` | 17,18／8,9 | 4（原书） | 192（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w02-tue` | 19,20／10,11 | 3（原书） | 155（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w02-wed` | 21／12 | 4（原书） | 199（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w02-thu` | 22／13 | 3（原书） | 160（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w02-fri` | 23,24／14,15 | 3（原书） | 179（原书信息框） | 13 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w03-mon` | 25,26／16,17 | 3（原书） | 185（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w03-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w03-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w03-tue` | 27,28／18,19 | 4（原书） | 198（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w03-wed` | 29,30／20,21 | 3（原书） | 164（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w03-wed-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w03-wed-1.jpg`（裁自原书图片） |
| `ci-g5-w03-thu` | 31,32／22,23 | 5（原书） | 216（原书信息框） | 9 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w03-thu-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w03-thu-1.jpg`（裁自原书图片） |
| `ci-g5-w03-fri` | 33,34／24,25 | 3（原书） | 129（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w03-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w03-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w04-mon` | 35,36／26,27 | 3（原书） | 145（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w04-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w04-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w04-tue` | 37,38／28,29 | 3（原书） | 158（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w04-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w04-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w04-wed` | 39／30 | 3（原书） | 138（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w04-thu` | 40／31 | 3（原书） | 181（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w04-fri` | 41,42／32,33 | 3（原书） | 140（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w04-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w04-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w05-mon` | 43,44／34,35 | 3（原书） | 136（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w05-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w05-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w05-tue` | 45,46／36,37 | 4（原书） | 171（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w05-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w05-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w05-wed` | 47／38 | 3（原书） | 142（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w05-thu` | 48／39 | 3（原书） | 137（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w05-fri` | 49,50／40,41 | 3（原书） | 157（原书信息框） | 10 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w05-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w05-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w06-mon` | 51,52／42,43 | 3（原书） | 169（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w06-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w06-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w06-tue` | 53／44 | 3（原书） | 171（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w06-wed` | 54／45 | 2（原书） | 122（原书信息框） | 6 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w06-thu` | 55,56／46,47 | 3（原书） | 137（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w06-thu-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w06-thu-1.jpg`（裁自原书图片） |
| `ci-g5-w06-fri` | 57,58／48,49 | 3（原书） | 144（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w06-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w06-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w07-mon` | 59,60／50,51 | 3（原书） | 170（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w07-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w07-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w07-tue` | 61,62／52,53 | 2（原书） | 163（原书信息框） | 5 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w07-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w07-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w07-wed` | 63／54 | 3（原书） | 141（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w07-thu` | 64／55 | 3（原书） | 155（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w07-fri` | 65,66／56,57 | 3（原书） | 162（原书信息框） | 13 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w07-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w07-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w08-mon` | 67,68／58,59 | 4（原书） | 163（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w08-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w08-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w08-tue` | 69,70／60,61 | 2（原书） | 171（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w08-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w08-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w08-wed` | 71／62 | 2（原书） | 168（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w08-thu` | 72／63 | 1（原书） | 98（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w08-fri` | 73,74／64,65 | 3（原书） | 168（原书信息框） | 12 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w08-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w08-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w09-mon` | 75,76／66,67 | 3（原书） | 160（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w09-tue` | 77,78／68,69 | 3（原书） | 144（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w09-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w09-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w09-wed` | 79／70 | 3（原书） | 188（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w09-thu` | 80／71 | 3（原书） | 144（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w09-fri` | 81,82／72,73 | 3（原书） | 167（原书信息框） | 13 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w09-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w09-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w10-mon` | 83,84／74,75 | 3（原书） | 168（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w10-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w10-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w10-tue` | 85,86／76,77 | 3（原书） | 158（原书信息框） | 7 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w10-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w10-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w10-wed` | 87／78 | 3（原书） | 160（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w10-thu` | 88／79 | 4（原书） | 163（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w10-fri` | 89,90／80,81 | 2（原书） | 111（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w10-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w10-fri-1.jpg`（裁自原书图片） |
| `ci-g5-w11-mon` | 91,92／82,83 | 3（原书） | 153（原书信息框） | 8 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w11-tue` | 93,94／84,85 | 4（原书） | 209（原书信息框） | 9 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w11-tue-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w11-tue-1.jpg`（裁自原书图片） |
| `ci-g5-w11-wed` | 95,96／86,87 | 4（原书） | 173（原书信息框） | 9 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w11-wed-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w11-wed-1.jpg`（裁自原书图片） |
| `ci-g5-w11-thu` | 97,98／88,89 | 4（原书） | 166（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w11-thu-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w11-thu-1.jpg`（裁自原书图片） |
| `ci-g5-w11-fri` | 99,100／90,91 | 3（原书） | 188（原书信息框） | 13 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w12-mon` | 101,102／92,93 | 3（原书） | 163（原书信息框） | 6 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w12-mon-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w12-mon-1.jpg`（裁自原书图片） |
| `ci-g5-w12-tue` | 103,104／94,95 | 3（原书） | 187（原书信息框） | 7 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w12-wed` | 105／96 | 4（原书） | 178（原书信息框） | 10 分钟（原书） | 否 | 无 | 平台占位（RC 以标题生成文字卡） |
| `ci-g5-w12-thu` | 106,107／97,98 | 3（原书） | 172（原书信息框） | 8 分钟（原书） | 否 | `assets/ci-g5/ci-g5-w12-thu-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w12-thu-1.jpg`（裁自原书图片） |
| `ci-g5-w12-fri` | 108,109／99,100 | 3（原书） | 160（原书信息框） | 11 分钟（原书） | 原书标记有讲解视频；本次未交付视频 | `assets/ci-g5/ci-g5-w12-fri-1.jpg` | 独立文件 `assets/ci-g5/ci-g5-w12-fri-1.jpg`（裁自原书图片） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ci-g5-w01-mon` | `content/playlists/ci-g5/keys/ci-g5-w01-mon.json` | b3d4783480d8 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.2 | pending | transcribed v1.0.0 |
| `ci-g5-w01-tue` | `content/playlists/ci-g5/keys/ci-g5-w01-tue.json` | 61c62cad49c6 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.2 | pending | transcribed v1.0.0 |
| `ci-g5-w01-wed` | `content/playlists/ci-g5/keys/ci-g5-w01-wed.json` | 44d1c46b9133 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.2 | pending | transcribed v1.0.0 |
| `ci-g5-w01-thu` | `content/playlists/ci-g5/keys/ci-g5-w01-thu.json` | 6401b95652c8 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.2,3 | pending | transcribed v1.0.0 |
| `ci-g5-w01-fri` | `content/playlists/ci-g5/keys/ci-g5-w01-fri.json` | 83c1166a889c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.3 | pending | transcribed v1.0.0 |
| `ci-g5-w02-mon` | `content/playlists/ci-g5/keys/ci-g5-w02-mon.json` | dfab83884a6c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.3,4 | pending | transcribed v1.0.0 |
| `ci-g5-w02-tue` | `content/playlists/ci-g5/keys/ci-g5-w02-tue.json` | 2d852af58a78 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.4 | pending | transcribed v1.0.0 |
| `ci-g5-w02-wed` | `content/playlists/ci-g5/keys/ci-g5-w02-wed.json` | f71662238863 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.4 | pending | transcribed v1.0.0 |
| `ci-g5-w02-thu` | `content/playlists/ci-g5/keys/ci-g5-w02-thu.json` | 1500989fb92f | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.4,5 | pending | transcribed v1.0.0 |
| `ci-g5-w02-fri` | `content/playlists/ci-g5/keys/ci-g5-w02-fri.json` | bc220ab1e423 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.5 | pending | transcribed v1.0.0 |
| `ci-g5-w03-mon` | `content/playlists/ci-g5/keys/ci-g5-w03-mon.json` | 127e60ed6254 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.6 | pending | transcribed v1.0.0 |
| `ci-g5-w03-tue` | `content/playlists/ci-g5/keys/ci-g5-w03-tue.json` | aecaebc16067 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.6 | pending | transcribed v1.0.0 |
| `ci-g5-w03-wed` | `content/playlists/ci-g5/keys/ci-g5-w03-wed.json` | 01dc06cb6ae3 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.6,7 | pending | transcribed v1.0.0 |
| `ci-g5-w03-thu` | `content/playlists/ci-g5/keys/ci-g5-w03-thu.json` | 5505c318a995 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.7 | pending | transcribed v1.0.0 |
| `ci-g5-w03-fri` | `content/playlists/ci-g5/keys/ci-g5-w03-fri.json` | d4f0a20ca71f | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.7,8 | pending | transcribed v1.0.0 |
| `ci-g5-w04-mon` | `content/playlists/ci-g5/keys/ci-g5-w04-mon.json` | 75e40bc5a83c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.7 | pending | transcribed v1.0.0 |
| `ci-g5-w04-tue` | `content/playlists/ci-g5/keys/ci-g5-w04-tue.json` | f50a3432faba | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.7,9 | pending | transcribed v1.0.0 |
| `ci-g5-w04-wed` | `content/playlists/ci-g5/keys/ci-g5-w04-wed.json` | 2a05ca734a1f | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.9 | pending | transcribed v1.0.0 |
| `ci-g5-w04-thu` | `content/playlists/ci-g5/keys/ci-g5-w04-thu.json` | b3acdc896462 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.9 | pending | transcribed v1.0.0 |
| `ci-g5-w04-fri` | `content/playlists/ci-g5/keys/ci-g5-w04-fri.json` | 44f9e3676a96 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.9,10 | pending | transcribed v1.0.0 |
| `ci-g5-w05-mon` | `content/playlists/ci-g5/keys/ci-g5-w05-mon.json` | 9cd912424ba7 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.10,11 | pending | transcribed v1.0.0 |
| `ci-g5-w05-tue` | `content/playlists/ci-g5/keys/ci-g5-w05-tue.json` | a9e953421493 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.11 | pending | transcribed v1.0.0 |
| `ci-g5-w05-wed` | `content/playlists/ci-g5/keys/ci-g5-w05-wed.json` | 26310c5e5c9a | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.11 | pending | transcribed v1.0.0 |
| `ci-g5-w05-thu` | `content/playlists/ci-g5/keys/ci-g5-w05-thu.json` | 365259026f27 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.11,12 | pending | transcribed v1.0.0 |
| `ci-g5-w05-fri` | `content/playlists/ci-g5/keys/ci-g5-w05-fri.json` | 2e7c9c4f2a01 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.12 | pending | transcribed v1.0.0 |
| `ci-g5-w06-mon` | `content/playlists/ci-g5/keys/ci-g5-w06-mon.json` | 6bb06c971e9c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.12,13 | pending | transcribed v1.0.0 |
| `ci-g5-w06-tue` | `content/playlists/ci-g5/keys/ci-g5-w06-tue.json` | c197d6469ca8 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g5-w06-wed` | `content/playlists/ci-g5/keys/ci-g5-w06-wed.json` | d6e20195ceed | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.13 | pending | transcribed v1.0.0 |
| `ci-g5-w06-thu` | `content/playlists/ci-g5/keys/ci-g5-w06-thu.json` | d44f6b35a05b | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.13,14 | pending | transcribed v1.0.0 |
| `ci-g5-w06-fri` | `content/playlists/ci-g5/keys/ci-g5-w06-fri.json` | 32fef52b517e | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.14 | pending | transcribed v1.0.0 |
| `ci-g5-w07-mon` | `content/playlists/ci-g5/keys/ci-g5-w07-mon.json` | 7d7a61635832 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.14,15 | pending | transcribed v1.0.0 |
| `ci-g5-w07-tue` | `content/playlists/ci-g5/keys/ci-g5-w07-tue.json` | fb5035b3be3d | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.15 | pending | transcribed v1.0.0 |
| `ci-g5-w07-wed` | `content/playlists/ci-g5/keys/ci-g5-w07-wed.json` | 8d054080adc9 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.15 | pending | transcribed v1.0.0 |
| `ci-g5-w07-thu` | `content/playlists/ci-g5/keys/ci-g5-w07-thu.json` | 1d3aa44d5c80 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.15,16 | pending | transcribed v1.0.0 |
| `ci-g5-w07-fri` | `content/playlists/ci-g5/keys/ci-g5-w07-fri.json` | b801d4c2e87e | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.16 | pending | transcribed v1.0.0 |
| `ci-g5-w08-mon` | `content/playlists/ci-g5/keys/ci-g5-w08-mon.json` | eb3f98480a87 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.16,17 | pending | transcribed v1.0.0 |
| `ci-g5-w08-tue` | `content/playlists/ci-g5/keys/ci-g5-w08-tue.json` | d958ab7255e6 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.17 | pending | transcribed v1.0.0 |
| `ci-g5-w08-wed` | `content/playlists/ci-g5/keys/ci-g5-w08-wed.json` | 9076600619f1 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.17 | pending | transcribed v1.0.0 |
| `ci-g5-w08-thu` | `content/playlists/ci-g5/keys/ci-g5-w08-thu.json` | 869a31bce9b9 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.17,18 | pending | transcribed v1.0.0 |
| `ci-g5-w08-fri` | `content/playlists/ci-g5/keys/ci-g5-w08-fri.json` | b220b8e64156 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.18 | pending | transcribed v1.0.0 |
| `ci-g5-w09-mon` | `content/playlists/ci-g5/keys/ci-g5-w09-mon.json` | 556a76f6159e | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.18,19 | pending | transcribed v1.0.0 |
| `ci-g5-w09-tue` | `content/playlists/ci-g5/keys/ci-g5-w09-tue.json` | ea77de22d661 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.19 | pending | transcribed v1.0.0 |
| `ci-g5-w09-wed` | `content/playlists/ci-g5/keys/ci-g5-w09-wed.json` | 3ba2e6380c9f | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.19 | pending | transcribed v1.0.0 |
| `ci-g5-w09-thu` | `content/playlists/ci-g5/keys/ci-g5-w09-thu.json` | cb8b3ca2a87a | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.19,20 | pending | transcribed v1.0.0 |
| `ci-g5-w09-fri` | `content/playlists/ci-g5/keys/ci-g5-w09-fri.json` | a036a2246fbb | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.20 | pending | transcribed v1.0.0 |
| `ci-g5-w10-mon` | `content/playlists/ci-g5/keys/ci-g5-w10-mon.json` | fa4bce220b3e | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.21 | pending | transcribed v1.0.0 |
| `ci-g5-w10-tue` | `content/playlists/ci-g5/keys/ci-g5-w10-tue.json` | 53cc23d5458c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.21 | pending | transcribed v1.0.0 |
| `ci-g5-w10-wed` | `content/playlists/ci-g5/keys/ci-g5-w10-wed.json` | f7339eb1a877 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.21 | pending | transcribed v1.0.0 |
| `ci-g5-w10-thu` | `content/playlists/ci-g5/keys/ci-g5-w10-thu.json` | f7b32704ff97 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.21,22 | pending | transcribed v1.0.0 |
| `ci-g5-w10-fri` | `content/playlists/ci-g5/keys/ci-g5-w10-fri.json` | e2bcbc6ad6df | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.22 | pending | transcribed v1.0.0 |
| `ci-g5-w11-mon` | `content/playlists/ci-g5/keys/ci-g5-w11-mon.json` | eab2a9dc0e2c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.22,23 | pending | transcribed v1.0.0 |
| `ci-g5-w11-tue` | `content/playlists/ci-g5/keys/ci-g5-w11-tue.json` | 72d58f21c96c | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.23 | pending | transcribed v1.0.0 |
| `ci-g5-w11-wed` | `content/playlists/ci-g5/keys/ci-g5-w11-wed.json` | 7588510363b7 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.23 | pending | transcribed v1.0.0 |
| `ci-g5-w11-thu` | `content/playlists/ci-g5/keys/ci-g5-w11-thu.json` | 0da6581fa5a2 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.23,24 | pending | transcribed v1.0.0 |
| `ci-g5-w11-fri` | `content/playlists/ci-g5/keys/ci-g5-w11-fri.json` | 74340ef7c95d | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.24 | pending | transcribed v1.0.0 |
| `ci-g5-w12-mon` | `content/playlists/ci-g5/keys/ci-g5-w12-mon.json` | 144dc1dc7b30 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.24,25 | pending | transcribed v1.0.0 |
| `ci-g5-w12-tue` | `content/playlists/ci-g5/keys/ci-g5-w12-tue.json` | fab0f3f35217 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.24,25 | pending | transcribed v1.0.0 |
| `ci-g5-w12-wed` | `content/playlists/ci-g5/keys/ci-g5-w12-wed.json` | 1abf83ed5622 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.25 | pending | transcribed v1.0.0 |
| `ci-g5-w12-thu` | `content/playlists/ci-g5/keys/ci-g5-w12-thu.json` | ae0f38ec2be2 | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.26 | pending | reviewed v1.0.0 |
| `ci-g5-w12-fri` | `content/playlists/ci-g5/keys/ci-g5-w12-fri.json` | 880f48b13c1e | official | 小学英语时文阅读提分训练3+X5年级答案.pdf p.26 | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 130 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 77 | 可适配（single-selection，按空；需逐题核对） |
| 共享词／句库（gapMatch） | 63 | 可适配（slot-selection） |
| 开放问答（extendedText） | 57 | 待平台适配（含 LLM 评分） |
| 连线（match） | 1 | 待平台适配（含一对多） |
| 文本填空（textEntry） | 16 | 待平台适配 |

