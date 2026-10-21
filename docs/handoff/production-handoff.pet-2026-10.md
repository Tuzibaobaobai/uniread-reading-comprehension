# 本次生产交接 · PET 校园版真题 1–3（pet-2026-10）

> 配套规约：[`14-agent-production-rules.md`](../14-agent-production-rules.md) v0.6；模板：[`14-production-handoff.template.md`](../14-production-handoff.template.md)；制作规范：[`production-brief-pet.md`](../production-brief-pet.md)。本文只引用私有答案的位置，不粘贴答案。

## 本次交付范围

- **任务**：剑桥 B1 Preliminary for Schools（PET 青少版）官方真题三本书的全量生产，合集 `pet1`、`pet2`、`pet3`。
- **规约与依据**：Schema `schema/index.ts`（`SCHEMA_VERSION` 1.0，仅增量：key `explanationSource`）；`docs/production-brief-pet.md`（三本书通用，第 3 本另有输入说明）。
- **交付类型**：书籍目录（全书）。

  | 合集 | 书 | 原书 | 本次交付 | 说明 |
  | --- | --- | --- | --- | --- |
  | pet1 | PET 校园版真题 1（外研社） | 4 套 × 4 卷 | **16 篇**（第 1 套此前已交付并经人工审核，本次新增第 2–4 套 12 篇） | 第 4 套听力 Part 4 录音已补（#79） |
  | pet2 | PET 校园版真题 2（外研社，2023） | 4 套 × 4 卷 | **16 篇**（新增） | 3 段听力录音缺失（#101） |
  | pet3 | B1 Preliminary for Schools 3（Cambridge，2025） | 4 套 × 4 卷 | **16 篇**（新增） | 原书无中文解析，解析为生成内容 |
- **Item id**：`<pl>-t<N>-{r,w,l,s}`（阅读 / 写作 / 听力 / 口语），永久；小题 `q<印刷题号>`，各卷从 1 起。
- **标题**：`PET真题<B>-第<N>套-阅读/写作/听力/口语`；合集标题、简介见各 `playlist.json`。语言 `en`，界面中文。
- **难度**：Cambridge B1（gradeBand `B1`），不等同 UniRead 等级。官方时长：阅读 45′、写作 45′、听力约 30′（按 36′ 计时）、口语 14′。

## 本次更新与稳定题目ID

- 本次类型：首次生产（pet1 第 1 套全部沿用，未改动）。
- 历史已用／退役 ID：三个合集此前只有 `pet1-t1-*`，无退役 ID。

## 封面、音频与依赖

| 使用位置 | 路径 | 来源 | 交付 |
| --- | --- | --- | --- |
| 合集封面 / 横幅 | `assets/<pl>/cover.jpg`、`banner.jpg` | `scripts/make-cover.mjs` 统一模板生成（#76），非书籍扫描 | 是 |
| 题目图片 | `assets/<pl>/<pl>-t<N>-*.jpg`（告示、Part 2 人物照、听力图片选项、口语图片） | 从原书页面裁切，逐张人工目检 | 是 |
| 听力录音 | `assets/<pl>/<pl>-t<N>-p<K>.m4a`（48 kbps 单声道） | 原书音频转码（`scripts/audio.mjs`）；不进 git，随 `rc-media-<pl>.zip` 交付 | 45 / 48 段 |
| 口语考官 / AI 搭档语音 | `assets/<pl>/<itemId>-<qid>-<turnId>.mp3` | 火山引擎 TTS（考官 Amanda、搭档 Adam），`scripts/tts.mjs`；共 297 句 | 是 |

- **缺失录音**（GitHub #101，已指派补充）：pet2 第 1 套 Part 2、Part 4，第 4 套 Part 1。题目和听力原文照常制作；该 Part 无 `audio`，页面显示“本部分录音暂缺”，item `errata` 标注 #101。收到文件后转码接入即可，不需改题。

## 来源、版权和私有答案

- 页面图 / OCR：`.work/pages/<pl>/…`、`.work/text/<pl>/…`（本地，不交付）。各 item `source` 记录 PDF 名、PDF 页与书页。
- 私有 Key：`content/playlists/<pl>/keys/`，构建时从公开产物移除（泄漏检查通过）。
- **答案来源**：阅读、听力答案均为 `official`（答案册）；写作 anchors 取自书中范文及其印刷分数；口语参考与 AI 搭档台词为 `generated`。
- **中文解析来源**：pet1、pet2 依据答案册中文解析改写；**pet3 原书无中文解析，全部为制作方撰写，key 标 `explanationSource: "generated"`**。
- **审核状态**：全部 key `reviewStatus: pending`，待人工审核；Agent 复核不等于人工复核。
- **原书 / 答案册疑似错误**：见 errata issue #103（答案册中文解析错误 6 处已改写待确认；不确定读法 3 处）。试题本身按原样保留。

## 每类交互与验证

- 题型与 pet1 第 1 套一致：告示单选、Part 2 人物配对（照片 + 导语）、长文单选、七选五（8 选 5）、选择型完形、开放式完形、邮件写作（批注）、二选一写作（公告版式）、听力图片选项 / 单选 / 笔记填空 / 长对话一页、口语考官问答 / 看图长述 / AI 搭档讨论 / 追问。
- **实际执行的检查（2026-10-21）**：
  - `npm run validate`：600 篇 0 错误；新增 warning 仅 3 条（pet2 缺失录音）。
  - `npx tsx scripts/check-exam.ts <N> <pl>`：12 套 × 阅读 32 + 听力 25，全部 0 不一致（逐题与答案册 OCR 比对）。
  - `.work/pet-audit.py`：12 套全部 clean（证据引文必须出现在原文 / 听力原文、录音与时长对应、解析非空、AI 搭档 4–6 句、图片存在、reviewStatus pending）。
  - TTS：297 句全部有音频，语速与字数一致。
  - `npm test` 60 通过；`npm run e2e` 193 通过（三个视口）；`npm run build` 通过（含私有材料泄漏检查）。
  - 本地页面目检：合集页、阅读 Part 1/2/4、写作邮件与公告版式、听力（含缺失录音）、口语 Part 2/3。
- **未运行**：AI 评分对 pet2 / pet3 写作范文的留出法校准（沿用 pet1 已校准的 B1 评分提示）。

## RC 布局与交互还原交接

- 与已交付的 KET / PET 真题使用同一套页面与组件，无新组件、无 schema 破坏性变更；布局说明见设计说明页（题型设计说明）。

## 附：自动生成的清单（`npx tsx scripts/handoff-inventory.ts pet1 pet2 pet3`）

### pet1 · PET 校园版真题 1｜B1 Preliminary for Schools 官方真题（新题型）

