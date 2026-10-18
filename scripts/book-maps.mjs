// Per-book page maps for the token-lean pipeline (scripts/pack-week.mjs, scripts/check-week.ts).
// Book page N = PDF p(N + offset). weekStart = first book page of each week (from the TOC; its OCR
// garbles some numbers, so they are fixed here). keyPages = answer-book PDF pages per week (from the
// "WEEK N / Mon. …" markers in the answer book's text layer, padded by one page).
// video: 'page' = the article page prints “本篇配视频讲解课程”; 'weeklyIntensive' = the book's introduction
// says every 每周精读 (Friday) has a video course and the article pages carry no mark.
export const BOOKS = {
  'ci-g7': {
    offset: 9,
    weekStart: [1, 8, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114, 122, 132, 138, 144],
    keyPages: (w) => [2 * w - 1, 2 * w, 2 * w + 1, 2 * w + 2, 2 * w + 3],
    pdf: '初一第3辑初中时文阅读提分训练3+X第3辑7年级.pdf',
    keyPdf: '初一第3辑初中时文阅读提分训练3+X第3辑7年级答案.pdf',
    video: 'page',
  },
  'ci-g3': {
    offset: 9,
    weekStart: [1, 8, 14, 22, 30, 38, 46, 54, 60, 68, 76, 82, 89],
    keyPages: (w) => ({ 1: [2, 3], 2: [3, 4], 3: [5, 6], 4: [6, 7], 5: [8, 9], 6: [9, 10], 7: [11, 12], 8: [12, 13], 9: [14, 15], 10: [16, 17], 11: [17, 18], 12: [19, 20] })[w].flatMap((p, i, a) => (i === a.length - 1 ? [p, p + 1] : i === 0 ? [p - 1, p] : [p])),
    pdf: '小学英语时文阅读提分训练3+X3年级.pdf',
    keyPdf: '小学英语时文阅读提分训练3+X3年级答案.pdf',
    video: 'weeklyIntensive',
  },
  'ci-g5': {
    offset: 9,
    weekStart: [1, 8, 16, 26, 34, 42, 50, 58, 66, 74, 82, 92, 101],
    keyPages: (w) => ({ 1: [2, 3], 2: [3, 5], 3: [6, 7], 4: [8, 9], 5: [10, 12], 6: [12, 13], 7: [14, 15], 8: [16, 17], 9: [18, 20], 10: [21, 22], 11: [22, 23], 12: [24, 26] })[w].flatMap((p, i, a) => (a.length === 2 ? (i === 0 ? [p - 1, p] : [...Array(p - a[0]).keys()].map((k) => a[0] + 1 + k).concat(p + 1)) : [p])),
    pdf: '小学英语时文阅读提分训练3+X5年级.pdf',
    keyPdf: '小学英语时文阅读提分训练3+X5年级答案.pdf',
    video: 'weeklyIntensive',
  },
};
