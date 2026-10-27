/**
 * UniRead Reading Comprehension — content & attempt schema (v1.0)
 *
 * Single source of truth for all data in content/. Interaction kinds are named after
 * 1EdTech QTI 3.0 interactions so items can later be exported to QTI.
 * See docs/03-data-model.md for field semantics and examples.
 */
import { z } from 'zod';

export const SCHEMA_VERSION = '1.0';

/* ------------------------------------------------------------------ ids */

export const PlaylistId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
/** 时文阅读 item: <playlist>-wNN-<day> */
export const ArticleItemId = z.string().regex(/^[a-z0-9-]+-w\d{2}-(mon|tue|wed|thu|fri)$/);
/** exam paper (KET/PET 真题): <playlist>-t<test>-<rw|r|w|l|s> — KET: one Reading & Writing paper; PET: separate r / w */
export const ExamItemId = z.string().regex(/^[a-z0-9]+-t\d+-(rw|r|w|l|s)$/);
export const ItemId = z.union([ArticleItemId, ExamItemId]);
export const Day = z.enum(['mon', 'tue', 'wed', 'thu', 'fri']);

/* ------------------------------------------------------------- inline */

export const BlankHint = z
  .object({
    /** first letter(s) printed before the blank, e.g. "n" in "n____" */
    firstLetter: z.string().optional(),
    /** base word printed in brackets, e.g. "(develop)" */
    baseWord: z.string().optional(),
  })
  .strict();

export const Inline: z.ZodType<InlineT> = z.lazy(() =>
  z.discriminatedUnion('t', [
    z.object({ t: z.literal('text'), v: z.string() }).strict(),
    /** italics, e.g. book or film titles */
    z.object({ t: z.literal('em'), v: z.string() }).strict(),
    /** bold text inside passage (e.g. sub-labels) */
    z.object({ t: z.literal('strong'), v: z.string() }).strict(),
    /** highlighted vocabulary word; ref → article.vocabulary[].id */
    z.object({ t: z.literal('vocab'), v: z.string(), ref: z.string().optional() }).strict(),
    /** underlined word targeted by a question (may also be vocab) */
    z.object({ t: z.literal('underline'), v: z.string(), vocab: z.string().optional() }).strict(),
    /** inline Chinese gloss, rendered "v ( zh )". v may be "" when the gloss follows a vocab node */
    z.object({ t: z.literal('gloss'), v: z.string(), zh: z.string() }).strict(),
    /** a response slot; id is unique within the item (b1, b2…) */
    z
      .object({
        t: z.literal('blank'),
        id: z.string().regex(/^b\d+[a-z]?$/),
        number: z.number().int().positive().optional(),
        hint: BlankHint.optional(),
      })
      .strict(),
    z.object({ t: z.literal('br') }).strict(),
    /** a handwritten note added to a printed text (PET Writing Part 1 email), shown as a tag after the words it comments on */
    z.object({ t: z.literal('callout'), v: z.string() }).strict(),
  ]),
);

export type InlineT =
  | { t: 'text'; v: string }
  | { t: 'em'; v: string }
  | { t: 'strong'; v: string }
  | { t: 'vocab'; v: string; ref?: string }
  | { t: 'underline'; v: string; vocab?: string }
  | { t: 'gloss'; v: string; zh: string }
  | { t: 'blank'; id: string; number?: number; hint?: z.infer<typeof BlankHint> }
  | { t: 'br' }
  | { t: 'callout'; v: string };

export const Rich = z.array(Inline);

/* -------------------------------------------------------------- blocks */

const blockBase = { id: z.string().regex(/^[a-z]+\d+$/) };

export const TableCell = z
  .object({
    content: Rich,
    header: z.boolean().optional(),
    colSpan: z.number().int().positive().optional(),
    rowSpan: z.number().int().positive().optional(),
  })
  .strict();

