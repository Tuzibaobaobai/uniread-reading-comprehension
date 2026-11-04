# 本次生产交接 · 中考 / 高考考纲词汇天天练 全部内容（zkv-gkv-full-2026-11）

> 配套规约：[`14-agent-production-rules.md`](../14-agent-production-rules.md)（v0.11）；模板：[`14-production-handoff.template.md`](../14-production-handoff.template.md)；类型规范：[`16-vocab-day-format.md`](../16-vocab-day-format.md)；制作规范：[`production-brief-zkv.md`](../production-brief-zkv.md)、[`production-brief-gkv.md`](../production-brief-gkv.md)；UniRead 平台规范：[`uniread-spec/`](../uniread-spec/README.md)。GitHub #110，milestone 11.15，分支 `develop`。上一批（样例）见 [production-handoff.zkv-sample-2026-10.md](production-handoff.zkv-sample-2026-10.md)。本文只引用私有答案的位置，不粘贴答案。

## 本次交付范围

- **任务**：样例审定后批量生产「中考考纲词汇天天练」（`zkv`）全部 70 天，并新增同类合集「高考考纲词汇天天练」（`gkv`）全部 125 天。
- **交付类型**：书籍目录（两本书的全部天数）。

  | 合集 | Item | 天数 | 小题 | 手册词条 | 本次新做 |
  | --- | --- | --- | --- | --- | --- |
  | `zkv` | `zkv-d01` … `zkv-d70` | 70 | 3,103 | 2,132（单词 1–1785、词组 1–347） | 第 2–62、64–70 天（第 1、63 天为已交付样例，未改） |
  | `gkv` | `gkv-d001` … `gkv-d125` | 125 | 8,576 | 4,264（单词 1–4264） | 第 3–125 天（第 1、2 天为样例，未改） |

- **标题**：`title` / `displayName` 只写当天的词条范围（如 `ancient – ask`），「第N天 / Day N」由界面按语言加（#106）。合集简介已改为三步（速览 → 学习 → 测验）；`zkv` playlist v1.1.0，`gkv` v1.0.0。gradeBand：`zkv` G9、`gkv` G12；无难度级；及格线 60%。
- **ID**：item `zkv-dNN` / `gkv-dNNN`；词条 `e-<词头>`。同形词按原书上标编号为 `-1`、`-2`（bank¹ → `e-bank-1`）；仅大小写不同的两个词条，书中靠后的一个加 `-2`（`zkv`：`e-china-2` 瓷器、`e-may-2`、`e-miss-2`；`gkv`：`e-china-2`、`e-miss-2`）。全部为首次生产，小题 `q1…qN`，无退役 ID。

## 同类资源规约与一致性

- 沿用样例审定后的规约（docs/16、两份 brief），数据、交互、判分与样例完全一致；`SCHEMA_VERSION` 仍为 1.0，没有新增字段。
- **唯一的新形式：中考第 69–70 天的表格**（人称代词、基数词 / 序数词、不规则动词）。用已有字段表达：section `stimulus` 里的 `table` 块，答案格是 `blank`，每行一道 `textEntry`（`blankIds`）。界面新增表格作答（`src/vocab/VocabQuiz.tsx` `TableStimulus`，样式 `.vq-table`），e2e 见 `e2e/vocab.spec.ts`「Quiz table days」。规则写在 docs/16 §2.2「表格日」。
- `scripts/validate.ts`：表格日的词条不是连续范围，不报编号跳号。
- `server/private-check.ts`：构建时的泄漏检查不再拿全部 key 去比对词条文件。词条是手册原文（公开），某天的中译英参考答案常常就是另一天词条的例句，一些短句（如 "I'm sorry to hear that."）也会和 KET 的 key 重合。item、catalog 和脚本包仍照旧检查，key 仍从构建产物中删除。
- `scripts/tts.mjs --lexicon`：加 `--jobs`（默认 4 个词条并发），边做边保存清单。
- UniRead 规范（i18n #106、Loading #107）：没有新增界面文案以外的变化；表格日的界面文字全部走 `t()`，`npm test` 的硬编码中文检查通过。

## 生产方法

- 每天一个生产 agent（读页图 + 本地 OCR，写词条、item、key，跑 `validate` 和 `check-vocab`），完成后由另一个 agent 独立校对：key 的每个答案对照答案页图片，题面对照练习页，至少 8 个词条（含首末）逐项对照手册页图片，发现转写错误直接改。187 天全部生产并校对通过，校对共改正 79 处（`zkv` 31、`gkv` 48）。第 69–70 天（表格）由我用脚本生成并逐格对照页图。
- 合并后全书检查：
  - 词条编号连续、无重复。
  - 每个词条只属于一天，每个 `entryRef` 都有对应文件。
  - 页边界检查：用 OCR 找「下一页顶部还有上一词条的内容」。找到并补齐 3 处一天的最后一个词条被截断：`gkv` rest¹（漏一个例句）、group（漏两个例句和词组）、influence（漏派生和词组）。另补 rest²（3192 号，两天都没做）。
