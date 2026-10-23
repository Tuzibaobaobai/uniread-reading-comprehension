# 本次生产交接 · 中考考纲词汇天天练 第一批样例（zkv-sample-2026-10）

> 配套规约：[`14-agent-production-rules.md`](../14-agent-production-rules.md)；模板：[`14-production-handoff.template.md`](../14-production-handoff.template.md)；类型规范：[`16-vocab-day-format.md`](../16-vocab-day-format.md)；制作规范：[`production-brief-zkv.md`](../production-brief-zkv.md)。GitHub #110，milestone 11.15，分支 `develop`。本文只引用私有答案的位置，不粘贴答案。

## 本次交付范围

- **任务**：新内容类型「中考考纲词汇」的第一批样例，用于内部审核数据、交互与视觉；审定后按「已有类型」路径批量生产 70 天。
- **素材**：《2026年上海市初中英语考纲词汇用法手册》（词条，Vocabulary 标签，只读）+《2026年上海市初中英语考纲词汇天天练》（70 天练习，Quiz 标签）。只生产手册第一单元。
- **交付类型**：试点选材。

  | 合集 | Item | 内容 | 小题 | 词条 |
  | --- | --- | --- | --- | --- |
  | `zkv` | `zkv-d01` | 第 1 天 ability – against（单词日，6 种题型） | 40（q1–q40，100 分） | 34 个单词（手册 1–34 号） |
  | `zkv` | `zkv-d63` | 第 63 天 help sb. with sth. – in time（词组日，3 种题型，含中文词组表填空） | 45（q1–q45，100 分） | 31 个词组（手册词组 160–190 号） |

- **ID**：item `<pl>-dNN`、词条 `e-<词头>`（共享词库 `content/lexicons/zkv/entries/`），均永久；小题 `q<n>`（首次生产，题号即 ID）、空 `b<n>`、词形空 `f<n>`。
- **标题**：`第N天 <首词> – <末词>`；合集标题、简介见 `content/playlists/zkv/playlist.json`。语言 `en`，界面中文。gradeBand `G9`（中考），无难度级。及格线 60%。

## 同类资源规约与一致性

- **新类型**，规约即 [docs/16](../16-vocab-day-format.md)（数据 / 交互 / 视觉 / 判分 / 生产流程）与 [docs/03](../03-data-model.md)「词汇天天练」一节。`SCHEMA_VERSION` 仍为 1.0：全部增量（`VocabDayItem`、`LexiconEntry`、交互 `wordProfile` / `wordFamily`、`requiredWord`、`promptBank`、`entryRef`、Attempt `hinted` / `voiced` / `known` / `kept`、catalog `format: "vocab"`）。已交付的时文阅读、KET、PET 文件与行为不变（全部既有 e2e 通过）。
- 题型映射（印刷大题 → 交互）见 `docs/production-brief-zkv.md`。

## 本次更新与稳定题目ID

- 本次类型：首次生产；无历史 ID、无退役 ID。

## 资产与依赖

| 使用位置 | 路径 | 来源 | 交付 |
| --- | --- | --- | --- |
| 合集封面 / 横幅 | `assets/zkv/cover.jpg`、`banner.jpg` | `scripts/make-cover.mjs zkv`（与 KET/PET 同一模板，新增 ZKV 类型） | 是 |
| 词头与例句朗读 | `assets/lexicons/zkv/<entryId>.mp3`、`<entryId>-x<N>.mp3` | 火山引擎 TTS（Amanda），`node scripts/tts.mjs --lexicon zkv`；65 个词条共 142 段（4,906 字符）；不进 git，随 `rc-media-zkv.zip` 交付 | 142 / 142 |
| 题目图片 | — | 纯文字，无图片 | 不适用 |

- 服务：判分 `/api/rc/grade`（中文释义规则匹配 + 一次模型复核）、`/api/rc/judge`（中译英）、`/api/rc/hint`（提示字母块）、`/api/rc/transcribe`（语音输入，Qwen3-ASR-1.7B）。需要 `SILICONFLOW_API_KEY`；未配置时中文释义只按规则判、中译英回落为自评、语音按钮报不可用。

## 来源、版权和私有答案