export const Block = z.discriminatedUnion('type', [
  z
    .object({
      ...blockBase,
      type: z.literal('paragraph'),
      content: Rich,
      indent: z.boolean().optional(),
      /** image id (article.images) printed beside the paragraph, e.g. the writer's portrait in KET Reading Part 2 (#91) */
      image: z.string().optional(),
    })
    .strict(),
  z.object({ ...blockBase, type: z.literal('heading'), content: Rich, level: z.number().int().min(2).max(4).optional() }).strict(),
  z
    .object({ ...blockBase, type: z.literal('list'), ordered: z.boolean().optional(), items: z.array(Rich) })
    .strict(),
  z
    .object({
      ...blockBase,
      type: z.literal('dialogue'),
      /** e.g. "W: Woman  M: Man" */
      legend: z.string().optional(),
      turns: z.array(z.object({ speaker: z.string(), content: Rich }).strict()),
    })
    .strict(),
  /** note / notice / letter / advert box */
  z
    .object({
      ...blockBase,
      type: z.literal('note'),
      title: Rich.optional(),
      content: z.array(Rich),
      signature: z.array(Rich).optional(),
      /**
       * printed genre layout (#96): email = header band with From / To / Subject fields (`header`); notice = title
       * bar, centred `heading` and centred lines (an announcement / advert). Absent = plain box.
       */
      style: z.enum(['email', 'notice']).optional(),
      /** email: the header fields, one line each ("**From:** Chris") */
      header: z.array(Rich).optional(),
      /** notice: the large centred heading under the title bar */
      heading: Rich.optional(),
    })
    .strict(),
  z
    .object({
      ...blockBase,
      type: z.literal('table'),
      caption: Rich.optional(),
      rows: z.array(z.array(TableCell)),
    })
    .strict(),
  z.object({ ...blockBase, type: z.literal('imageRef'), image: z.string() }).strict(),
]);
export type BlockT = z.infer<typeof Block>;

/* ------------------------------------------------------------- article */

