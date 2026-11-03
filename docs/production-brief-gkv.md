# Production brief — 高考考纲词汇天天练 (`gkv`) · token-lean

Same type as 中考考纲词汇 (`zkv`, GitHub #110): read [production-brief-zkv.md](production-brief-zkv.md) first — everything there applies unless this brief says otherwise. Design: [docs/16-vocab-day-format.md](16-vocab-day-format.md) (incl. §9 review changes). Schema: `LexiconEntry`, `Lexicon`, `VocabDayItem`, `AnswerKey` in `schema/index.ts`.

**Delivered content (`ci-*`, ket*, pet*, zkv) is frozen — never touch it.**

## Inputs (prepared — do not re-render or re-OCR)
- Handbook 《2027年上海市高考英语词汇用法手册》 (`2027上海市高考英语英语词汇手册.pdf`, 528 PDF pages): `.work/pages/gkv/handbook/p###.jpg`, OCR `.work/text/gkv/handbook/` (English) and `handbook-zh/` (Chinese-first). **Printed page N = PDF page N+7.** Part 1 = words (book p.1–475), Part 2 = phrases (p.476–510). OCR covers every page of all three books (2026-11-02).
- Exercise book 《…配套综合练习》 (`2027年上海市高考英语词汇练习.pdf`, 313 pages): `.work/pages/gkv/practice/`, OCR `.work/text/gkv/practice(-zh)/` (PDF p.7–13). **Printed page N = PDF page N+6.** 125 days.
- Answer book (`2027年上海市高考英语词汇练习答案.pdf`, 126 pages): `.work/pages/gkv/answers/`, OCR `.work/text/gkv/answers(-zh)/` (PDF p.1–5). Day 1 is on PDF p.2, Day 2 on p.3.
- The Chinese OCR garbles characters (单词默马 = 单词默写, a-acne = a – ache): **always confirm Chinese against the page image.** IPA from the image too.

## Lexicon entries — `content/lexicons/gkv/entries/<id>.json`, `lexicon: "gkv"`
As zkv, with these handbook features:
- Marks: `*` before the headword → `star`; small `▲` before it → `supplement`; the circled 初 after it → `levelMark`. No textbook tags. (Their meanings are already in `content/lexicons/gkv/lexicon.json` — do not edit it.)
- `id` from the headword as zkv: `a (an)` → `e-a-an`, `according to` → `e-according-to`. Entries in Part 1 are `kind: "word"` even when the headword has spaces (`according to` is word no. 27); `number` = printed number.
- Senses: one per printed part of speech, including continuation lines (`vt. …` / `vi. …` under the first line).
- ◆ examples → `examples` (headword underlined where the book underlines it); keep a district source like 「（黄浦）」 at the end of `zh` as printed.
- 派生 → `wordFamily` (`{word, pos, zh}`; a `(反义 presence)` inside 派生 goes to `antonyms` as `"presence"`); 反义 → `antonyms` (as printed, e.g. `"normal adj. 正常的"`); 词组 → `phrases`; 谚语 → `proverbs`.
- **辨析** → `compare: [{ "words": "able, capable", "blocks": [ paragraph blocks ] }]`: each explanation paragraph is one `paragraph` block (Inline; bold words as `strong`), each ◆ example is a paragraph with the English (underline as printed) and then its Chinese in the same paragraph after a space. Block ids `c1`, `c2`… unique within the entry.
- `source.pdf`: `"2027上海市高考英语英语词汇手册.pdf"`.

## Sample = 第一天 + 第二天
| Item | Day | Range | Entries | Exercise pages (PDF) | Answers (PDF) |
| --- | --- | --- | --- | --- | --- |
| `gkv-d001` | 1 | a – ache | handbook no. 1–34 | p.7–9 | p.2 |
| `gkv-d002` | 2 | achieve – advanced | handbook no. 35–68 | p.9–11 | p.3 |

**Item ids have three digits** (`gkv-d001`, 125 days). `unit: "words"`, `title`/`displayName` `a – ache` (the word range only — 第N天 / Day N is added by the UI in the reader's language, docs/uniread-spec/i18n.md; `npm run validate` rejects Chinese in these fields), `taskType {code: "vocab_day", labelZh: "词汇天天练"}`, `meta {totalPoints: 100, suggestedMinutes: 30, passPercent: 60}`, `source.pdf` = the exercise book.

## Sections (every day has the same four)
| 大题 | question | points |
|---|---|---|
| 一 单词默写（30%） | `textEntry`, prompt = the Chinese with its parts of speech exactly as printed, then the blank (as zkv word-day 二) | 30 ÷ number of questions, **not rounded** (34 → `0.8823529411764706`) |
| 二 词组默写（30%） | `textEntry`, prompt = Chinese + blank (as zkv phrase-day 一) | 30 ÷ n (15 → 2) |
| 三 首字母填空（20%） | `textEntry`, sentence with the blank where printed, `"hint": {"firstLetter": "a"}`, the printed letter removed from the text | 20 ÷ n |
| 四 句子翻译（20%） | `extendedText` `scoring: "judge"`, prompt = the Chinese sentence, `requiredWord` = the bracketed word/phrase | 20 ÷ n |
- `instruction` = the printed heading without the percentage; section `label` 一…四.
- `entryRef`: 一/三 = the entry of the answer word; 二 = the entry whose 词组 lists that phrase (or the phrase's head word); 四 = the entry of the required word/phrase.

## Key — `content/playlists/gkv/keys/gkv-d00N.json`
As zkv. `officialRef {pdf: "2027年上海市高考英语词汇练习答案.pdf", pages: [2]}` (PDF page numbers).
- 一 / 二 / 三: `accept` = every printed alternative (`to/into` → both; `besides/as well as` → each; `sb.'s` → also `sb's`, `one's`; an `a (an)` style answer → `a`, `an`, `a (an)`). When the printed answer lists several forms for one prompt with several meanings (`admit sth.; admit doing sth.; admit that`), accept the whole printed string **and** each form alone, and say so in the report. 三: the full word (the grader also accepts the letters after the printed first letter).
- 四: the answer book prints one reference with the required word in bold → `references: [that sentence]`, `sampleAnswer` = it, `rubricType: "translation"`, keyPoints meaning / language (weight = half the points each).
- `explanationZh` for every question (generated — `"explanationSource": "generated"`), short and simple, consistent with the handbook.

## Checks and report
`npm run validate -- gkv-d001 gkv-d002` → 0 errors, then `npx tsx scripts/check-vocab.ts gkv-d001 gkv-d002` → 0 missing. Keep book errors as printed and list them. Report: files, counts, book errors, uncertain readings (with page), alternatives you added, anything the brief does not cover. Do not run `build:index`, do not touch code or other content.