- 合集封面：`assets/pet1/cover.jpg`（书籍封面扫描，sha256:a490ca3e41a8）；gradeBand：B1（学校年级，不等于 UniRead L 等级）；本次交付 16 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `pet1-t1-r-s1` | PET真题1-第1套-阅读 · Part 1. 阅读选择 | `pet1-t1-r` | `s1` | `pet1-t1-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 2 | `pet1-t1-r-s2` | PET真题1-第1套-阅读 · Part 2. 阅读选择 | `pet1-t1-r` | `s2` | `pet1-t1-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 3 | `pet1-t1-r-s3` | PET真题1-第1套-阅读 · Part 3. 阅读选择 | `pet1-t1-r` | `s3` | `pet1-t1-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 4 | `pet1-t1-r-s4` | PET真题1-第1套-阅读 · Part 4. 选词填空 | `pet1-t1-r` | `s4` | `pet1-t1-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 5 | `pet1-t1-r-s5` | PET真题1-第1套-阅读 · Part 5. 完形填空 | `pet1-t1-r` | `s5` | `pet1-t1-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 6 | `pet1-t1-r-s6` | PET真题1-第1套-阅读 · Part 6. 填空 | `pet1-t1-r` | `s6` | `pet1-t1-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 7 | `pet1-t1-w-s1` | PET真题1-第1套-写作 · Part 1. 回答问题 | `pet1-t1-w` | `s1` | `pet1-t1-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 8 | `pet1-t1-w-s2` | PET真题1-第1套-写作 · Part 2. 回答问题 | `pet1-t1-w` | `s2` | `pet1-t1-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 9 | `pet1-t1-l-s1` | PET真题1-第1套-听力 · Part 1. 阅读选择 | `pet1-t1-l` | `s1` | `pet1-t1-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 10 | `pet1-t1-l-s2` | PET真题1-第1套-听力 · Part 2. 阅读选择 | `pet1-t1-l` | `s2` | `pet1-t1-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 11 | `pet1-t1-l-s3` | PET真题1-第1套-听力 · Part 3. 填空 | `pet1-t1-l` | `s3` | `pet1-t1-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 12 | `pet1-t1-l-s4` | PET真题1-第1套-听力 · Part 4. 阅读选择 | `pet1-t1-l` | `s4` | `pet1-t1-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 13 | `pet1-t1-s-s1` | PET真题1-第1套-口语 · Part 1.  | `pet1-t1-s` | `s1` | `pet1-t1-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 14 | `pet1-t1-s-s2` | PET真题1-第1套-口语 · Part 2.  | `pet1-t1-s` | `s2` | `pet1-t1-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 15 | `pet1-t1-s-s3` | PET真题1-第1套-口语 · Part 3.  | `pet1-t1-s` | `s3` | `pet1-t1-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 16 | `pet1-t1-s-s4` | PET真题1-第1套-口语 · Part 4.  | `pet1-t1-s` | `s4` | `pet1-t1-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 17 | `pet1-t2-r-s1` | PET真题1-第2套-阅读 · Part 1. 阅读选择 | `pet1-t2-r` | `s1` | `pet1-t2-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 18 | `pet1-t2-r-s2` | PET真题1-第2套-阅读 · Part 2. 阅读选择 | `pet1-t2-r` | `s2` | `pet1-t2-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 19 | `pet1-t2-r-s3` | PET真题1-第2套-阅读 · Part 3. 阅读选择 | `pet1-t2-r` | `s3` | `pet1-t2-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 20 | `pet1-t2-r-s4` | PET真题1-第2套-阅读 · Part 4. 选词填空 | `pet1-t2-r` | `s4` | `pet1-t2-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 21 | `pet1-t2-r-s5` | PET真题1-第2套-阅读 · Part 5. 完形填空 | `pet1-t2-r` | `s5` | `pet1-t2-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 22 | `pet1-t2-r-s6` | PET真题1-第2套-阅读 · Part 6. 填空 | `pet1-t2-r` | `s6` | `pet1-t2-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 23 | `pet1-t2-w-s1` | PET真题1-第2套-写作 · Part 1. 回答问题 | `pet1-t2-w` | `s1` | `pet1-t2-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 24 | `pet1-t2-w-s2` | PET真题1-第2套-写作 · Part 2. 回答问题 | `pet1-t2-w` | `s2` | `pet1-t2-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 25 | `pet1-t2-l-s1` | PET真题1-第2套-听力 · Part 1. 阅读选择 | `pet1-t2-l` | `s1` | `pet1-t2-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 26 | `pet1-t2-l-s2` | PET真题1-第2套-听力 · Part 2. 阅读选择 | `pet1-t2-l` | `s2` | `pet1-t2-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 27 | `pet1-t2-l-s3` | PET真题1-第2套-听力 · Part 3. 填空 | `pet1-t2-l` | `s3` | `pet1-t2-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 28 | `pet1-t2-l-s4` | PET真题1-第2套-听力 · Part 4. 阅读选择 | `pet1-t2-l` | `s4` | `pet1-t2-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 29 | `pet1-t2-s-s1` | PET真题1-第2套-口语 · Part 1.  | `pet1-t2-s` | `s1` | `pet1-t2-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 30 | `pet1-t2-s-s2` | PET真题1-第2套-口语 · Part 2.  | `pet1-t2-s` | `s2` | `pet1-t2-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 31 | `pet1-t2-s-s3` | PET真题1-第2套-口语 · Part 3.  | `pet1-t2-s` | `s3` | `pet1-t2-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 32 | `pet1-t2-s-s4` | PET真题1-第2套-口语 · Part 4.  | `pet1-t2-s` | `s4` | `pet1-t2-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 33 | `pet1-t3-r-s1` | PET真题1-第3套-阅读 · Part 1. 阅读选择 | `pet1-t3-r` | `s1` | `pet1-t3-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 34 | `pet1-t3-r-s2` | PET真题1-第3套-阅读 · Part 2. 阅读选择 | `pet1-t3-r` | `s2` | `pet1-t3-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 35 | `pet1-t3-r-s3` | PET真题1-第3套-阅读 · Part 3. 阅读选择 | `pet1-t3-r` | `s3` | `pet1-t3-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 36 | `pet1-t3-r-s4` | PET真题1-第3套-阅读 · Part 4. 选词填空 | `pet1-t3-r` | `s4` | `pet1-t3-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 37 | `pet1-t3-r-s5` | PET真题1-第3套-阅读 · Part 5. 完形填空 | `pet1-t3-r` | `s5` | `pet1-t3-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 38 | `pet1-t3-r-s6` | PET真题1-第3套-阅读 · Part 6. 填空 | `pet1-t3-r` | `s6` | `pet1-t3-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 39 | `pet1-t3-w-s1` | PET真题1-第3套-写作 · Part 1. 回答问题 | `pet1-t3-w` | `s1` | `pet1-t3-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 40 | `pet1-t3-w-s2` | PET真题1-第3套-写作 · Part 2. 回答问题 | `pet1-t3-w` | `s2` | `pet1-t3-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 41 | `pet1-t3-l-s1` | PET真题1-第3套-听力 · Part 1. 阅读选择 | `pet1-t3-l` | `s1` | `pet1-t3-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 42 | `pet1-t3-l-s2` | PET真题1-第3套-听力 · Part 2. 阅读选择 | `pet1-t3-l` | `s2` | `pet1-t3-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 43 | `pet1-t3-l-s3` | PET真题1-第3套-听力 · Part 3. 填空 | `pet1-t3-l` | `s3` | `pet1-t3-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 44 | `pet1-t3-l-s4` | PET真题1-第3套-听力 · Part 4. 阅读选择 | `pet1-t3-l` | `s4` | `pet1-t3-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 45 | `pet1-t3-s-s1` | PET真题1-第3套-口语 · Part 1.  | `pet1-t3-s` | `s1` | `pet1-t3-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 46 | `pet1-t3-s-s2` | PET真题1-第3套-口语 · Part 2.  | `pet1-t3-s` | `s2` | `pet1-t3-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 47 | `pet1-t3-s-s3` | PET真题1-第3套-口语 · Part 3.  | `pet1-t3-s` | `s3` | `pet1-t3-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 48 | `pet1-t3-s-s4` | PET真题1-第3套-口语 · Part 4.  | `pet1-t3-s` | `s4` | `pet1-t3-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 49 | `pet1-t4-r-s1` | PET真题1-第4套-阅读 · Part 1. 阅读选择 | `pet1-t4-r` | `s1` | `pet1-t4-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 50 | `pet1-t4-r-s2` | PET真题1-第4套-阅读 · Part 2. 阅读选择 | `pet1-t4-r` | `s2` | `pet1-t4-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 51 | `pet1-t4-r-s3` | PET真题1-第4套-阅读 · Part 3. 阅读选择 | `pet1-t4-r` | `s3` | `pet1-t4-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 52 | `pet1-t4-r-s4` | PET真题1-第4套-阅读 · Part 4. 选词填空 | `pet1-t4-r` | `s4` | `pet1-t4-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 53 | `pet1-t4-r-s5` | PET真题1-第4套-阅读 · Part 5. 完形填空 | `pet1-t4-r` | `s5` | `pet1-t4-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 54 | `pet1-t4-r-s6` | PET真题1-第4套-阅读 · Part 6. 填空 | `pet1-t4-r` | `s6` | `pet1-t4-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 55 | `pet1-t4-w-s1` | PET真题1-第4套-写作 · Part 1. 回答问题 | `pet1-t4-w` | `s1` | `pet1-t4-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 56 | `pet1-t4-w-s2` | PET真题1-第4套-写作 · Part 2. 回答问题 | `pet1-t4-w` | `s2` | `pet1-t4-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 57 | `pet1-t4-l-s1` | PET真题1-第4套-听力 · Part 1. 阅读选择 | `pet1-t4-l` | `s1` | `pet1-t4-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 58 | `pet1-t4-l-s2` | PET真题1-第4套-听力 · Part 2. 阅读选择 | `pet1-t4-l` | `s2` | `pet1-t4-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 59 | `pet1-t4-l-s3` | PET真题1-第4套-听力 · Part 3. 填空 | `pet1-t4-l` | `s3` | `pet1-t4-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 60 | `pet1-t4-l-s4` | PET真题1-第4套-听力 · Part 4. 阅读选择 | `pet1-t4-l` | `s4` | `pet1-t4-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 61 | `pet1-t4-s-s1` | PET真题1-第4套-口语 · Part 1.  | `pet1-t4-s` | `s1` | `pet1-t4-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 62 | `pet1-t4-s-s2` | PET真题1-第4套-口语 · Part 2.  | `pet1-t4-s` | `s2` | `pet1-t4-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 63 | `pet1-t4-s-s3` | PET真题1-第4套-口语 · Part 3.  | `pet1-t4-s` | `s3` | `pet1-t4-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 64 | `pet1-t4-s-s4` | PET真题1-第4套-口语 · Part 4.  | `pet1-t4-s` | `s4` | `pet1-t4-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pet1-t1-r` | 1,2,3,4,5,6,7,8,9,10／8,9,10,11,12,13,14,15,16,17 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t1-w` | 11,12／18,19 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t1-l` | 13,14,15,16,17,18／20,21,22,23,24,25 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet1/pet1-t1-p1.m4a`<br>`assets/pet1/pet1-t1-p2.m4a`<br>`assets/pet1/pet1-t1-p3.m4a`<br>`assets/pet1/pet1-t1-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet1-t1-s` | 19,20,21,22／80,81,82,83 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t2-r` | 1,2,3,4,5,6,7,8,9,10／26,27,28,29,30,31,32,33,34,35 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t2-w` | 11,12／36,37 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t2-l` | 13,14,15,16,17,18／38,39,40,41,42,43 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet1/pet1-t2-p1.m4a`<br>`assets/pet1/pet1-t2-p2.m4a`<br>`assets/pet1/pet1-t2-p3.m4a`<br>`assets/pet1/pet1-t2-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet1-t2-s` | 19,20,21,22／84,85,86,87 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t3-r` | 1,2,3,4,5,6,7,8,9,10／44,45,46,47,48,49,50,51,52,53 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t3-w` | 11,12／54,55 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t3-l` | 13,14,15,16,17,18／56,57,58,59,60,61 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet1/pet1-t3-p1.m4a`<br>`assets/pet1/pet1-t3-p2.m4a`<br>`assets/pet1/pet1-t3-p3.m4a`<br>`assets/pet1/pet1-t3-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet1-t3-s` | 19,20,21,22／88,89,90,91 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t4-r` | 1,2,3,4,5,6,7,8,9,10／62,63,64,65,66,67,68,69,70,71 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t4-w` | 11,12／72,73 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet1-t4-l` | 13,14,15,16,17,18／74,75,76,77,78,79 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet1/pet1-t4-p1.m4a`<br>`assets/pet1/pet1-t4-p2.m4a`<br>`assets/pet1/pet1-t4-p3.m4a`<br>`assets/pet1/pet1-t4-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet1-t4-s` | 19,20,21,22／92,93,94,95 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `pet1-t1-r` | `content/playlists/pet1/keys/pet1-t1-r.json` | b3808451906f | official | Test 1 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet1-t1-w` | `content/playlists/pet1/keys/pet1-t1-w.json` | 3037f6d44da7 | official | Test 1 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet1-t1-l` | `content/playlists/pet1/keys/pet1-t1-l.json` | 6be1f9ba4d45 | official | Test 1 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42 | pending | transcribed v1.0.0 |
| `pet1-t1-s` | `content/playlists/pet1/keys/pet1-t1-s.json` | b35151b78826 | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet1-t2-r` | `content/playlists/pet1/keys/pet1-t2-r.json` | 1fa95c810459 | official | Test 2 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet1-t2-w` | `content/playlists/pet1/keys/pet1-t2-w.json` | 307d6bfa8ea7 | official | Test 2 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet1-t2-l` | `content/playlists/pet1/keys/pet1-t2-l.json` | e88715a63a21 | official | Test 2 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42 | pending | transcribed v1.0.0 |
| `pet1-t2-s` | `content/playlists/pet1/keys/pet1-t2-s.json` | b5545010d746 | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet1-t3-r` | `content/playlists/pet1/keys/pet1-t3-r.json` | 47ae0277ec0e | official | Test 3 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet1-t3-w` | `content/playlists/pet1/keys/pet1-t3-w.json` | 1dde03c5bb65 | official | Test 3 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet1-t3-l` | `content/playlists/pet1/keys/pet1-t3-l.json` | 236a27ecb22b | official | Test 3 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42 | pending | transcribed v1.0.0 |
| `pet1-t3-s` | `content/playlists/pet1/keys/pet1-t3-s.json` | b0f241194ef6 | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet1-t4-r` | `content/playlists/pet1/keys/pet1-t4-r.json` | dfb01747f800 | official | Test 4 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet1-t4-w` | `content/playlists/pet1/keys/pet1-t4-w.json` | 6646c5cba3b4 | official | Test 4 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet1-t4-l` | `content/playlists/pet1/keys/pet1-t4-l.json` | 884aec5c5f00 | official | Test 4 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42 | pending | transcribed v1.0.0 |
| `pet1-t4-s` | `content/playlists/pet1/keys/pet1-t4-s.json` | 5f7b25e9b1c2 | generated | —（生成） | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 136 | 可适配（single-selection） |
| 共享词／句库（gapMatch） | 20 | 可适配（slot-selection） |
| 完形（每空单选）（inlineChoice） | 24 | 可适配（single-selection，按空；需逐题核对） |
| 文本填空（textEntry） | 48 | 待平台适配 |
| 开放问答（extendedText） | 12 | 待平台适配（含 LLM 评分） |
| 口语录音（AI 评分）（speaking） | 16 | undefined |

### pet2 · PET 校园版真题 2｜B1 Preliminary for Schools 官方真题（新题型）

- 合集封面：`assets/pet2/cover.jpg`（书籍封面扫描，sha256:9d3e0964ddcb）；gradeBand：B1（学校年级，不等于 UniRead L 等级）；本次交付 16 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `pet2-t1-r-s1` | PET真题2-第1套-阅读 · Part 1. 阅读选择 | `pet2-t1-r` | `s1` | `pet2-t1-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 2 | `pet2-t1-r-s2` | PET真题2-第1套-阅读 · Part 2. 阅读选择 | `pet2-t1-r` | `s2` | `pet2-t1-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 3 | `pet2-t1-r-s3` | PET真题2-第1套-阅读 · Part 3. 阅读选择 | `pet2-t1-r` | `s3` | `pet2-t1-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 4 | `pet2-t1-r-s4` | PET真题2-第1套-阅读 · Part 4. 选词填空 | `pet2-t1-r` | `s4` | `pet2-t1-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 5 | `pet2-t1-r-s5` | PET真题2-第1套-阅读 · Part 5. 完形填空 | `pet2-t1-r` | `s5` | `pet2-t1-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 6 | `pet2-t1-r-s6` | PET真题2-第1套-阅读 · Part 6. 填空 | `pet2-t1-r` | `s6` | `pet2-t1-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 7 | `pet2-t1-w-s1` | PET真题2-第1套-写作 · Part 1. 回答问题 | `pet2-t1-w` | `s1` | `pet2-t1-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 8 | `pet2-t1-w-s2` | PET真题2-第1套-写作 · Part 2. 回答问题 | `pet2-t1-w` | `s2` | `pet2-t1-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 9 | `pet2-t1-l-s1` | PET真题2-第1套-听力 · Part 1. 阅读选择 | `pet2-t1-l` | `s1` | `pet2-t1-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 10 | `pet2-t1-l-s2` | PET真题2-第1套-听力 · Part 2. 阅读选择 | `pet2-t1-l` | `s2` | `pet2-t1-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 11 | `pet2-t1-l-s3` | PET真题2-第1套-听力 · Part 3. 填空 | `pet2-t1-l` | `s3` | `pet2-t1-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 12 | `pet2-t1-l-s4` | PET真题2-第1套-听力 · Part 4. 阅读选择 | `pet2-t1-l` | `s4` | `pet2-t1-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 13 | `pet2-t1-s-s1` | PET真题2-第1套-口语 · Part 1.  | `pet2-t1-s` | `s1` | `pet2-t1-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 14 | `pet2-t1-s-s2` | PET真题2-第1套-口语 · Part 2.  | `pet2-t1-s` | `s2` | `pet2-t1-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 15 | `pet2-t1-s-s3` | PET真题2-第1套-口语 · Part 3.  | `pet2-t1-s` | `s3` | `pet2-t1-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 16 | `pet2-t1-s-s4` | PET真题2-第1套-口语 · Part 4.  | `pet2-t1-s` | `s4` | `pet2-t1-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 17 | `pet2-t2-r-s1` | PET真题2-第2套-阅读 · Part 1. 阅读选择 | `pet2-t2-r` | `s1` | `pet2-t2-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 18 | `pet2-t2-r-s2` | PET真题2-第2套-阅读 · Part 2. 阅读选择 | `pet2-t2-r` | `s2` | `pet2-t2-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 19 | `pet2-t2-r-s3` | PET真题2-第2套-阅读 · Part 3. 阅读选择 | `pet2-t2-r` | `s3` | `pet2-t2-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 20 | `pet2-t2-r-s4` | PET真题2-第2套-阅读 · Part 4. 选词填空 | `pet2-t2-r` | `s4` | `pet2-t2-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 21 | `pet2-t2-r-s5` | PET真题2-第2套-阅读 · Part 5. 完形填空 | `pet2-t2-r` | `s5` | `pet2-t2-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 22 | `pet2-t2-r-s6` | PET真题2-第2套-阅读 · Part 6. 填空 | `pet2-t2-r` | `s6` | `pet2-t2-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 23 | `pet2-t2-w-s1` | PET真题2-第2套-写作 · Part 1. 回答问题 | `pet2-t2-w` | `s1` | `pet2-t2-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 24 | `pet2-t2-w-s2` | PET真题2-第2套-写作 · Part 2. 回答问题 | `pet2-t2-w` | `s2` | `pet2-t2-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 25 | `pet2-t2-l-s1` | PET真题2-第2套-听力 · Part 1. 阅读选择 | `pet2-t2-l` | `s1` | `pet2-t2-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 26 | `pet2-t2-l-s2` | PET真题2-第2套-听力 · Part 2. 阅读选择 | `pet2-t2-l` | `s2` | `pet2-t2-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 27 | `pet2-t2-l-s3` | PET真题2-第2套-听力 · Part 3. 填空 | `pet2-t2-l` | `s3` | `pet2-t2-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 28 | `pet2-t2-l-s4` | PET真题2-第2套-听力 · Part 4. 阅读选择 | `pet2-t2-l` | `s4` | `pet2-t2-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 29 | `pet2-t2-s-s1` | PET真题2-第2套-口语 · Part 1.  | `pet2-t2-s` | `s1` | `pet2-t2-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 30 | `pet2-t2-s-s2` | PET真题2-第2套-口语 · Part 2.  | `pet2-t2-s` | `s2` | `pet2-t2-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 31 | `pet2-t2-s-s3` | PET真题2-第2套-口语 · Part 3.  | `pet2-t2-s` | `s3` | `pet2-t2-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 32 | `pet2-t2-s-s4` | PET真题2-第2套-口语 · Part 4.  | `pet2-t2-s` | `s4` | `pet2-t2-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 33 | `pet2-t3-r-s1` | PET真题2-第3套-阅读 · Part 1. 阅读选择 | `pet2-t3-r` | `s1` | `pet2-t3-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 34 | `pet2-t3-r-s2` | PET真题2-第3套-阅读 · Part 2. 阅读选择 | `pet2-t3-r` | `s2` | `pet2-t3-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 35 | `pet2-t3-r-s3` | PET真题2-第3套-阅读 · Part 3. 阅读选择 | `pet2-t3-r` | `s3` | `pet2-t3-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 36 | `pet2-t3-r-s4` | PET真题2-第3套-阅读 · Part 4. 选词填空 | `pet2-t3-r` | `s4` | `pet2-t3-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 37 | `pet2-t3-r-s5` | PET真题2-第3套-阅读 · Part 5. 完形填空 | `pet2-t3-r` | `s5` | `pet2-t3-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 38 | `pet2-t3-r-s6` | PET真题2-第3套-阅读 · Part 6. 填空 | `pet2-t3-r` | `s6` | `pet2-t3-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 39 | `pet2-t3-w-s1` | PET真题2-第3套-写作 · Part 1. 回答问题 | `pet2-t3-w` | `s1` | `pet2-t3-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 40 | `pet2-t3-w-s2` | PET真题2-第3套-写作 · Part 2. 回答问题 | `pet2-t3-w` | `s2` | `pet2-t3-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 41 | `pet2-t3-l-s1` | PET真题2-第3套-听力 · Part 1. 阅读选择 | `pet2-t3-l` | `s1` | `pet2-t3-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 42 | `pet2-t3-l-s2` | PET真题2-第3套-听力 · Part 2. 阅读选择 | `pet2-t3-l` | `s2` | `pet2-t3-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 43 | `pet2-t3-l-s3` | PET真题2-第3套-听力 · Part 3. 填空 | `pet2-t3-l` | `s3` | `pet2-t3-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 44 | `pet2-t3-l-s4` | PET真题2-第3套-听力 · Part 4. 阅读选择 | `pet2-t3-l` | `s4` | `pet2-t3-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 45 | `pet2-t3-s-s1` | PET真题2-第3套-口语 · Part 1.  | `pet2-t3-s` | `s1` | `pet2-t3-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 46 | `pet2-t3-s-s2` | PET真题2-第3套-口语 · Part 2.  | `pet2-t3-s` | `s2` | `pet2-t3-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 47 | `pet2-t3-s-s3` | PET真题2-第3套-口语 · Part 3.  | `pet2-t3-s` | `s3` | `pet2-t3-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 48 | `pet2-t3-s-s4` | PET真题2-第3套-口语 · Part 4.  | `pet2-t3-s` | `s4` | `pet2-t3-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 49 | `pet2-t4-r-s1` | PET真题2-第4套-阅读 · Part 1. 阅读选择 | `pet2-t4-r` | `s1` | `pet2-t4-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 50 | `pet2-t4-r-s2` | PET真题2-第4套-阅读 · Part 2. 阅读选择 | `pet2-t4-r` | `s2` | `pet2-t4-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 51 | `pet2-t4-r-s3` | PET真题2-第4套-阅读 · Part 3. 阅读选择 | `pet2-t4-r` | `s3` | `pet2-t4-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 52 | `pet2-t4-r-s4` | PET真题2-第4套-阅读 · Part 4. 选词填空 | `pet2-t4-r` | `s4` | `pet2-t4-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 53 | `pet2-t4-r-s5` | PET真题2-第4套-阅读 · Part 5. 完形填空 | `pet2-t4-r` | `s5` | `pet2-t4-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 54 | `pet2-t4-r-s6` | PET真题2-第4套-阅读 · Part 6. 填空 | `pet2-t4-r` | `s6` | `pet2-t4-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 55 | `pet2-t4-w-s1` | PET真题2-第4套-写作 · Part 1. 回答问题 | `pet2-t4-w` | `s1` | `pet2-t4-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 56 | `pet2-t4-w-s2` | PET真题2-第4套-写作 · Part 2. 回答问题 | `pet2-t4-w` | `s2` | `pet2-t4-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 57 | `pet2-t4-l-s1` | PET真题2-第4套-听力 · Part 1. 阅读选择 | `pet2-t4-l` | `s1` | `pet2-t4-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 58 | `pet2-t4-l-s2` | PET真题2-第4套-听力 · Part 2. 阅读选择 | `pet2-t4-l` | `s2` | `pet2-t4-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 59 | `pet2-t4-l-s3` | PET真题2-第4套-听力 · Part 3. 填空 | `pet2-t4-l` | `s3` | `pet2-t4-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 60 | `pet2-t4-l-s4` | PET真题2-第4套-听力 · Part 4. 阅读选择 | `pet2-t4-l` | `s4` | `pet2-t4-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 61 | `pet2-t4-s-s1` | PET真题2-第4套-口语 · Part 1.  | `pet2-t4-s` | `s1` | `pet2-t4-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 62 | `pet2-t4-s-s2` | PET真题2-第4套-口语 · Part 2.  | `pet2-t4-s` | `s2` | `pet2-t4-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 63 | `pet2-t4-s-s3` | PET真题2-第4套-口语 · Part 3.  | `pet2-t4-s` | `s3` | `pet2-t4-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 64 | `pet2-t4-s-s4` | PET真题2-第4套-口语 · Part 4.  | `pet2-t4-s` | `s4` | `pet2-t4-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pet2-t1-r` | 1,2,3,4,5,6,7,8,9,10／8,9,10,11,12,13,14,15,16,17 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t1-w` | 11,12／18,19 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t1-l` | 13,14,15,16,17,18／20,21,22,23,24,25 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet2/pet2-t1-p1.m4a`<br>`assets/pet2/pet2-t1-p3.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet2-t1-s` | 19,20,21,22／80,81,82,83 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t2-r` | 1,2,3,4,5,6,7,8,9,10／26,27,28,29,30,31,32,33,34,35 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t2-w` | 11,12／36,37 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t2-l` | 13,14,15,16,17,18／38,39,40,41,42,43 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet2/pet2-t2-p1.m4a`<br>`assets/pet2/pet2-t2-p2.m4a`<br>`assets/pet2/pet2-t2-p3.m4a`<br>`assets/pet2/pet2-t2-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet2-t2-s` | 21,22,23,24／84,85,86,87 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t3-r` | 1,2,3,4,5,6,7,8,9,10／44,45,46,47,48,49,50,51,52,53 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t3-w` | 11,12／54,55 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t3-l` | 13,14,15,16,17,18／56,57,58,59,60,61 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet2/pet2-t3-p1.m4a`<br>`assets/pet2/pet2-t3-p2.m4a`<br>`assets/pet2/pet2-t3-p3.m4a`<br>`assets/pet2/pet2-t3-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet2-t3-s` | 19,20,21,22／88,89,90,91 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t4-r` | 1,2,3,4,5,6,7,8,9,10／62,63,64,65,66,67,68,69,70,71 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t4-w` | 11,12／72,73 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet2-t4-l` | 13,14,15,16,17,18／74,75,76,77,78,79 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet2/pet2-t4-p2.m4a`<br>`assets/pet2/pet2-t4-p3.m4a`<br>`assets/pet2/pet2-t4-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet2-t4-s` | 19,20,21,22／92,93,94,95 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `pet2-t1-r` | `content/playlists/pet2/keys/pet2-t1-r.json` | 53ee2d366aa7 | official | Test 1 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet2-t1-w` | `content/playlists/pet2/keys/pet2-t1-w.json` | 5eaef9d71ab6 | official | Test 1 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet2-t1-l` | `content/playlists/pet2/keys/pet2-t1-l.json` | 62cb88b7cbf4 | official | Test 1 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42,43 | pending | transcribed v1.0.0 |
| `pet2-t1-s` | `content/playlists/pet2/keys/pet2-t1-s.json` | 7a105ca907fb | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet2-t2-r` | `content/playlists/pet2/keys/pet2-t2-r.json` | f0eeb8a761ae | official | Test 2 完整试卷+答案解析.pdf p.25,37,38,39,40 | pending | transcribed v1.0.0 |
| `pet2-t2-w` | `content/playlists/pet2/keys/pet2-t2-w.json` | 74ad1283b27b | official | Test 2 完整试卷+答案解析.pdf p.26,27,28,29,30,31 | pending | transcribed v1.0.0 |
| `pet2-t2-l` | `content/playlists/pet2/keys/pet2-t2-l.json` | 9ea5f5bb5e2d | official | Test 2 完整试卷+答案解析.pdf p.32,33,34,35,36,41,42,43,44,45 | pending | transcribed v1.0.0 |
| `pet2-t2-s` | `content/playlists/pet2/keys/pet2-t2-s.json` | c44daf52ab54 | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet2-t3-r` | `content/playlists/pet2/keys/pet2-t3-r.json` | b1c824eacbe4 | official | Test 3 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet2-t3-w` | `content/playlists/pet2/keys/pet2-t3-w.json` | b2527aeeacf5 | official | Test 3 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet2-t3-l` | `content/playlists/pet2/keys/pet2-t3-l.json` | 8ef81116a63c | official | Test 3 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42,43 | pending | transcribed v1.0.0 |
| `pet2-t3-s` | `content/playlists/pet2/keys/pet2-t3-s.json` | 01cb346f8b6f | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet2-t4-r` | `content/playlists/pet2/keys/pet2-t4-r.json` | 29156fccb6a4 | official | Test 4 完整试卷+答案解析.pdf p.23,35,36,37,38,39 | pending | transcribed v1.0.0 |
| `pet2-t4-w` | `content/playlists/pet2/keys/pet2-t4-w.json` | 6b95b471dbb0 | official | Test 4 完整试卷+答案解析.pdf p.24,25,26,27,28,29 | pending | transcribed v1.0.0 |
| `pet2-t4-l` | `content/playlists/pet2/keys/pet2-t4-l.json` | 8f3022a09c6c | official | Test 4 完整试卷+答案解析.pdf p.30,31,32,33,34,39,40,41,42,43 | pending | transcribed v1.0.0 |
| `pet2-t4-s` | `content/playlists/pet2/keys/pet2-t4-s.json` | 5d45aec1b666 | generated | —（生成） | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 136 | 可适配（single-selection） |
| 共享词／句库（gapMatch） | 20 | 可适配（slot-selection） |
| 完形（每空单选）（inlineChoice） | 24 | 可适配（single-selection，按空；需逐题核对） |
| 文本填空（textEntry） | 48 | 待平台适配 |
| 开放问答（extendedText） | 12 | 待平台适配（含 LLM 评分） |
| 口语录音（AI 评分）（speaking） | 16 | undefined |