export const Image = z
  .object({
    id: z.string(),
    src: z.string(),
    alt: z.string(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    caption: z.string().optional(),
  })
  .strict();

export const VocabEntry = z
  .object({
    id: z.string().regex(/^v-[a-z0-9-]+$/),
    headword: z.string(),
    ipa: z.string().optional(),
    pos: z.string().optional(),
    meaningZh: z.string(),
  })
  .strict();

export const Article = z
  .object({
    images: z.array(Image),
    blocks: z.array(Block),
    vocabulary: z.array(VocabEntry),
  })
  .strict();

export const ItemMeta = z
  .object({
    genre: z.string(), // 语篇类型
    wordCount: z.number().int().positive(), // 词数
    difficulty: z.number().int().min(1).max(9), // 难度 N 级
    suggestedMinutes: z.number().int().positive(), // 建议用时
    themeContext: z.string(), // 主题语境
    contentRequirement: z.string().optional(), // 内容要求
    intro: z.string(), // 导语 / 导读
    hasVideo: z.boolean(), // 本篇配视频讲解课程
  })
  .strict();

/* ------------------------------------------------------- interactions */

export const Option = z
  .object({
    id: z.string().regex(/^[A-Z]$|^[TF]$/),
    content: Rich,
    image: z.string().optional(),
  })
  .strict();

export const Choice = z
  .object({
    kind: z.literal('choice'),
    variant: z.enum(['standard', 'trueFalse']).default('standard'),
    prompt: Rich,
    options: z.array(Option).min(2),
    maxChoices: z.literal(1).default(1),
  })
  .strict();

/** one blank (in passage or prompt) with its own option list — cloze, (A/B) choose-in-brackets */
export const InlineChoice = z
  .object({
    kind: z.literal('inlineChoice'),
    blankId: z.string(),
    /** prompt for blanks that live in the question rather than the passage */
    prompt: Rich.optional(),
    options: z.array(Option).min(2),
  })
  .strict();

/**
 * blank(s) filled from the section's shared bank — 选词填空 / 六选四 / 七选五 / 补全对话.
 * Usually one blank; a question sentence may contain several (key.correct is aligned with blankIds).
 * Blanks in the passage are listed in blankIds; blanks in the prompt are discovered from prompt.
 */
export const GapMatch = z
  .object({
    kind: z.literal('gapMatch'),
    blankIds: z.array(z.string()).optional(),
    prompt: Rich.optional(),
  })
  .strict();

/** typed answer into 1..n blanks — 短文填空 / 表格填空 / 句子补全 */
export const TextEntry = z
  .object({
    kind: z.literal('textEntry'),
    /** blanks in the passage/table: list their ids; blanks in the prompt are discovered from prompt */
    blankIds: z.array(z.string()).optional(),
    prompt: Rich.optional(),
    maxWords: z.number().int().positive().optional(),
    /** perBlank (default): partial credit per blank; all: the question scores only when every blank is right (句型转换) */
    scoring: z.enum(['perBlank', 'all']).optional(),
  })
  .strict();

/** 连线题 — every left item gets exactly one right item */
export const Match = z
  .object({
    kind: z.literal('match'),
    prompt: Rich.optional(),
    left: z.array(z.object({ id: z.string(), content: Rich }).strict()),
    right: z.array(z.object({ id: z.string(), content: Rich, image: z.string().optional() }).strict()),
  })
  .strict();

/**
 * 回答问题 / 观点题 — constructed response.
 * scoring: judge = scored by an LLM judge against the key's reference answer + key points (docs/09);
 *          self  = learner compares with the reference answer (also the fallback when no judge is available);
 *          none  = feedback only, never scored.
 */
export const ExtendedText = z
  .object({
    kind: z.literal('extendedText'),
    prompt: Rich,
    /** sentence frame with blanks, e.g. "They felt ___ but ___." */
    scaffold: Rich.optional(),
    scoring: z.enum(['judge', 'self', 'none']),
    /** writing tasks: minimum word count printed in the task (live word counter) */
    minWords: z.number().int().positive().optional(),
    /** writing tasks: the printed text the task is based on, kept in its genre layout (an announcement…), after the prompt (#96) */
    stimulus: z.array(Block).optional(),
    /** writing tasks: the instruction printed after the stimulus ("Write your **article**.") */
    task: Rich.optional(),
    /** a written cell of a section table (section.view "table", #127): the answer box sits at this blank */
    blankId: z.string().optional(),
  })
  .strict();

/**
 * 口语 — the examiner's lines are read aloud (TTS) one by one; the learner records an answer after each.
 * Recordings are transcribed on the server (/api/rc/speak) and the transcript is judged as a whole.
 * Response: {turnId: transcript}.
 */
export const Speaking = z
  .object({
    kind: z.literal('speaking'),
    prompt: Rich,
    turns: z
      .array(
        z
          .object({
            id: z.string().regex(/^t\d+$/),
            text: z.string(),
            /** examiner (default) asks and the learner answers; partner (AI, PET Part 3) speaks and the learner replies */
            role: z.enum(['examiner', 'partner']).optional(),
            /** the examiner line as audio (scripts/tts.mjs); absent → the browser reads it aloud */
            audio: z.object({ src: z.string(), seconds: z.number().positive() }).strict().optional(),
          })
          .strict(),
      )
      .min(1),
    /** longest recording per turn */
    maxSeconds: z.number().int().positive(),
    scoring: z.enum(['judge', 'self']),
  })
  .strict();

/** 连词成句 — tap the word chunks in order to build a sentence (tap again to undo; no drag) */
export const Order = z
  .object({
    kind: z.literal('order'),
    prompt: Rich.optional(),
    /** chunks in the order printed in the book */
    items: z.array(z.object({ id: z.string(), content: Rich }).strict()),
    /** fixed ending printed after the answer line, e.g. "." or "?" */
    ending: z.string().optional(),
  })
  .strict();

export const Interaction = z.discriminatedUnion('kind', [
  Choice,
  InlineChoice,
  GapMatch,
  TextEntry,
  Match,
  ExtendedText,
  Order,
  Speaking,
]);
export type InteractionT = z.infer<typeof Interaction>;

export const Skill = z.enum([
  'main_idea',
  'detail',
  'inference',
  'vocab_in_context',
  'reference',
  'attitude',
  'structure',
  'grammar',
  'calculation',
  'opinion',
]);

export const Question = z
  .object({
    id: z.string().regex(/^q\d+$/),
    /** display number, continuous across sections of one item */
    number: z.number().int().positive(),
    points: z.number().nonnegative().default(1),
    skills: z.array(Skill).default([]),
    interaction: Interaction,
    /** exam items: material shown in the left pane while this question is current (e.g. a KET Part 1 notice) */
    material: z.array(Block).optional(),
    /** image id (article.images) printed beside the question, e.g. each person's photo in PET Reading Part 2 (#91) */
    image: z.string().optional(),
  })
  .strict();
export type QuestionT = z.infer<typeof Question>;

export const BankEntry = z.object({ id: z.string().regex(/^[A-Z]$/), content: Rich }).strict();

export const Section = z
  .object({
    id: z.string().regex(/^s\d+$/),
    label: z.string().optional(), // "I", "II"
    instruction: z.string(),
    /** shared bank for gapMatch questions; each entry may be used once */
    bank: z.array(BankEntry).optional(),
    /** a table or other stimulus that belongs to the question area (e.g. 表格填空) */
    stimulus: z.array(Block).optional(),
    /** exam items: Part number (KET Reading & Writing 1–7, Listening 1–5, Speaking 1–2) */
    part: z.number().int().positive().optional(),
    /** exam items: the Part's texts shown in the left pane (passage, notes form with blanks…) */
    material: z.array(Block).optional(),
    /** exam items: the lead-in printed before the questions, shown above them in the question pane (PET Reading Part 2, #90) */
    intro: Rich.optional(),
    /** exam items: the Part's recording; the file already contains both plays */
    audio: z.object({ src: z.string(), seconds: z.number().int().positive() }).strict().optional(),
    /** the learner answers this many of the section's questions (PET Writing Part 2: 1 of 2); only those count */
    choose: z.number().int().positive().optional(),
    /**
     * exam Parts answered on one page (#82 #86 #87): all = every question of the Part together (a grid when the
     * questions share their options); match = two-column board, each option used once (people ↔ texts / things);
     * table = the section's stimulus table as printed, each question answered in its cell (a dropdown for an
     * inlineChoice blank, a text box for an extendedText blank — 表格填空 with ticks and written cells, #127)
     */
    view: z.enum(['all', 'match', 'table']).optional(),
    /** the printed example of a match Part ("0 Jack — B"): shown first, its option is used up */
    example: z.object({ prompt: z.string(), answer: z.string() }).strict().optional(),
    /** a match Part's printed column headings ("People" | "Things to bring", KET Listening Part 5, #104) */
    columns: z.object({ left: z.string(), right: z.string() }).strict().optional(),
    questions: z.array(Question).min(1),
  })
  .strict();
export type SectionT = z.infer<typeof Section>;

export const TaskTypeCode = z.enum([
  'reading_choice', // 阅读选择 / 阅读理解
  'cloze', // 完形填空
  'word_bank', // 选词填空
  'six_choose_four', // 六选四
  'seven_choose_five', // 七选五
  'matching', // 连线题
  'true_false', // 判断正误
  'answer_questions', // 回答问题
  'passage_fill', // 短文填空
  'table_fill', // 表格填空
  'dialogue_completion', // 补全对话
  'weekly_intensive', // 每周精读
  'exam_reading_writing', // 真题 · 阅读与写作
  'exam_reading', // 真题 · 阅读
  'exam_writing', // 真题 · 写作
  'exam_listening', // 真题 · 听力
  'exam_speaking', // 真题 · 口语
]);

export const Errata = z
  .object({ original: z.string(), corrected: z.string(), note: z.string().optional() })
  .strict();

/** 时文阅读 item (the original v1.0 shape; delivered content is frozen) */
export const ArticleItem = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: ArticleItemId,
    playlistId: PlaylistId,
    order: z.number().int().positive(),
    week: z.number().int().positive(),
    day: Day,
    title: z.string(),
    titleZh: z.string().optional(),
    displayName: z.string(),
    taskType: z.object({ code: TaskTypeCode, labelZh: z.string() }).strict(),
    meta: ItemMeta,
    thumbnail: z.string().optional(),
    article: Article,
    sections: z.array(Section).min(1),
    media: z.object({ audio: z.string().optional(), video: z.string().optional() }).strict().optional(),
    errata: z.array(Errata).optional(),
    source: z
      .object({ pdf: z.string(), pdfPages: z.array(z.number().int()), bookPages: z.array(z.number().int()) })
      .strict(),
    status: z
      .object({ content: z.enum(['transcribed', 'reviewed']), version: z.string() })
      .strict(),
  })
  .strict();
