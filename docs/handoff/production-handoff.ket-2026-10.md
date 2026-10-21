# 本次生产交接 · KET 校园版真题 2–3（ket-2026-10）

> 配套规约：[`14-agent-production-rules.md`](../14-agent-production-rules.md) v0.6；模板：[`14-production-handoff.template.md`](../14-production-handoff.template.md)；制作规范：[`production-brief-ket.md`](../production-brief-ket.md)。本文只引用私有答案的位置，不粘贴答案。

## 本次交付范围

- **任务**：剑桥 A2 Key for Schools（KET 青少版）官方真题第 2、3 本的全量生产，合集 `ket2`、`ket3`（第 1 本 `ket1` 此前已交付）。
- **规约与依据**：Schema `schema/index.ts`（`SCHEMA_VERSION` 1.0，无新增字段）；`docs/production-brief-ket.md`（三本书通用，第 3 本另有输入说明）。
- **交付类型**：书籍目录（全书）。

  | 合集 | 书 | 原书 | 本次交付 | 说明 |
  | --- | --- | --- | --- | --- |
  | ket2 | KET 校园版真题 2（外研社，2023） | 4 套 × 3 卷 | **12 篇** | 录音齐全 |
  | ket3 | A2 Key for Schools 3（Cambridge，2025） | 4 套 × 3 卷 | **12 篇** | 原书无中文解析，解析为生成内容 |
- **Item id**：`<pl>-t<N>-{rw,l,s}`（阅读与写作 / 听力 / 口语），永久；小题 `q<印刷题号>`。
- **标题**：`KET真题<B>-第<N>套-阅读与写作/听力/口语`。语言 `en`，界面中文。难度 Cambridge A2（gradeBand `A2`）。时长：阅读与写作 60′、听力 35′、口语 10′。

## 本次更新与稳定题目ID

- 本次类型：ket2 / ket3 首次生产。
- **同批对已交付内容的展示调整（ID 不变、文字不变）**：
  - 阅读印成邮件样式的材料统一用邮件版式（`note.style: "email"`，From / To 抬头栏，#96 的规则扩展到阅读）：ket1 第 1–3 套 Part 5 共 4 处。
  - 写作参考答案改为书中**得分最高**的范文（原规则为固定取 Sample A，部分题目 A 分数较低）：pet2 11 题、ket2 / ket3 6 题；anchors 按分数从高到低排列。

## 封面、音频与依赖

| 使用位置 | 路径 | 来源 | 交付 |
| --- | --- | --- | --- |
| 合集封面 / 横幅 | `assets/<pl>/cover.jpg`、`banner.jpg` | `scripts/make-cover.mjs` 统一模板生成（#76） | 是 |
| 题目图片 | `assets/<pl>/<pl>-t<N>-*.jpg` | 从原书页面裁切，逐张人工目检 | 是 |
| 听力录音 | `assets/<pl>/<pl>-t<N>-p<K>.m4a`（48 kbps 单声道） | 原书音频转码；不进 git，随 `rc-media-<pl>.zip` 交付 | 40 / 40 段 |
| 口语考官 / AI 搭档语音 | `assets/<pl>/<itemId>-<qid>-<turnId>.mp3` | 火山引擎 TTS（考官 Amanda、搭档 Adam）；共 168 句 | 是 |

## 来源、版权和私有答案

- 页面图 / OCR：`.work/pages/<pl>/…`、`.work/text/<pl>/…`（本地）。各 item `source` 记录 PDF 名与页码。
- 分套 PDF 的缺漏（已用整本 PDF 补齐）：ket2 第 4 套「参考答案」缺书 p.151（听力 Q23–25 解析）；ket3 第 2 套「口语参考」误放第 1 套阅读页（考官脚本取自整本 PDF 书 pp.75–77）。
- 私有 Key：`content/playlists/<pl>/keys/`，构建时移除（泄漏检查通过）。
- **答案来源**：读写、听力答案 `official`；写作 anchors 取自书中范文与印刷分数；口语参考与 AI 搭档台词 `generated`。
- **中文解析来源**：ket2 依据答案册改写；**ket3 原书无中文解析，全部为制作方撰写，key 标 `explanationSource: "generated"`**。
- **审核状态**：全部 key `reviewStatus: pending`。原书 / 答案册疑似错误见 errata issue #104。

## 每类交互与验证（2026-10-22）

- 题型与 ket1 一致（告示单选、Part 2 网格 + 人物照片、长文单选、选择型完形、开放式完形（邮件版式）、邮件写作、看图写故事；听力图片选项 / 笔记填空 / 长对话一页 / 配对板（例题）；口语问答 / AI 搭档讨论）。
- `npm run validate`：624 篇 0 错误（无新增 warning）。
- `npx tsx scripts/check-exam.ts`：KET / PET 全部 24 套逐题与答案册比对，0 不一致；OCR 漏读的 3 个答案（ket1 第 4 套 Q6、ket2 第 1 套 Q1、ket3 第 3 套 Q4）已对照答案册页面图人工确认。
- `.work/pet-audit.py`：KET 1–3、PET 1–3 共 24 套全部 clean。TTS：168 句全部有音频。
- `npm test` 60、`npm run e2e` 196（三个视口）、`npm run build`（含泄漏检查）全部通过；本地页面目检合集页、读写 Part 1/2/5/7、听力 Part 5、口语 Part 2。