- 页面图 / OCR：`.work/pages/zkv/{handbook,daily}`、`.work/text/zkv/…`（本地，不交付）。词条与 item 的 `source` 记录 PDF 页与书页。
- 私有 Key：`content/playlists/zkv/keys/`，构建时从公开产物移除。词条（含例句）是公开内容；泄漏检查把当天词条视为公开材料（中译英答案常是词条例句），解析等其余私有文字仍受检查。
- **答案来源**：`official`（天天练书末答案，第 1 天 p.77，第 63 天 p.103–104）。中文释义的可接受义项 = 书末答案 + 手册该词性全部义项。
- **解析来源**：原书没有解析，`explanationZh` 全部为制作方撰写，key 标 `explanationSource: "generated"`。
- **审核状态**：全部 key `reviewStatus: pending`；Agent 复核不等于人工复核。
- **原书疑似错误（按原样保留，待人工确认）**：
  1. 第 1 天 二.8：题面「成年人 adj.」，手册为「成年的」。
  2. 第 1 天书末答案 六.2：「think yourself」，手册例句为「think by yourself」（key `rubricZh` 已注明，两种都接受）。
  3. 第 1 天书末答案 三.3：actually 释义印作「实际地…」，手册为「实际上…」（两者都接受）。
  4. 手册 in charge of 名师点拨：「布郎先生」应为「布朗」。
  5. 存疑：手册把 not until 列为 after 的近义。
  - 将与样例一起提交 errata issue（推送后再开，以便引用文件）。
- **自行补充的可接受答案**：第 63 天 q10 另接受「help sb with sth」「help somebody with something」（书未印）。
- **规约尚不能表达**：手册 `*` / `**` / `***` 三级星标目前只记 `star: true`；against 例句是两行对话，中文只能用换行表示。

## 每类交互与验证（2026-10-23 实际执行）

- `npm run validate`：626 篇 0 错误（`zkv-d01`、`zkv-d63` 0 警告；含 65 个词条校验）。
- `npx tsx scripts/check-vocab.ts zkv-d01 zkv-d63`：85 个答案全部在书末答案页 OCR 中找到（子代理另逐题目检答案页）。
- `npm test`：全部通过（新增 `src/lib/vocab-grading.test.ts`、`server/vocab.test.ts`：中文义项匹配、括号可选字、三部分计分、同词性互换、提示半分、服务端提示块、语音开放范围、模型复核）。
- `npm run build`：通过（含私有材料泄漏检查）。
- e2e：`e2e/vocab.spec.ts` 三个视口全部通过（合集页、Vocabulary 列表与遮住释义 / 认识·不认识、六页大题、Enter 跳下一空、提示字母块拼词 → 半分、语音按钮只在中文释义 / 中译英、伪麦克风 + 打桩识别、提交 → 结果 → 复盘 → 查看词条 → 只练错题）；全部既有 e2e 通过；`all-items` 覆盖两天。
- 本地页面目检：桌面与 iPad 竖屏的两天 Vocabulary、Quiz 各页（含第 63 天中文词组表）、结果、复盘、词条弹层（截图 `.work/screens/<视口>/zkv-*.png`）。
- **未验证**：真机 iPad 软键盘（`useVisualViewport` 只在模拟器外生效，需真机看）；真实语音识别与中文释义模型复核需配置密钥后在线验证。

## RC 布局与交互还原交接

- 新页面 `src/vocab/`（`VocabDayPage`、`VocabList`、`VocabQuiz`、`HintTiles`、`VoiceInput`、`useVisualViewport`），样式 `src/styles/vocab.css`，只用 tokens。顶栏标签、结果页、词条弹层对应 Figma 7762-32671 / 15643-204521 / 15643-204524；词条列表与填写行为待补组件（见 `docs/design/figma-registry.md`）。
- 路由不变：`/p/zkv/zkv-dNN` 由 `ReaderPage` 识别 vocab-day 后渲染 `VocabDayPage`。

## 附：自动生成的清单（`npx tsx scripts/handoff-inventory.ts zkv`）

### zkv · 中考考纲词汇天天练｜2026 上海市初中英语考纲词汇