export type ArticleItemT = z.infer<typeof ArticleItem>;

export const ExamPaper = z.enum(['reading_writing', 'reading', 'writing', 'listening', 'speaking']);

/**
 * One paper of an exam test (KET/PET 真题): Reading & Writing, Listening or Speaking.
 * Parts are sections; each section carries its own material / audio, so `article` holds only the image registry.
 */
export const ExamItem = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    format: z.literal('exam'),
    id: ExamItemId,
    playlistId: PlaylistId,
    order: z.number().int().positive(),
    /** 第 N 套 */
    test: z.number().int().positive(),
    paper: ExamPaper,
    title: z.string(),
    displayName: z.string(),
    taskType: z.object({ code: TaskTypeCode, labelZh: z.string() }).strict(),
    meta: z
      .object({
        exam: z.string(), // e.g. "A2 Key for Schools"
        durationMinutes: z.number().int().positive(), // official time for the paper
        totalMarks: z.number().int().positive(),
        intro: z.string().optional(),
      })
      .strict(),
    thumbnail: z.string().optional(),
    article: Article,
    sections: z.array(Section).min(1),
    errata: z.array(Errata).optional(),
    source: z
      .object({ pdf: z.string(), pdfPages: z.array(z.number().int()), bookPages: z.array(z.number().int()) })
      .strict(),
    status: z
      .object({ content: z.enum(['transcribed', 'reviewed']), version: z.string() })
      .strict(),
  })
  .strict();