## 附：自动生成的清单（`npx tsx scripts/handoff-inventory.ts ket2 ket3`）

### ket2 · KET 校园版真题 2｜A2 Key for Schools 官方真题（新题型）

- 合集封面：`assets/ket2/cover.jpg`（书籍封面扫描，sha256:287089d786ee）；gradeBand：A2（学校年级，不等于 UniRead L 等级）；本次交付 12 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ket2-t1-rw-s1` | KET真题2-第1套-阅读与写作 · Part 1. 阅读选择 | `ket2-t1-rw` | `s1` | `ket2-t1-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 2 | `ket2-t1-rw-s2` | KET真题2-第1套-阅读与写作 · Part 2. 阅读选择 | `ket2-t1-rw` | `s2` | `ket2-t1-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 3 | `ket2-t1-rw-s3` | KET真题2-第1套-阅读与写作 · Part 3. 阅读选择 | `ket2-t1-rw` | `s3` | `ket2-t1-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 4 | `ket2-t1-rw-s4` | KET真题2-第1套-阅读与写作 · Part 4. 完形填空 | `ket2-t1-rw` | `s4` | `ket2-t1-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 5 | `ket2-t1-rw-s5` | KET真题2-第1套-阅读与写作 · Part 5. 填空 | `ket2-t1-rw` | `s5` | `ket2-t1-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 6 | `ket2-t1-rw-s6` | KET真题2-第1套-阅读与写作 · Part 6. 回答问题 | `ket2-t1-rw` | `s6` | `ket2-t1-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 7 | `ket2-t1-rw-s7` | KET真题2-第1套-阅读与写作 · Part 7. 回答问题 | `ket2-t1-rw` | `s7` | `ket2-t1-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 8 | `ket2-t1-l-s1` | KET真题2-第1套-听力 · Part 1. 阅读选择 | `ket2-t1-l` | `s1` | `ket2-t1-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 9 | `ket2-t1-l-s2` | KET真题2-第1套-听力 · Part 2. 填空 | `ket2-t1-l` | `s2` | `ket2-t1-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 10 | `ket2-t1-l-s3` | KET真题2-第1套-听力 · Part 3. 阅读选择 | `ket2-t1-l` | `s3` | `ket2-t1-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 11 | `ket2-t1-l-s4` | KET真题2-第1套-听力 · Part 4. 阅读选择 | `ket2-t1-l` | `s4` | `ket2-t1-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 12 | `ket2-t1-l-s5` | KET真题2-第1套-听力 · Part 5. 阅读选择 | `ket2-t1-l` | `s5` | `ket2-t1-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 13 | `ket2-t1-s-s1` | KET真题2-第1套-口语 · Part 1.  | `ket2-t1-s` | `s1` | `ket2-t1-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 14 | `ket2-t1-s-s2` | KET真题2-第1套-口语 · Part 2.  | `ket2-t1-s` | `s2` | `ket2-t1-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |
| 15 | `ket2-t2-rw-s1` | KET真题2-第2套-阅读与写作 · Part 1. 阅读选择 | `ket2-t2-rw` | `s1` | `ket2-t2-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 16 | `ket2-t2-rw-s2` | KET真题2-第2套-阅读与写作 · Part 2. 阅读选择 | `ket2-t2-rw` | `s2` | `ket2-t2-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 17 | `ket2-t2-rw-s3` | KET真题2-第2套-阅读与写作 · Part 3. 阅读选择 | `ket2-t2-rw` | `s3` | `ket2-t2-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 18 | `ket2-t2-rw-s4` | KET真题2-第2套-阅读与写作 · Part 4. 完形填空 | `ket2-t2-rw` | `s4` | `ket2-t2-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 19 | `ket2-t2-rw-s5` | KET真题2-第2套-阅读与写作 · Part 5. 填空 | `ket2-t2-rw` | `s5` | `ket2-t2-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 20 | `ket2-t2-rw-s6` | KET真题2-第2套-阅读与写作 · Part 6. 回答问题 | `ket2-t2-rw` | `s6` | `ket2-t2-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 21 | `ket2-t2-rw-s7` | KET真题2-第2套-阅读与写作 · Part 7. 回答问题 | `ket2-t2-rw` | `s7` | `ket2-t2-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 22 | `ket2-t2-l-s1` | KET真题2-第2套-听力 · Part 1. 阅读选择 | `ket2-t2-l` | `s1` | `ket2-t2-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 23 | `ket2-t2-l-s2` | KET真题2-第2套-听力 · Part 2. 填空 | `ket2-t2-l` | `s2` | `ket2-t2-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 24 | `ket2-t2-l-s3` | KET真题2-第2套-听力 · Part 3. 阅读选择 | `ket2-t2-l` | `s3` | `ket2-t2-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 25 | `ket2-t2-l-s4` | KET真题2-第2套-听力 · Part 4. 阅读选择 | `ket2-t2-l` | `s4` | `ket2-t2-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 26 | `ket2-t2-l-s5` | KET真题2-第2套-听力 · Part 5. 阅读选择 | `ket2-t2-l` | `s5` | `ket2-t2-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 27 | `ket2-t2-s-s1` | KET真题2-第2套-口语 · Part 1.  | `ket2-t2-s` | `s1` | `ket2-t2-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 28 | `ket2-t2-s-s2` | KET真题2-第2套-口语 · Part 2.  | `ket2-t2-s` | `s2` | `ket2-t2-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |
| 29 | `ket2-t3-rw-s1` | KET真题2-第3套-阅读与写作 · Part 1. 阅读选择 | `ket2-t3-rw` | `s1` | `ket2-t3-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 30 | `ket2-t3-rw-s2` | KET真题2-第3套-阅读与写作 · Part 2. 阅读选择 | `ket2-t3-rw` | `s2` | `ket2-t3-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 31 | `ket2-t3-rw-s3` | KET真题2-第3套-阅读与写作 · Part 3. 阅读选择 | `ket2-t3-rw` | `s3` | `ket2-t3-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 32 | `ket2-t3-rw-s4` | KET真题2-第3套-阅读与写作 · Part 4. 完形填空 | `ket2-t3-rw` | `s4` | `ket2-t3-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 33 | `ket2-t3-rw-s5` | KET真题2-第3套-阅读与写作 · Part 5. 填空 | `ket2-t3-rw` | `s5` | `ket2-t3-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 34 | `ket2-t3-rw-s6` | KET真题2-第3套-阅读与写作 · Part 6. 回答问题 | `ket2-t3-rw` | `s6` | `ket2-t3-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 35 | `ket2-t3-rw-s7` | KET真题2-第3套-阅读与写作 · Part 7. 回答问题 | `ket2-t3-rw` | `s7` | `ket2-t3-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 36 | `ket2-t3-l-s1` | KET真题2-第3套-听力 · Part 1. 阅读选择 | `ket2-t3-l` | `s1` | `ket2-t3-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 37 | `ket2-t3-l-s2` | KET真题2-第3套-听力 · Part 2. 填空 | `ket2-t3-l` | `s2` | `ket2-t3-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 38 | `ket2-t3-l-s3` | KET真题2-第3套-听力 · Part 3. 阅读选择 | `ket2-t3-l` | `s3` | `ket2-t3-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 39 | `ket2-t3-l-s4` | KET真题2-第3套-听力 · Part 4. 阅读选择 | `ket2-t3-l` | `s4` | `ket2-t3-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 40 | `ket2-t3-l-s5` | KET真题2-第3套-听力 · Part 5. 阅读选择 | `ket2-t3-l` | `s5` | `ket2-t3-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 41 | `ket2-t3-s-s1` | KET真题2-第3套-口语 · Part 1.  | `ket2-t3-s` | `s1` | `ket2-t3-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 42 | `ket2-t3-s-s2` | KET真题2-第3套-口语 · Part 2.  | `ket2-t3-s` | `s2` | `ket2-t3-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |
| 43 | `ket2-t4-rw-s1` | KET真题2-第4套-阅读与写作 · Part 1. 阅读选择 | `ket2-t4-rw` | `s1` | `ket2-t4-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 44 | `ket2-t4-rw-s2` | KET真题2-第4套-阅读与写作 · Part 2. 阅读选择 | `ket2-t4-rw` | `s2` | `ket2-t4-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 45 | `ket2-t4-rw-s3` | KET真题2-第4套-阅读与写作 · Part 3. 阅读选择 | `ket2-t4-rw` | `s3` | `ket2-t4-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 46 | `ket2-t4-rw-s4` | KET真题2-第4套-阅读与写作 · Part 4. 完形填空 | `ket2-t4-rw` | `s4` | `ket2-t4-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 47 | `ket2-t4-rw-s5` | KET真题2-第4套-阅读与写作 · Part 5. 填空 | `ket2-t4-rw` | `s5` | `ket2-t4-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 48 | `ket2-t4-rw-s6` | KET真题2-第4套-阅读与写作 · Part 6. 回答问题 | `ket2-t4-rw` | `s6` | `ket2-t4-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 49 | `ket2-t4-rw-s7` | KET真题2-第4套-阅读与写作 · Part 7. 回答问题 | `ket2-t4-rw` | `s7` | `ket2-t4-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 50 | `ket2-t4-l-s1` | KET真题2-第4套-听力 · Part 1. 阅读选择 | `ket2-t4-l` | `s1` | `ket2-t4-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 51 | `ket2-t4-l-s2` | KET真题2-第4套-听力 · Part 2. 填空 | `ket2-t4-l` | `s2` | `ket2-t4-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 52 | `ket2-t4-l-s3` | KET真题2-第4套-听力 · Part 3. 阅读选择 | `ket2-t4-l` | `s3` | `ket2-t4-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 53 | `ket2-t4-l-s4` | KET真题2-第4套-听力 · Part 4. 阅读选择 | `ket2-t4-l` | `s4` | `ket2-t4-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 54 | `ket2-t4-l-s5` | KET真题2-第4套-听力 · Part 5. 阅读选择 | `ket2-t4-l` | `s5` | `ket2-t4-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 55 | `ket2-t4-s-s1` | KET真题2-第4套-口语 · Part 1.  | `ket2-t4-s` | `s1` | `ket2-t4-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 56 | `ket2-t4-s-s2` | KET真题2-第4套-口语 · Part 2.  | `ket2-t4-s` | `s2` | `ket2-t4-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ket2-t1-rw` | 1,2,3,4,5,6,7,8,9,10／8,9,10,11,12,13,14,15,16,17 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 12 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t1-l` | 1,2,3,4,5,6／18,19,20,21,22,23 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket2/ket2-t1-p1.m4a`<br>`assets/ket2/ket2-t1-p2.m4a`<br>`assets/ket2/ket2-t1-p3.m4a`<br>`assets/ket2/ket2-t1-p4.m4a`<br>`assets/ket2/ket2-t1-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket2-t1-s` | 1,2,3,4／125,72,73,74 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t2-rw` | 1,2,3,4,5,6,7,8,9,10／24,25,26,27,28,29,30,31,32,33 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t2-l` | 1,2,3,4,5,6／34,35,36,37,38,39 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket2/ket2-t2-p1.m4a`<br>`assets/ket2/ket2-t2-p2.m4a`<br>`assets/ket2/ket2-t2-p3.m4a`<br>`assets/ket2/ket2-t2-p4.m4a`<br>`assets/ket2/ket2-t2-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket2-t2-s` | 1,2,3,4／126,75,76,77 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t3-rw` | 1,2,3,4,5,6,7,8,9,10／40,41,42,43,44,45,46,47,48,49 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 10 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t3-l` | 1,2,3,4,5,6／50,51,52,53,54,55 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket2/ket2-t3-p1.m4a`<br>`assets/ket2/ket2-t3-p2.m4a`<br>`assets/ket2/ket2-t3-p3.m4a`<br>`assets/ket2/ket2-t3-p4.m4a`<br>`assets/ket2/ket2-t3-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket2-t3-s` | 1,2,3,4／127,78,79,80 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t4-rw` | 1,2,3,4,5,6,7,8,9,10／56,57,58,59,60,61,62,63,64,65 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 12 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket2-t4-l` | 1,2,3,4,5,6／66,67,68,69,70,71 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket2/ket2-t4-p1.m4a`<br>`assets/ket2/ket2-t4-p2.m4a`<br>`assets/ket2/ket2-t4-p3.m4a`<br>`assets/ket2/ket2-t4-p4.m4a`<br>`assets/ket2/ket2-t4-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket2-t4-s` | 1,2,3,4／128,81,82,83 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ket2-t1-rw` | `content/playlists/ket2/keys/ket2-t1-rw.json` | f37d56e9bcf1 | official | 02 KET真题 - 第1套 - 参考答案.pdf p.1,2,3,10,11,12,13 | pending | transcribed v1.0.0 |
| `ket2-t1-l` | `content/playlists/ket2/keys/ket2-t1-l.json` | 80acaf0188c4 | official | 02 KET真题 - 第1套 - 参考答案.pdf p.4,5,6,7,8,9,13,14,15,16,17 | pending | transcribed v1.0.0 |
| `ket2-t1-s` | `content/playlists/ket2/keys/ket2-t1-s.json` | d88f6e332e6d | generated | —（生成） | pending | transcribed v1.0.0 |
| `ket2-t2-rw` | `content/playlists/ket2/keys/ket2-t2-rw.json` | a339a562863b | official | 02 KET真题 - 第2套 - 参考答案.pdf p.1,2,3,10,11,12,13 | pending | transcribed v1.0.0 |
| `ket2-t2-l` | `content/playlists/ket2/keys/ket2-t2-l.json` | 0b4a45028a15 | official | 02 KET真题 - 第2套 - 参考答案.pdf p.4,5,6,7,8,9,13,14,15,16,17 | pending | transcribed v1.0.0 |
| `ket2-t2-s` | `content/playlists/ket2/keys/ket2-t2-s.json` | 0acab8cb0840 | generated | —（生成） | pending | transcribed v1.0.0 |
| `ket2-t3-rw` | `content/playlists/ket2/keys/ket2-t3-rw.json` | 9d5267a5e12a | official | 02 KET真题 - 第3套 - 参考答案.pdf p.1,2,3,10,11,12,13 | pending | transcribed v1.0.0 |
| `ket2-t3-l` | `content/playlists/ket2/keys/ket2-t3-l.json` | 859e801bb02b | official | 02 KET真题 - 第3套 - 参考答案.pdf p.4,5,6,7,8,9,13,14,15,16,17 | pending | transcribed v1.0.0 |
| `ket2-t3-s` | `content/playlists/ket2/keys/ket2-t3-s.json` | 5e80ea803754 | generated | —（生成） | pending | transcribed v1.0.0 |
| `ket2-t4-rw` | `content/playlists/ket2/keys/ket2-t4-rw.json` | ce9cc9d79eef | official | 02 KET真题 - 第4套 - 参考答案.pdf p.1,2,3,10,11,12 | pending | transcribed v1.0.0 |
| `ket2-t4-l` | `content/playlists/ket2/keys/ket2-t4-l.json` | ca25e93fb3c4 | official | 02 KET真题 - 第4套 - 参考答案.pdf p.4,5,6,7,8,9,13,14,15,16 | pending | transcribed v1.0.0 |
| `ket2-t4-s` | `content/playlists/ket2/keys/ket2-t4-s.json` | b2ad2b6fdb9c | generated | —（生成） | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 152 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 24 | 可适配（single-selection，按空；需逐题核对） |
| 文本填空（textEntry） | 44 | 待平台适配 |
| 开放问答（extendedText） | 8 | 待平台适配（含 LLM 评分） |
| 口语录音（AI 评分）（speaking） | 8 | undefined |