- 各天的生产与校对记录（不确定的读法、自行补充的可接受答案、换算说明）在 `.work/batch/results-2026-11-03.json`，汇总在 `.work/batch/review-notes.md`（933 条，含答案，属私有材料，本地保存，不交付）。

## 资产与依赖

| 使用位置 | 路径 | 来源 | 交付 |
| --- | --- | --- | --- |
| 合集封面 / 横幅 | `assets/zkv/…`、`assets/gkv/cover.jpg`、`banner.jpg` | `scripts/make-cover.mjs`（GKV 类型同一模板） | 是 |
| 词头与例句朗读 | `assets/lexicons/<lx>/<entryId>.mp3`、`<entryId>-x<N>.mp3` | 火山引擎 TTS（Amanda），先 `node scripts/lexicon-pron.mjs <lx>` 再 `node scripts/tts.mjs --lexicon <lx>`，按原书音标发音（#131） | `zkv` 5,117 段（2,132 个词条）、`gkv` 9,770 段（4,264 个词条），全部生成；不进 git，随 `rc-media-zkv.zip`、`rc-media-gkv.zip` 交付 |
| 题目图片 | — | 纯文字 | 不适用 |

- 发音：`pronunciations.json` 覆盖 `zkv` 1,767 个、`gkv` 4,157 个单词词条。报告里需要人工听的：`zkv` 92 条、`gkv` 325 条，绝大多数是英式音标与 CMU 美式发音对不上，脚本已按原书音标合成。另有印了两个音标的词（use、vitamin、year…），词头用第一个，例句交给声音。
- 音频不进 git，交付时用 `scripts/make-handoff-release.mjs` 打包 `rc-media-zkv.zip`、`rc-media-gkv.zip` 和 `MEDIA.json`。

## 来源、版权和私有答案

