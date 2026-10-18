export interface BookMap {
  offset: number;
  weekStart: number[];
  keyPages: (week: number) => number[];
  pdf: string;
  keyPdf: string;
  video: 'page' | 'weeklyIntensive';
}
export const BOOKS: Record<string, BookMap>;