export type ExamItemT = z.infer<typeof ExamItem>;

export const Item = z.union([ArticleItem, ExamItem]);
export type ItemT = z.infer<typeof Item>;
export const isExam = (item: ItemT): item is ExamItemT => 'format' in item && item.format === 'exam';

/* --------------------------------------------------------------- keys */

export const Evidence = z.object({ block: z.string(), quote: z.string() }).strict();

const answerCommon = {
  explanationZh: z.string().optional(),
  /** short language tip (语言点) shown with the explanation */
  tipsZh: z.string().optional(),
  evidence: z.array(Evidence).optional(),
};

export const SlotKey = z
  .object({
    /** accepted answers, compared after normalisation */
    accept: z.array(z.string()).min(1),
    caseSensitive: z.boolean().optional(),
  })
  .strict();

export const JudgeKeyPoint = z
  .object({
    id: z.string(),
    /** the point in Chinese, as a marker would write it */
    descZh: z.string(),
    /** acceptable English wordings / keywords (hints for the judge, not exact-match rules) */
    examples: z.array(z.string()).optional(),
    weight: z.number().positive(),
  })
  .strict();

export const JudgeAnchor = z
  .object({ response: z.string(), score: z.number().nonnegative(), noteZh: z.string().optional() })
  .strict();