### ket3 · KET 校园版真题 3｜A2 Key for Schools 官方真题（新题型）

- 合集封面：`assets/ket3/cover.jpg`（书籍封面扫描，sha256:81a1ea4dbf05）；gradeBand：A2（学校年级，不等于 UniRead L 等级）；本次交付 12 篇

#### 大题与共享材料映射

| 顺序 | resourceId | 独立大题标题 | Item | Section | materialId（复用） | 小题 ID／数量 | 分值 | 题型 | 共享 bank 作用域 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ket3-t1-rw-s1` | KET真题3-第1套-阅读与写作 · Part 1. 阅读选择 | `ket3-t1-rw` | `s1` | `ket3-t1-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 2 | `ket3-t1-rw-s2` | KET真题3-第1套-阅读与写作 · Part 2. 阅读选择 | `ket3-t1-rw` | `s2` | `ket3-t1-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 3 | `ket3-t1-rw-s3` | KET真题3-第1套-阅读与写作 · Part 3. 阅读选择 | `ket3-t1-rw` | `s3` | `ket3-t1-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 4 | `ket3-t1-rw-s4` | KET真题3-第1套-阅读与写作 · Part 4. 完形填空 | `ket3-t1-rw` | `s4` | `ket3-t1-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 5 | `ket3-t1-rw-s5` | KET真题3-第1套-阅读与写作 · Part 5. 填空 | `ket3-t1-rw` | `s5` | `ket3-t1-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 6 | `ket3-t1-rw-s6` | KET真题3-第1套-阅读与写作 · Part 6. 回答问题 | `ket3-t1-rw` | `s6` | `ket3-t1-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 7 | `ket3-t1-rw-s7` | KET真题3-第1套-阅读与写作 · Part 7. 回答问题 | `ket3-t1-rw` | `s7` | `ket3-t1-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 8 | `ket3-t1-l-s1` | KET真题3-第1套-听力 · Part 1. 阅读选择 | `ket3-t1-l` | `s1` | `ket3-t1-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 9 | `ket3-t1-l-s2` | KET真题3-第1套-听力 · Part 2. 填空 | `ket3-t1-l` | `s2` | `ket3-t1-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 10 | `ket3-t1-l-s3` | KET真题3-第1套-听力 · Part 3. 阅读选择 | `ket3-t1-l` | `s3` | `ket3-t1-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 11 | `ket3-t1-l-s4` | KET真题3-第1套-听力 · Part 4. 阅读选择 | `ket3-t1-l` | `s4` | `ket3-t1-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 12 | `ket3-t1-l-s5` | KET真题3-第1套-听力 · Part 5. 阅读选择 | `ket3-t1-l` | `s5` | `ket3-t1-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 13 | `ket3-t1-s-s1` | KET真题3-第1套-口语 · Part 1.  | `ket3-t1-s` | `s1` | `ket3-t1-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 14 | `ket3-t1-s-s2` | KET真题3-第1套-口语 · Part 2.  | `ket3-t1-s` | `s2` | `ket3-t1-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |
| 15 | `ket3-t2-rw-s1` | KET真题3-第2套-阅读与写作 · Part 1. 阅读选择 | `ket3-t2-rw` | `s1` | `ket3-t2-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 16 | `ket3-t2-rw-s2` | KET真题3-第2套-阅读与写作 · Part 2. 阅读选择 | `ket3-t2-rw` | `s2` | `ket3-t2-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 17 | `ket3-t2-rw-s3` | KET真题3-第2套-阅读与写作 · Part 3. 阅读选择 | `ket3-t2-rw` | `s3` | `ket3-t2-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 18 | `ket3-t2-rw-s4` | KET真题3-第2套-阅读与写作 · Part 4. 完形填空 | `ket3-t2-rw` | `s4` | `ket3-t2-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 19 | `ket3-t2-rw-s5` | KET真题3-第2套-阅读与写作 · Part 5. 填空 | `ket3-t2-rw` | `s5` | `ket3-t2-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 20 | `ket3-t2-rw-s6` | KET真题3-第2套-阅读与写作 · Part 6. 回答问题 | `ket3-t2-rw` | `s6` | `ket3-t2-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 21 | `ket3-t2-rw-s7` | KET真题3-第2套-阅读与写作 · Part 7. 回答问题 | `ket3-t2-rw` | `s7` | `ket3-t2-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 22 | `ket3-t2-l-s1` | KET真题3-第2套-听力 · Part 1. 阅读选择 | `ket3-t2-l` | `s1` | `ket3-t2-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 23 | `ket3-t2-l-s2` | KET真题3-第2套-听力 · Part 2. 填空 | `ket3-t2-l` | `s2` | `ket3-t2-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 24 | `ket3-t2-l-s3` | KET真题3-第2套-听力 · Part 3. 阅读选择 | `ket3-t2-l` | `s3` | `ket3-t2-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 25 | `ket3-t2-l-s4` | KET真题3-第2套-听力 · Part 4. 阅读选择 | `ket3-t2-l` | `s4` | `ket3-t2-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 26 | `ket3-t2-l-s5` | KET真题3-第2套-听力 · Part 5. 阅读选择 | `ket3-t2-l` | `s5` | `ket3-t2-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 27 | `ket3-t2-s-s1` | KET真题3-第2套-口语 · Part 1.  | `ket3-t2-s` | `s1` | `ket3-t2-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 28 | `ket3-t2-s-s2` | KET真题3-第2套-口语 · Part 2.  | `ket3-t2-s` | `s2` | `ket3-t2-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |
| 29 | `ket3-t3-rw-s1` | KET真题3-第3套-阅读与写作 · Part 1. 阅读选择 | `ket3-t3-rw` | `s1` | `ket3-t3-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 30 | `ket3-t3-rw-s2` | KET真题3-第3套-阅读与写作 · Part 2. 阅读选择 | `ket3-t3-rw` | `s2` | `ket3-t3-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 31 | `ket3-t3-rw-s3` | KET真题3-第3套-阅读与写作 · Part 3. 阅读选择 | `ket3-t3-rw` | `s3` | `ket3-t3-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 32 | `ket3-t3-rw-s4` | KET真题3-第3套-阅读与写作 · Part 4. 完形填空 | `ket3-t3-rw` | `s4` | `ket3-t3-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 33 | `ket3-t3-rw-s5` | KET真题3-第3套-阅读与写作 · Part 5. 填空 | `ket3-t3-rw` | `s5` | `ket3-t3-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 34 | `ket3-t3-rw-s6` | KET真题3-第3套-阅读与写作 · Part 6. 回答问题 | `ket3-t3-rw` | `s6` | `ket3-t3-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 35 | `ket3-t3-rw-s7` | KET真题3-第3套-阅读与写作 · Part 7. 回答问题 | `ket3-t3-rw` | `s7` | `ket3-t3-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 36 | `ket3-t3-l-s1` | KET真题3-第3套-听力 · Part 1. 阅读选择 | `ket3-t3-l` | `s1` | `ket3-t3-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 37 | `ket3-t3-l-s2` | KET真题3-第3套-听力 · Part 2. 填空 | `ket3-t3-l` | `s2` | `ket3-t3-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 38 | `ket3-t3-l-s3` | KET真题3-第3套-听力 · Part 3. 阅读选择 | `ket3-t3-l` | `s3` | `ket3-t3-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 39 | `ket3-t3-l-s4` | KET真题3-第3套-听力 · Part 4. 阅读选择 | `ket3-t3-l` | `s4` | `ket3-t3-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 40 | `ket3-t3-l-s5` | KET真题3-第3套-听力 · Part 5. 阅读选择 | `ket3-t3-l` | `s5` | `ket3-t3-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 41 | `ket3-t3-s-s1` | KET真题3-第3套-口语 · Part 1.  | `ket3-t3-s` | `s1` | `ket3-t3-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 42 | `ket3-t3-s-s2` | KET真题3-第3套-口语 · Part 2.  | `ket3-t3-s` | `s2` | `ket3-t3-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |
| 43 | `ket3-t4-rw-s1` | KET真题3-第4套-阅读与写作 · Part 1. 阅读选择 | `ket3-t4-rw` | `s1` | `ket3-t4-rw-article`（7 个大题共用） | q1–q6／6 | 6 | 单选 | — |
| 44 | `ket3-t4-rw-s2` | KET真题3-第4套-阅读与写作 · Part 2. 阅读选择 | `ket3-t4-rw` | `s2` | `ket3-t4-rw-article`（7 个大题共用） | q7–q13／7 | 7 | 单选 | — |
| 45 | `ket3-t4-rw-s3` | KET真题3-第4套-阅读与写作 · Part 3. 阅读选择 | `ket3-t4-rw` | `s3` | `ket3-t4-rw-article`（7 个大题共用） | q14–q18／5 | 5 | 单选 | — |
| 46 | `ket3-t4-rw-s4` | KET真题3-第4套-阅读与写作 · Part 4. 完形填空 | `ket3-t4-rw` | `s4` | `ket3-t4-rw-article`（7 个大题共用） | q19–q24／6 | 6 | 完形（每空单选） | — |
| 47 | `ket3-t4-rw-s5` | KET真题3-第4套-阅读与写作 · Part 5. 填空 | `ket3-t4-rw` | `s5` | `ket3-t4-rw-article`（7 个大题共用） | q25–q30／6 | 6 | 文本填空 | — |
| 48 | `ket3-t4-rw-s6` | KET真题3-第4套-阅读与写作 · Part 6. 回答问题 | `ket3-t4-rw` | `s6` | `ket3-t4-rw-article`（7 个大题共用） | q31–q31／1 | 15 | 开放问答 | — |
| 49 | `ket3-t4-rw-s7` | KET真题3-第4套-阅读与写作 · Part 7. 回答问题 | `ket3-t4-rw` | `s7` | `ket3-t4-rw-article`（7 个大题共用） | q32–q32／1 | 15 | 开放问答 | — |
| 50 | `ket3-t4-l-s1` | KET真题3-第4套-听力 · Part 1. 阅读选择 | `ket3-t4-l` | `s1` | `ket3-t4-l-article`（5 个大题共用） | q1–q5／5 | 5 | 单选 | — |
| 51 | `ket3-t4-l-s2` | KET真题3-第4套-听力 · Part 2. 填空 | `ket3-t4-l` | `s2` | `ket3-t4-l-article`（5 个大题共用） | q6–q10／5 | 5 | 文本填空 | — |
| 52 | `ket3-t4-l-s3` | KET真题3-第4套-听力 · Part 3. 阅读选择 | `ket3-t4-l` | `s3` | `ket3-t4-l-article`（5 个大题共用） | q11–q15／5 | 5 | 单选 | — |
| 53 | `ket3-t4-l-s4` | KET真题3-第4套-听力 · Part 4. 阅读选择 | `ket3-t4-l` | `s4` | `ket3-t4-l-article`（5 个大题共用） | q16–q20／5 | 5 | 单选 | — |
| 54 | `ket3-t4-l-s5` | KET真题3-第4套-听力 · Part 5. 阅读选择 | `ket3-t4-l` | `s5` | `ket3-t4-l-article`（5 个大题共用） | q21–q25／5 | 5 | 单选 | — |
| 55 | `ket3-t4-s-s1` | KET真题3-第4套-口语 · Part 1.  | `ket3-t4-s` | `s1` | `ket3-t4-s-article`（2 个大题共用） | q1–q1／1 | 15 | 口语录音（AI 评分） | — |
| 56 | `ket3-t4-s-s2` | KET真题3-第4套-口语 · Part 2.  | `ket3-t4-s` | `s2` | `ket3-t4-s-article`（2 个大题共用） | q2–q2／1 | 15 | 口语录音（AI 评分） | — |

#### 元数据来源与资产

| Item | 原书页（PDF／书页） | 难度（原书“难度 N 级”） | 词数 | 建议用时 | hasVideo | 图片资产 | 缩略图策略 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ket3-t1-rw` | 1,2,3,4,5,6,7,8,9,10／8,9,10,11,12,13,14,15,16,17 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 12 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t1-l` | 1,2,3,4,5,6／18,19,20,21,22,23 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket3/ket3-t1-p1.m4a`<br>`assets/ket3/ket3-t1-p2.m4a`<br>`assets/ket3/ket3-t1-p3.m4a`<br>`assets/ket3/ket3-t1-p4.m4a`<br>`assets/ket3/ket3-t1-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket3-t1-s` | 1,2,3／72,73,74 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t2-rw` | 1,2,3,4,5,6,7,8,9,10／24,25,26,27,28,29,30,31,32,33 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 13 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t2-l` | 1,2,3,4,5,6／34,35,36,37,38,39 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket3/ket3-t2-p1.m4a`<br>`assets/ket3/ket3-t2-p2.m4a`<br>`assets/ket3/ket3-t2-p3.m4a`<br>`assets/ket3/ket3-t2-p4.m4a`<br>`assets/ket3/ket3-t2-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket3-t2-s` | 68,69,70／75,76,77 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t3-rw` | 2,3,4,5,6,7,8,9,10,11／40,41,42,43,44,45,46,47,48,49 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 13 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t3-l` | 1,2,3,4,5,6／50,51,52,53,54,55 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket3/ket3-t3-p1.m4a`<br>`assets/ket3/ket3-t3-p2.m4a`<br>`assets/ket3/ket3-t3-p3.m4a`<br>`assets/ket3/ket3-t3-p4.m4a`<br>`assets/ket3/ket3-t3-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket3-t3-s` | 1,2,3／78,79,80 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t4-rw` | 1,2,3,4,5,6,7,8,9,10／56,57,58,59,60,61,62,63,64,65 | A2 Key for Schools（真题，无难度级） | — | 60 分钟（官方考试时长） | 否 | 12 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |
| `ket3-t4-l` | 1,2,3,4,5,6／66,67,68,69,70,71 | A2 Key for Schools（真题，无难度级） | — | 35 分钟（官方考试时长） | 否 | 0 张图片；音频：`assets/ket3/ket3-t4-p1.m4a`<br>`assets/ket3/ket3-t4-p2.m4a`<br>`assets/ket3/ket3-t4-p3.m4a`<br>`assets/ket3/ket3-t4-p4.m4a`<br>`assets/ket3/ket3-t4-p5.m4a` | 平台占位（RC 以标题生成文字卡） |
| `ket3-t4-s` | 1,2,3／81,82,83 | A2 Key for Schools（真题，无难度级） | — | 10 分钟（官方考试时长） | 否 | 1 张图片；音频：无 | 平台占位（RC 以标题生成文字卡） |

#### 私有答案（只列位置与摘要，不含答案）

| Item | Key 文件 | sha256 | 答案来源 | 官方出处 | Key 复核状态 | 内容状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `ket3-t1-rw` | `content/playlists/ket3/keys/ket3-t1-rw.json` | d2d5061dcdf5 | official | 03 KET真题 - 第1套 - 参考答案&音频文稿.pdf p.1,2,3 | pending | transcribed v1.0.0 |
| `ket3-t1-l` | `content/playlists/ket3/keys/ket3-t1-l.json` | 49cf8242bf2c | official | 03 KET真题 - 第1套 - 参考答案&音频文稿.pdf p.4,5,6,7,8,9 | pending | transcribed v1.0.0 |
| `ket3-t1-s` | `content/playlists/ket3/keys/ket3-t1-s.json` | d892e424e6b7 | generated | —（生成） | pending | transcribed v1.0.0 |
| `ket3-t2-rw` | `content/playlists/ket3/keys/ket3-t2-rw.json` | 1244f16a5387 | official | 03 KET真题 - 第2套 - 参考答案&音频文稿.pdf p.2,3,4 | pending | transcribed v1.0.0 |
| `ket3-t2-l` | `content/playlists/ket3/keys/ket3-t2-l.json` | 6dbc275a0b0c | official | 03 KET真题 - 第2套 - 参考答案&音频文稿.pdf p.5,6,7,8,9,10 | pending | transcribed v1.0.0 |
| `ket3-t2-s` | `content/playlists/ket3/keys/ket3-t2-s.json` | a3ab1e41dc49 | generated | —（生成） | pending | transcribed v1.0.0 |
| `ket3-t3-rw` | `content/playlists/ket3/keys/ket3-t3-rw.json` | f16917f984c4 | official | 03 KET真题 - 第3套 - 参考答案&音频文稿.pdf p.1,2,3 | pending | transcribed v1.0.0 |
| `ket3-t3-l` | `content/playlists/ket3/keys/ket3-t3-l.json` | b800b4a47ae5 | official | 03 KET真题 - 第3套 - 参考答案&音频文稿.pdf p.4,5,6,7,8,9 | pending | transcribed v1.0.0 |
| `ket3-t3-s` | `content/playlists/ket3/keys/ket3-t3-s.json` | c84c03eb6e56 | generated | —（生成） | pending | transcribed v1.0.0 |
| `ket3-t4-rw` | `content/playlists/ket3/keys/ket3-t4-rw.json` | 90ecb863e037 | official | 03 KET真题 - 第4套 - 参考答案&音频文稿.pdf p.1,2,3 | pending | transcribed v1.0.0 |
| `ket3-t4-l` | `content/playlists/ket3/keys/ket3-t4-l.json` | 484c568619d0 | official | 03 KET真题 - 第4套 - 参考答案&音频文稿.pdf p.4,5,6,7,8,9 | pending | transcribed v1.0.0 |
| `ket3-t4-s` | `content/playlists/ket3/keys/ket3-t4-s.json` | d0c4f9f71642 | generated | —（生成） | pending | transcribed v1.0.0 |

#### 题型与平台适配

| 题型 | 小题数 | 平台状态 |
| --- | --- | --- |
| 单选（choice） | 152 | 可适配（single-selection） |
| 完形（每空单选）（inlineChoice） | 24 | 可适配（single-selection，按空；需逐题核对） |
| 文本填空（textEntry） | 44 | 待平台适配 |
| 开放问答（extendedText） | 8 | 待平台适配（含 LLM 评分） |
| 口语录音（AI 评分）（speaking） | 8 | undefined |