- 页面图 / OCR：`.work/pages/{zkv,gkv}/…`、`.work/text/{zkv,gkv}/…`（本地，不交付）。词条与 item 的 `source` 记录 PDF 页与书页。
- 私有 Key：`content/playlists/{zkv,gkv}/keys/`。**答案来源** `official`（天天练书末答案 / 高考答案册），**解析** 全部由制作方撰写（`explanationSource: "generated"`），**审核状态** 全部 `reviewStatus: pending`（agent 校对不等于人工复核）。
- **原书疑似错误**：按原样保留，已开 errata issue 待人工确认：[#135](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/135)（中考 141 处）、[#136](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/136)（高考第 3–60 天 131 处）、[#137](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/137)（高考第 61–125 天 134 处）。其中不少 key 已同时接受正确写法（见 issue 建议栏）。手册中没有给下划线的 11 个例句（如 gkv airport、puppy）也照原样，`validate` 对它们只给警告。
- **自行补充的可接受答案**：`zkv` 242 处、`gkv` 747 处（如英美拼写、书中「A = B」拆开的参考译文、手册其他义项），逐条见 `.work/batch/review-notes.md` 与各天 key 的 `rubricZh`。

## 待人工决定

1. 三个词条落在两天的印刷范围之间，不属于任何一天：`zkv` departure（第 13 天止于 deny，第 14 天起于 depend）；`gkv` specialised（第 104 / 105 天之间）、stability（第 105 / 106 天之间）。词条已录入，可并入相邻一天，也可保持不显示。
2. 高考手册第二部分（词组，书页 476–510）不属于任何一天，本期未生产。
3. 手册的 `*` / `**` / `***` 星级仍只记 `star: true`（同样例）。
4. errata #135–#137 的确认，以及全部 key 的人工复核。

## 每类交互与验证（2026-11-03 实际执行）

- `npx tsx scripts/validate.ts <全部 195 个 zkv / gkv item>`：0 错误。警告只有 11 个手册未加下划线的例句（原样，见 errata）。
- `npx tsx scripts/check-vocab.ts`：每天由生产与校对 agent 各跑一次，书末答案全部找到；第 70 天 49 个答案 OCR 漏读（p107 只读出 131 个词），已逐格对照页图。
- 全书检查：词条编号连续无重复、每个词条只属于一天（3 个落在两天之间，见「待人工决定」）、所有 `entryRef` 有对应文件、页边界截断检查（补齐 3 处，补做 rest²）。
- 音频：两本书全部词条都有音频（`entry.audio` 与例句数一致）。用 Qwen3-ASR 抽查 257 段（每本均匀抽样，含词头和例句）：只有 1 段差异（for ever 识别为 forever），无错读、漏读。
- `npm test`：90 个测试全部通过（含 `i18n.test.ts` 硬编码中文检查、`scripts/asset.test.ts`）。`npx tsc -b` 通过。
- `npm run build`：通过（含私有材料泄漏检查）。构建产物约 24,400 个文件、993 MB，其中词条音频 425 MB；部署到 Vercel 前需确认文件数与体积限制。
- `npm run e2e`：238 个通过，0 失败（另有 2,459 个是只在 `REFERENCE=1` 时运行的参考截图，及只在桌面视口运行的用例）。新增「Quiz table days」；`all-items` 打开全部 195 天的三个标签页。
- **未验证**：真机 iPad 软键盘；按 #131 发音标准，`zkv` 92 条、`gkv` 325 条发音报告条目未逐条人工试听（已按原书音标合成）。

## RC 布局与交互还原交接

- 表格日：`src/vocab/VocabQuiz.tsx`（`TableStimulus`，复用阅读器的 `Block` 表格渲染和 `BlankInput`），样式 `src/styles/vocab.css` `.vq-table`（只用 tokens 与 1000px 设计宽度的 px）。作答时只显示表格；复盘时表格里逐格标对错，下面逐题列出答案与解析。
- 其他页面、路由、i18n 与样例一致（`/p/<pl>/<itemId>` → `VocabDayPage`）。

## 附：自动生成的清单

两本书共 195 个 item，清单很长，不贴在这里：`npx tsx scripts/handoff-inventory.ts zkv`、`npx tsx scripts/handoff-inventory.ts gkv`。

## 2026-11-04 更新：勘误审核结果与考频星级

- **勘误（#135 / #136 / #137）**：按审核意见逐条修改，共 406 条。
  - #135（中考 zkv）：115 条已改，26 条按原书保留。
  - #136（高考 gkv 第 3–60 天）：119 条已改，12 条按原书保留。
  - #137（高考 gkv 第 61–125 天）：111 条已改，23 条按原书保留。
  - 记录方式：题面、词条的展示文字改正后，在该 item 或词条的 `errata` 里记原文和改正后的文字，注明「经人工复核（GitHub #13x 第 N 条）确认更正」。答案改在 key 里，并在 `rubricZh` / `explanationZh` 写明原书印法。书上的错误答案不再给分，标点变体仍然接受。
  - 改动过的 item 和词条版本号 +0.0.1。Key 仍为 `reviewStatus: pending`，题目 id 和题号都没变。
  - 两处题目结构变化：
    - `zkv-d05` q17：三个空改为一个空（b17a = be），删除 b17b、b17c。
    - `zkv-d07` q30：一个空改为两个空。新增 b30a（are / were）、b30b（busy），停用 b30。
  - 审核意见的解读，请确认：
    - #135 第 9 条：审核意见写的是「They are _____ _____」，但答案是 are busy，这样填进去会变成 are are busy。题面按两个空、不印 are 处理。
    - #136 第 86 条：按审核意见修改后，`gkv-d043` 的 q35 和 q36 题面、答案完全相同。
    - #136 第 116 条：词头改为 hybrid，但词条 id 仍为 `e-hybird`（id 永久不变）。
    - #136 第 130 条：只接受 item，不再接受建议栏保留的 interview。
  - 音频：改了英文例句、词头或音标的词条重新合成了音频：zkv 50 段，gkv 33 段。
- **考频星级（#139）**：中考手册的星号分三级：
  - `*` 表示在各区统考试卷中出现。
  - `**` 表示在区统考试卷和市毕业考试卷中都出现。
  - `***` 表示在市毕业考试卷中多次出现。
  
  具体改动：
  - 词条新增 `starLevel` 字段（取 2 或 3；缺省为 1），`lexicon.json` 的星号图例新增 `levels`，写明每一级的含义。
  - 星数由手册 OCR 读出，共写入 185 个两星、三星词条。OCR 漏掉的 43 个逐一对照页图确认；另抽查 37 个 OCR 结果，全部正确。
  - 学习页按原书印法显示 `*` / `**` / `***`，图例逐级列出当天用到的级别。
  - 高考手册只有一级星号，不受影响。
- 验证：`npm run validate` 819 个 item 0 错误；`npm test` 91 个通过；`npm run build` 通过（包括泄漏检查）；`npm run e2e` 241 个通过（新增星级用例）。