export const AnswerKey = z.union([
  /** choice / inlineChoice → [optionId] (several ids = accepted alternatives); gapMatch → bank ids aligned with the question's blanks */
  z.object({ ...answerCommon, correct: z.array(z.string()).min(1) }).strict(),
  /** textEntry: one entry per blank id */
  z.object({ ...answerCommon, slots: z.record(SlotKey) }).strict(),
  /** match: left id → right id */
  z.object({ ...answerCommon, pairs: z.record(z.string()) }).strict(),
  /** order: one accepted sequence … */
  z.object({ ...answerCommon, sequence: z.array(z.string()) }).strict(),
  /** … or several accepted sequences (e.g. an adverbial that can move) */
  z.object({ ...answerCommon, sequences: z.array(z.array(z.string())).min(1) }).strict(),
  /** extendedText */
  z
    .object({
      ...answerCommon,
      /** official reference answer (alternatives separated by " / ") */
      sampleAnswer: z.string(),
      /** free-text marking note for humans */
      rubricZh: z.string().optional(),
      /**
       * content: answer must convey the key points; opinion: stance + supported reason(s), no single right answer;
       * cambridge_a2_writing / cambridge_a2_speaking: Cambridge English A2 Key assessment scales — keyPoints are the
       * criteria (weight = top band, 5), each judged on a 0–5 band; the UI states that Cambridge's scales were used.
       */
      rubricType: z
        .enum(['content', 'opinion', 'cambridge_a2_writing', 'cambridge_a2_speaking', 'cambridge_b1_writing', 'cambridge_b1_speaking'])
        .optional(),
      /** 得分要点 — what a full-mark answer must convey; weights sum to the question's points */
      keyPoints: z.array(JudgeKeyPoint).optional(),
      /** all = every key point needed for full marks; any = any one key point (“答出其一即可”) */
      match: z.enum(['all', 'any']).optional(),
      /** teacher-scored sample answers used as few-shot anchors and for calibration */
      anchors: z.array(JudgeAnchor).optional(),
    })
    .strict(),
]);
export type AnswerKeyT = z.infer<typeof AnswerKey>;

export const ItemKey = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    itemId: ItemId,
    answerSource: z.enum(['official', 'generated']),
    /** who wrote the 中文解析: the answer book (official) or the producer when the book has none (PET 校园版真题 3); absent = same as answerSource */
    explanationSource: z.enum(['official', 'generated']).optional(),
    reviewStatus: z.enum(['pending', 'approved']),
    /** where the official answers come from (answer-book PDF pages) */
    officialRef: z.object({ pdf: z.string(), pages: z.array(z.number().int().positive()) }).strict().optional(),
    answers: z.record(AnswerKey),
    /** listening transcripts by section id — private like the answers, revealed after submitting */
    transcripts: z.record(z.array(Block)).optional(),
  })
  .strict();
export type ItemKeyT = z.infer<typeof ItemKey>;

/* ----------------------------------------------------------- playlist */

export const Playlist = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: PlaylistId,
    title: z.string(),
    shortTitle: z.string(),
    series: z.string(),
    publisher: z.string(),
    gradeBand: z.string(),
    description: z.string(),
    locale: z.string(),
    cover: z.string(),
    /** wide version of the cover for the playlist page panel (Figma Playlist, 407:239); absent → cover */
    banner: z.string().optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    itemIds: z.array(ItemId),
    version: z.string(),
  })
  .strict();
export type PlaylistT = z.infer<typeof Playlist>;

/** lightweight item summary for list pages (generated by scripts/build-index.ts) */
export const ItemSummary = z
  .object({
    id: ItemId,
    order: z.number().int(),
    /** 时文阅读 only */
    week: z.number().int().optional(),
    day: Day.optional(),
    /** exam papers only: 第 N 套 + paper */
    test: z.number().int().optional(),
    paper: ExamPaper.optional(),
    title: z.string(),
    displayName: z.string(),
    taskType: z.object({ code: TaskTypeCode, labelZh: z.string() }).strict(),
    wordCount: z.number().int(),
    difficulty: z.number().int().optional(),
    suggestedMinutes: z.number().int(),
    questionCount: z.number().int(),
    thumbnail: z.string().optional(),
  })
  .strict();

