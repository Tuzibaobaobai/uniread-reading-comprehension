// Per-book page maps for the token-lean pipeline (scripts/pack-week.mjs, scripts/check-week.ts).
// Book page N = PDF p(N + offset). weekStart = first book page of each week (from the TOC; its OCR
// garbles some numbers, so they are fixed here). keyPages = answer-book PDF pages per week (from the
// "WEEK N / Mon. …" markers in the answer book's text layer, padded by one page).
// video: 'page' = the article page prints “本篇配视频讲解课程”; 'weeklyIntensive' = the book's introduction
// says every 每周精读 (Friday) has a video course and the article pages carry no mark.
// answer-book pages from the "WEEK N" marker pages: one page before this week's marker through the next week's
const fromMarkers = (marks) => (w) => {
  const a = marks[w - 1];
  const b = marks[w] ?? a + 3;
  return [...Array(b - a + 2).keys()].map((k) => a - 1 + k);
};
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
  'ci-g4': {
    offset: 9,
    weekStart: [1, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 97],
    keyPages: fromMarkers([2, 3, 5, 7, 9, 11, 12, 14, 16, 18, 20, 21]),
    pdf: '小学英语时文阅读提分训练3+X4年级.pdf',
    keyPdf: '小学英语时文阅读提分训练3+X4年级答案.pdf',
    video: 'weeklyIntensive',
  },
  'ci-g8': {
    offset: 9,
    weekStart: [1, 10, 18, 26, 36, 44, 52, 62, 70, 78, 86, 94, 102, 110, 118, 126, 134, 144, 153],
    keyPages: fromMarkers([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 27, 29, 31, 33, 35, 37]),
    pdf: '初2第3辑初中时文阅读提分训练3+X第3辑8年级.pdf',
    keyPdf: '初2第3辑初初中时文阅读提分训练3+X第3辑8年级答案.pdf',
    video: 'page',
  },
  'ci-xsc3': {
    offset: 9,
    weekStart: [1, 8, 16, 24, 32, 38, 46, 52, 60, 68, 76, 84, 92, 98, 104, 112, 120, 126, 133],
    keyPages: fromMarkers([2, 4, 6, 9, 11, 13, 16, 18, 20, 22, 25, 27, 30, 32, 34, 36, 38, 40]),
    pdf: '小升初第3辑初中时文阅读提分训练3+X第3辑小升初.pdf',
    keyPdf: '小升初第3辑初中时文阅读提分训练3+X第3辑小升初答案.pdf',
    video: 'page',
  },
  'ci-zk': {
    offset: 9,
    weekStart: [1, 8, 16, 26, 34, 44, 54, 64, 72, 80, 88, 96, 106, 114, 122, 130, 140, 150, 157],
    keyPages: fromMarkers([2, 4, 6, 8, 10, 13, 15, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38]),
    pdf: '中考第3辑初中时文阅读提分训练3+X第3辑中考.pdf',
    keyPdf: '中考第3辑初中时文阅读提分训练3+X第3辑中考答案.pdf',
    video: 'page',
  },
};