### pet3 · PET 校园版真题 3｜B1 Preliminary for Schools 官方真题（新题型）

- 合集封面：`assets/pet3/cover.jpg`（书籍封面扫描，sha256:48ff7147d09c）；gradeBand：B1（学校年级，不等于 UniRead L 等级）；本次交付 16 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `pet3-t1-r-s1` | PET真题3-第1套-阅读 · Part 1. 阅读选择 | `pet3-t1-r` | `s1` | `pet3-t1-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 2 | `pet3-t1-r-s2` | PET真题3-第1套-阅读 · Part 2. 阅读选择 | `pet3-t1-r` | `s2` | `pet3-t1-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 3 | `pet3-t1-r-s3` | PET真题3-第1套-阅读 · Part 3. 阅读选择 | `pet3-t1-r` | `s3` | `pet3-t1-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 4 | `pet3-t1-r-s4` | PET真题3-第1套-阅读 · Part 4. 选词填空 | `pet3-t1-r` | `s4` | `pet3-t1-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 5 | `pet3-t1-r-s5` | PET真题3-第1套-阅读 · Part 5. 完形填空 | `pet3-t1-r` | `s5` | `pet3-t1-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 6 | `pet3-t1-r-s6` | PET真题3-第1套-阅读 · Part 6. 填空 | `pet3-t1-r` | `s6` | `pet3-t1-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 7 | `pet3-t1-w-s1` | PET真题3-第1套-写作 · Part 1. 回答问题 | `pet3-t1-w` | `s1` | `pet3-t1-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 8 | `pet3-t1-w-s2` | PET真题3-第1套-写作 · Part 2. 回答问题 | `pet3-t1-w` | `s2` | `pet3-t1-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 9 | `pet3-t1-l-s1` | PET真题3-第1套-听力 · Part 1. 阅读选择 | `pet3-t1-l` | `s1` | `pet3-t1-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 10 | `pet3-t1-l-s2` | PET真题3-第1套-听力 · Part 2. 阅读选择 | `pet3-t1-l` | `s2` | `pet3-t1-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 11 | `pet3-t1-l-s3` | PET真题3-第1套-听力 · Part 3. 填空 | `pet3-t1-l` | `s3` | `pet3-t1-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 12 | `pet3-t1-l-s4` | PET真题3-第1套-听力 · Part 4. 阅读选择 | `pet3-t1-l` | `s4` | `pet3-t1-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 13 | `pet3-t1-s-s1` | PET真题3-第1套-口语 · Part 1.  | `pet3-t1-s` | `s1` | `pet3-t1-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 14 | `pet3-t1-s-s2` | PET真题3-第1套-口语 · Part 2.  | `pet3-t1-s` | `s2` | `pet3-t1-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 15 | `pet3-t1-s-s3` | PET真题3-第1套-口语 · Part 3.  | `pet3-t1-s` | `s3` | `pet3-t1-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 16 | `pet3-t1-s-s4` | PET真题3-第1套-口语 · Part 4.  | `pet3-t1-s` | `s4` | `pet3-t1-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 17 | `pet3-t2-r-s1` | PET真题3-第2套-阅读 · Part 1. 阅读选择 | `pet3-t2-r` | `s1` | `pet3-t2-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 18 | `pet3-t2-r-s2` | PET真题3-第2套-阅读 · Part 2. 阅读选择 | `pet3-t2-r` | `s2` | `pet3-t2-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 19 | `pet3-t2-r-s3` | PET真题3-第2套-阅读 · Part 3. 阅读选择 | `pet3-t2-r` | `s3` | `pet3-t2-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 20 | `pet3-t2-r-s4` | PET真题3-第2套-阅读 · Part 4. 选词填空 | `pet3-t2-r` | `s4` | `pet3-t2-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 21 | `pet3-t2-r-s5` | PET真题3-第2套-阅读 · Part 5. 完形填空 | `pet3-t2-r` | `s5` | `pet3-t2-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 22 | `pet3-t2-r-s6` | PET真题3-第2套-阅读 · Part 6. 填空 | `pet3-t2-r` | `s6` | `pet3-t2-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 23 | `pet3-t2-w-s1` | PET真题3-第2套-写作 · Part 1. 回答问题 | `pet3-t2-w` | `s1` | `pet3-t2-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 24 | `pet3-t2-w-s2` | PET真题3-第2套-写作 · Part 2. 回答问题 | `pet3-t2-w` | `s2` | `pet3-t2-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 25 | `pet3-t2-l-s1` | PET真题3-第2套-听力 · Part 1. 阅读选择 | `pet3-t2-l` | `s1` | `pet3-t2-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 26 | `pet3-t2-l-s2` | PET真题3-第2套-听力 · Part 2. 阅读选择 | `pet3-t2-l` | `s2` | `pet3-t2-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 27 | `pet3-t2-l-s3` | PET真题3-第2套-听力 · Part 3. 填空 | `pet3-t2-l` | `s3` | `pet3-t2-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 28 | `pet3-t2-l-s4` | PET真题3-第2套-听力 · Part 4. 阅读选择 | `pet3-t2-l` | `s4` | `pet3-t2-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 29 | `pet3-t2-s-s1` | PET真题3-第2套-口语 · Part 1.  | `pet3-t2-s` | `s1` | `pet3-t2-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 30 | `pet3-t2-s-s2` | PET真题3-第2套-口语 · Part 2.  | `pet3-t2-s` | `s2` | `pet3-t2-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 31 | `pet3-t2-s-s3` | PET真题3-第2套-口语 · Part 3.  | `pet3-t2-s` | `s3` | `pet3-t2-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 32 | `pet3-t2-s-s4` | PET真题3-第2套-口语 · Part 4.  | `pet3-t2-s` | `s4` | `pet3-t2-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 33 | `pet3-t3-r-s1` | PET真题3-第3套-阅读 · Part 1. 阅读选择 | `pet3-t3-r` | `s1` | `pet3-t3-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 34 | `pet3-t3-r-s2` | PET真题3-第3套-阅读 · Part 2. 阅读选择 | `pet3-t3-r` | `s2` | `pet3-t3-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 35 | `pet3-t3-r-s3` | PET真题3-第3套-阅读 · Part 3. 阅读选择 | `pet3-t3-r` | `s3` | `pet3-t3-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 36 | `pet3-t3-r-s4` | PET真题3-第3套-阅读 · Part 4. 选词填空 | `pet3-t3-r` | `s4` | `pet3-t3-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 37 | `pet3-t3-r-s5` | PET真题3-第3套-阅读 · Part 5. 完形填空 | `pet3-t3-r` | `s5` | `pet3-t3-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 38 | `pet3-t3-r-s6` | PET真题3-第3套-阅读 · Part 6. 填空 | `pet3-t3-r` | `s6` | `pet3-t3-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 39 | `pet3-t3-w-s1` | PET真题3-第3套-写作 · Part 1. 回答问题 | `pet3-t3-w` | `s1` | `pet3-t3-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 40 | `pet3-t3-w-s2` | PET真题3-第3套-写作 · Part 2. 回答问题 | `pet3-t3-w` | `s2` | `pet3-t3-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 41 | `pet3-t3-l-s1` | PET真题3-第3套-听力 · Part 1. 阅读选择 | `pet3-t3-l` | `s1` | `pet3-t3-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 42 | `pet3-t3-l-s2` | PET真题3-第3套-听力 · Part 2. 阅读选择 | `pet3-t3-l` | `s2` | `pet3-t3-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 43 | `pet3-t3-l-s3` | PET真题3-第3套-听力 · Part 3. 填空 | `pet3-t3-l` | `s3` | `pet3-t3-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 44 | `pet3-t3-l-s4` | PET真题3-第3套-听力 · Part 4. 阅读选择 | `pet3-t3-l` | `s4` | `pet3-t3-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 45 | `pet3-t3-s-s1` | PET真题3-第3套-口语 · Part 1.  | `pet3-t3-s` | `s1` | `pet3-t3-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 46 | `pet3-t3-s-s2` | PET真题3-第3套-口语 · Part 2.  | `pet3-t3-s` | `s2` | `pet3-t3-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 47 | `pet3-t3-s-s3` | PET真题3-第3套-口语 · Part 3.  | `pet3-t3-s` | `s3` | `pet3-t3-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 48 | `pet3-t3-s-s4` | PET真题3-第3套-口语 · Part 4.  | `pet3-t3-s` | `s4` | `pet3-t3-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |
| 49 | `pet3-t4-r-s1` | PET真题3-第4套-阅读 · Part 1. 阅读选择 | `pet3-t4-r` | `s1` | `pet3-t4-r-article`（6 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 50 | `pet3-t4-r-s2` | PET真题3-第4套-阅读 · Part 2. 阅读选择 | `pet3-t4-r` | `s2` | `pet3-t4-r-article`（6 个大题共用） | q6–q10／5 | 5 | 单选 | — |
| 51 | `pet3-t4-r-s3` | PET真题3-第4套-阅读 · Part 3. 阅读选择 | `pet3-t4-r` | `s3` | `pet3-t4-r-article`（6 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 52 | `pet3-t4-r-s4` | PET真题3-第4套-阅读 · Part 4. 选词填空 | `pet3-t4-r` | `s4` | `pet3-t4-r-article`（6 个大题共用） | q16–q20／5 | 5 | 共享词／句库 | 本大题内 8 项供 5 空，每项限用一次，改选即从原空释放 |
| 53 | `pet3-t4-r-s5` | PET真题3-第4套-阅读 · Part 5. 完形填空 | `pet3-t4-r` | `s5` | `pet3-t4-r-article`（6 个大题共用） | q21–q26／6 | 6 | 完形（每空单选） | — |
| 54 | `pet3-t4-r-s6` | PET真题3-第4套-阅读 · Part 6. 填空 | `pet3-t4-r` | `s6` | `pet3-t4-r-article`（6 个大题共用） | q27–q32／6 | 6 | 文本填空 | — |
| 55 | `pet3-t4-w-s1` | PET真题3-第4套-写作 · Part 1. 回答问题 | `pet3-t4-w` | `s1` | `pet3-t4-w-article`（2 个大题共用） | q1–q1／1 | 20 | 开放问答 | — |
| 56 | `pet3-t4-w-s2` | PET真题3-第4套-写作 · Part 2. 回答问题 | `pet3-t4-w` | `s2` | `pet3-t4-w-article`（2 个大题共用） | q2–q3／2 | 40 | 开放问答 | — |
| 57 | `pet3-t4-l-s1` | PET真题3-第4套-听力 · Part 1. 阅读选择 | `pet3-t4-l` | `s1` | `pet3-t4-l-article`（4 个大题共用） | q1–q7／7 | 7 | 单选 | — |
| 58 | `pet3-t4-l-s2` | PET真题3-第4套-听力 · Part 2. 阅读选择 | `pet3-t4-l` | `s2` | `pet3-t4-l-article`（4 个大题共用） | q8–q13／6 | 6 | 单选 | — |
| 59 | `pet3-t4-l-s3` | PET真题3-第4套-听力 · Part 3. 填空 | `pet3-t4-l` | `s3` | `pet3-t4-l-article`（4 个大题共用） | q14–q19／6 | 6 | 文本填空 | — |
| 60 | `pet3-t4-l-s4` | PET真题3-第4套-听力 · Part 4. 阅读选择 | `pet3-t4-l` | `s4` | `pet3-t4-l-article`（4 个大题共用） | q20–q25／6 | 6 | 单选 | — |
| 61 | `pet3-t4-s-s1` | PET真题3-第4套-口语 · Part 1.  | `pet3-t4-s` | `s1` | `pet3-t4-s-article`（4 个大题共用） | q1–q1／1 | 20 | 口语录音（AI 评分） | — |
| 62 | `pet3-t4-s-s2` | PET真题3-第4套-口语 · Part 2.  | `pet3-t4-s` | `s2` | `pet3-t4-s-article`（4 个大题共用） | q2–q2／1 | 20 | 口语录音（AI 评分） | — |
| 63 | `pet3-t4-s-s3` | PET真题3-第4套-口语 · Part 3.  | `pet3-t4-s` | `s3` | `pet3-t4-s-article`（4 个大题共用） | q3–q3／1 | 20 | 口语录音（AI 评分） | — |
| 64 | `pet3-t4-s-s4` | PET真题3-第4套-口语 · Part 4.  | `pet3-t4-s` | `s4` | `pet3-t4-s-article`（4 个大题共用） | q4–q4／1 | 20 | 口语录音（AI 评分） | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pet3-t1-r` | 1,2,3,4,5,6,7,8,9,10／8,9,10,11,12,13,14,15,16,17 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t1-w` | 11,12／18,19 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t1-l` | 13,14,15,16,17,18／20,21,22,23,24,25 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet3/pet3-t1-p1.m4a`<br>`assets/pet3/pet3-t1-p2.m4a`<br>`assets/pet3/pet3-t1-p3.m4a`<br>`assets/pet3/pet3-t1-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet3-t1-s` | 1,2,3,4／80,81,82,83 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t2-r` | 1,2,3,4,5,6,7,8,9,10／26,27,28,29,30,31,32,33,34,35 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t2-w` | 11,12／36,37 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t2-l` | 13,14,15,16,17,18／38,39,40,41,42,43 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet3/pet3-t2-p1.m4a`<br>`assets/pet3/pet3-t2-p2.m4a`<br>`assets/pet3/pet3-t2-p3.m4a`<br>`assets/pet3/pet3-t2-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet3-t2-s` | 1,2,3,4／84,85,86,87 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t3-r` | 1,2,3,4,5,6,7,8,9,10／44,45,46,47,48,49,50,51,52,53 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t3-w` | 11,12／54,55 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t3-l` | 13,14,15,16,17,18／56,57,58,59,60,61 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet3/pet3-t3-p1.m4a`<br>`assets/pet3/pet3-t3-p2.m4a`<br>`assets/pet3/pet3-t3-p3.m4a`<br>`assets/pet3/pet3-t3-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet3-t3-s` | 1,2,3,4／88,89,90,91 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t4-r` | 1,2,3,4,5,6,7,8,9,10／62,63,64,65,66,67,68,69,70,71 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t4-w` | 11,12／72,73 | B1 Preliminary for Schools（真题，无难度级） | — | 45 分钟（官方考试时长） | 否 | 0 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `pet3-t4-l` | 13,14,15,16,17,18／74,75,76,77,78,79 | B1 Preliminary for Schools（真题，无难度级） | — | 36 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/pet3/pet3-t4-p1.m4a`<br>`assets/pet3/pet3-t4-p2.m4a`<br>`assets/pet3/pet3-t4-p3.m4a`<br>`assets/pet3/pet3-t4-p4.m4a` | 平台占位（RC 以标题生成文字卡） |
| `pet3-t4-s` | 1,2,3,4／92,93,94,95 | B1 Preliminary for Schools（真题，无难度级） | — | 14 分钟（官方考试时长） | 否 | 2 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `pet3-t1-r` | `content/playlists/pet3/keys/pet3-t1-r.json` | e690c41ffedb | official | PET3 - Test 1 参考答案&音频文稿.pdf p.1 | pending | transcribed v1.0.0 |
| `pet3-t1-w` | `content/playlists/pet3/keys/pet3-t1-w.json` | 9cb1131d39e1 | official | PET3 - Test 1 参考答案&音频文稿.pdf p.2,3,4,5,6,7 | pending | transcribed v1.0.0 |
| `pet3-t1-l` | `content/playlists/pet3/keys/pet3-t1-l.json` | 83ed4ab55d6c | official | PET3 - Test 1 参考答案&音频文稿.pdf p.8,9,10,11,12 | pending | transcribed v1.0.0 |
| `pet3-t1-s` | `content/playlists/pet3/keys/pet3-t1-s.json` | 14cc8efa6bee | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet3-t2-r` | `content/playlists/pet3/keys/pet3-t2-r.json` | b2d9d703070b | official | PET3 - Test 2 参考答案&音频文稿.pdf p.1 | pending | transcribed v1.0.0 |
| `pet3-t2-w` | `content/playlists/pet3/keys/pet3-t2-w.json` | c59c7835c45c | official | PET3 - Test 2 参考答案&音频文稿.pdf p.2,3,4,5,6,7 | pending | transcribed v1.0.0 |
| `pet3-t2-l` | `content/playlists/pet3/keys/pet3-t2-l.json` | 653fbd365016 | official | PET3 - Test 2 参考答案&音频文稿.pdf p.8,9,10,11,12 | pending | transcribed v1.0.0 |
| `pet3-t2-s` | `content/playlists/pet3/keys/pet3-t2-s.json` | d7feed9796cf | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet3-t3-r` | `content/playlists/pet3/keys/pet3-t3-r.json` | cec8d1246a02 | official | PET3 - Test 3 参考答案&音频文稿.pdf p.1 | pending | transcribed v1.0.0 |
| `pet3-t3-w` | `content/playlists/pet3/keys/pet3-t3-w.json` | edca5c2292ea | official | PET3 - Test 3 参考答案&音频文稿.pdf p.2,3,4,5,6,7 | pending | transcribed v1.0.0 |
| `pet3-t3-l` | `content/playlists/pet3/keys/pet3-t3-l.json` | 0e36459bde60 | official | PET3 - Test 3 参考答案&音频文稿.pdf p.8,9,10,11,12 | pending | transcribed v1.0.0 |
| `pet3-t3-s` | `content/playlists/pet3/keys/pet3-t3-s.json` | b85c9fff20c0 | generated | —（生成） | pending | transcribed v1.0.0 |
| `pet3-t4-r` | `content/playlists/pet3/keys/pet3-t4-r.json` | 7506997ca14e | official | PET3 - Test 4 参考答案&音频文稿.pdf p.1 | pending | transcribed v1.0.0 |
| `pet3-t4-w` | `content/playlists/pet3/keys/pet3-t4-w.json` | 2a0081d115d3 | official | PET3 - Test 4 参考答案&音频文稿.pdf p.2,3,4,5,6,7 | pending | transcribed v1.0.0 |
| `pet3-t4-l` | `content/playlists/pet3/keys/pet3-t4-l.json` | 26729e7cb543 | official | PET3 - Test 4 参考答案&音频文稿.pdf p.8,9,10,11,12 | pending | transcribed v1.0.0 |
| `pet3-t4-s` | `content/playlists/pet3/keys/pet3-t4-s.json` | 5b162ebb948a | generated | —（生成） | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 136 | 可适配（single-selection） |
| 共享词／句库（gapMatch） | 20 | 可适配（slot-selection） |
| 完形（每空单选）（inlineChoice） | 24 | 可适配（single-selection，按空；需逐题核对） |
| 文本填空（textEntry） | 48 | 待平台适配 |
| 开放问答（extendedText） | 12 | 待平台适配（含 LLM 评分） |
| 口语录音（AI 评分）（speaking） | 16 | undefined |