export const Catalog = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    generatedAt: z.string(),
    playlists: z.array(
      z
        .object({
          id: PlaylistId,
          /** exam = 真题 playlist (items grouped by test); absent = 时文阅读 */
          format: z.literal('exam').optional(),
          /** exam playlists: the exam, e.g. "A2 Key for Schools" — picks the Cambridge English Scale table */
          exam: z.string().optional(),
          title: z.string(),
          shortTitle: z.string(),
          cover: z.string(),
          banner: z.string().optional(),
          accent: z.string(),
          gradeBand: z.string(),
          description: z.string(),
          itemCount: z.number().int(),
          totalWords: z.number().int(),
          difficultyRange: z.tuple([z.number().int(), z.number().int()]),
          taskTypes: z.array(TaskTypeCode),
          items: z.array(ItemSummary),
        })
        .strict(),
    ),
  })
  .strict();
export type CatalogT = z.infer<typeof Catalog>;

/* ------------------------------------------------------------ attempt */

/** response value per question, by interaction kind */
export const ResponseValue = z.union([
  z.array(z.string()), // choice / inlineChoice → [optionId]; order → sequence
  z.record(z.string()), // gapMatch → {blankId: bankId}; textEntry → {blankId: text}; match → {leftId: rightId}
  z.string(), // extendedText
]);

/** LLM-as-a-judge verdict for one constructed response (docs/09 §4) */
export const Judgement = z
  .object({
    score: z.number().nonnegative(),
    maxPoints: z.number().positive(),
    keyPoints: z.array(
      z
        .object({
          id: z.string(),
          met: z.enum(['yes', 'partial', 'no']),
          quote: z.string().optional(),
          /** Cambridge rubrics: the criterion's band (0–5) */
          band: z.number().int().min(0).max(5).optional(),
        })
        .strict(),
    ),
    languageIssues: z.array(z.object({ text: z.string(), fix: z.string(), noteZh: z.string().optional() }).strict()),
    feedbackZh: z.string(),
    confidence: z.number().min(0).max(1),
    flags: z.array(z.enum(['empty', 'off_topic', 'not_english', 'copied_text', 'instruction_injection', 'too_long'])),
    /** low confidence or flags → shown as provisional and queued for teacher review */
    needsReview: z.boolean(),
    model: z.string(),
    promptVersion: z.string(),
    judgedAt: z.string(),
  })
  .strict();
export type JudgementT = z.infer<typeof Judgement>;

export const Attempt = z
  .object({
    attemptId: z.string(),
    itemId: ItemId,
    itemVersion: z.string(),
    learnerId: z.string().nullable(),
    startedAt: z.string(),
    submittedAt: z.string().nullable(),
    durationSec: z.number().nonnegative(),
    status: z.enum(['in_progress', 'submitted']),
    /** exam papers: practice (default) or timed exam mode */
    mode: z.enum(['practice', 'exam']).optional(),
    /** exam mode: questions the learner flagged for review */
    flagged: z.array(z.string()).optional(),
    /** exam mode: sections whose recording has been played (it can be played once) */
    played: z.array(z.string()).optional(),
    responses: z.record(ResponseValue),
    result: z
      .object({
        score: z.number(),
        maxScore: z.number(),
        byQuestion: z.array(
          z
            .object({
              q: z.string(),
              correct: z.boolean().nullable(), // null = not auto-scored
              points: z.number(),
              maxPoints: z.number(),
              /** per-blank / per-pair correctness for multi-slot questions */
              parts: z.record(z.boolean()).optional(),
              /** how the points were decided; absent = auto (deterministic grading) */
              scoredBy: z.enum(['auto', 'judge', 'pending', 'self', 'none']).optional(),
              /** LLM judge result for constructed responses (docs/09) */
              judgement: Judgement.optional(),
            })
            .strict(),
        ),
        selfAssessed: z.record(z.boolean()).optional(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type AttemptT = z.infer<typeof Attempt>;