- 合集封面：`assets/zkv/cover.jpg`（`scripts/make-cover.mjs` 统一模板生成，sha256:ecbafe07a017）；gradeBand：G9（学校年级，不等于 UniRead L 等级）；本次交付 2 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `zkv-d01-s1` | 第1天 ability – against · 一. 根据所给音标写出英语单词、词性及中文释义 | `zkv-d01` | `s1` | `zkv-d01-article`（6 个大题共用） | q1–q5／5 | 10 | 音标写词、词性、中文 | — |
| 2 | `zkv-d01-s2` | 第1天 ability – against · 二. 根据所给中文写出英语单词 | `zkv-d01` | `s2` | `zkv-d01-article`（6 个大题共用） | q6–q20／15 | 30 | 文本填空 | — |
| 3 | `zkv-d01-s3` | 第1天 ability – against · 三. 根据所给单词和词性，写出相关的单词和中文释义 | `zkv-d01` | `s3` | `zkv-d01-article`（6 个大题共用） | q21–q25／5 | 20 | 词形拓展（相关词 + 中文） | — |
| 4 | `zkv-d01-s4` | 第1天 ability – against · 四. 用括号中所给单词的适当形式完成下列句子，每空格限填一词 | `zkv-d01` | `s4` | `zkv-d01-article`（6 个大题共用） | q26–q30／5 | 10 | 文本填空 | — |
| 5 | `zkv-d01-s5` | 第1天 ability – against · 五. 在句子的空格内填入适当的词，使其内容通顺。每空格限填一词，首字母已给 | `zkv-d01` | `s5` | `zkv-d01-article`（6 个大题共用） | q31–q35／5 | 10 | 文本填空 | — |
| 6 | `zkv-d01-s6` | 第1天 ability – against · 六. 中译英 | `zkv-d01` | `s6` | `zkv-d01-article`（6 个大题共用） | q36–q40／5 | 20 | 开放问答 | — |
| 7 | `zkv-d63-s1` | 第63天 help sb. with sth. – in time · 一. 根据所给中文写出英语词组 | `zkv-d63` | `s1` | `zkv-d63-article`（3 个大题共用） | q1–q25／25 | 50 | 文本填空 | — |
| 8 | `zkv-d63-s2` | 第63天 help sb. with sth. – in time · 二. 选择适当的词组译成英文填空，使句子内容通顺，每个词组只能填一次 | `zkv-d63` | `s2` | `zkv-d63-article`（3 个大题共用） | q26–q35／10 | 20 | 文本填空 | — |
| 9 | `zkv-d63-s3` | 第63天 help sb. with sth. – in time · 三. 中译英 | `zkv-d63` | `s3` | `zkv-d63-article`（3 个大题共用） | q36–q45／10 | 30 | 开放问答 | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `zkv-d01` | 7／1,2 | 无难度级（中考考纲词汇） | 34 个词条 | 25 分钟（制作方估算） | 否 | 词条音频 `assets/lexicons/zkv/<entryId>.mp3`（TTS 生成） | 平台占位（RC 以标题生成文字卡） |
| `zkv-d63` | 69／125,126 | 无难度级（中考考纲词汇） | 31 个词条 | 25 分钟（制作方估算） | 否 | 词条音频 `assets/lexicons/zkv/<entryId>.mp3`（TTS 生成） | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `zkv-d01` | `content/playlists/zkv/keys/zkv-d01.json` | 1712bd3faf7a | official | 3. 26年初中英语考纲词汇天天练（最新版）141页.pdf p.77 | pending | transcribed v1.0.0 |
| `zkv-d63` | `content/playlists/zkv/keys/zkv-d63.json` | 4c54cf4908da | official | 3. 26年初中英语考纲词汇天天练（最新版）141页.pdf p.103,104 | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 音标写词、词性、中文（wordProfile） | 5 | 待平台适配（词汇天天练新题型，#110） |
| 文本填空（textEntry） | 60 | 待平台适配 |
| 词形拓展（相关词 + 中文）（wordFamily） | 5 | 待平台适配（词汇天天练新题型，#110） |
| 开放问答（extendedText） | 15 | 待平台适配（含 LLM 评分） |

