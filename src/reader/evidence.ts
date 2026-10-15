/**
 * Sentence-level evidence highlighting (issue #1).
 * Finds a key's evidence quote inside its article block, widens it to the whole sentence,
 * and paints it with the CSS Custom Highlight API (no DOM mutation, so React stays in control).
 */

/** text that is not part of the English sentence: Chinese glosses, blank chips */
const SKIP = '.rt-gloss, .blank-chip';

interface Char {
  node: Text;
  offset: number;
}

const canon = (c: string) => {
  if (/\s/.test(c)) return ' ';
  if (c === '’' || c === '‘') return "'";
  if (c === '“' || c === '”') return '"';
  return c.toLowerCase();
};

/** flatten a block's visible English text, keeping a map back to DOM positions */
function flatten(root: HTMLElement) {
  const chars: Char[] = [];
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const s = n.data;
    for (let i = 0; i < s.length; i++) {
      const c = canon(s[i]);
      if (c === ' ' && (text.endsWith(' ') || text === '')) continue;
      text += c;
      chars.push({ node: n, offset: i });
    }
  }
  return { text, chars };
}

const END = /[.!?。！？]/;

/** range covering the sentence(s) that contain `quote`, or null if the quote is not found */
export function sentenceRange(block: HTMLElement, quote: string): Range | null {
  const { text, chars } = flatten(block);
  const q = [...quote.trim()].map(canon).join('').replace(/ +/g, ' ');
  const at = text.indexOf(q);
  if (at < 0 || !q) return null;
  const QUOTE = /["']/;
  // a sentence ends at . ! ? (plus closing quotes) followed by a space or the end — so "0.5" does not split
  const endsAt = (i: number) => {
    // i = exclusive end index
    let j = i;
    while (j > 0 && QUOTE.test(text[j - 1])) j--;
    return j > 0 && END.test(text[j - 1]) && (i === text.length || text[i] === ' ');
  };
  let start = at;
  while (start > 0 && !(text[start - 1] === ' ' && endsAt(start - 1))) start--;
  let end = at + q.length; // exclusive
  while (end < text.length && !endsAt(end)) end++;
  const a = chars[start];
  const b = chars[end - 1];
  if (!a || !b) return null;
  const r = document.createRange();
  r.setStart(a.node, a.offset);
  r.setEnd(b.node, b.offset + 1);
  return r;
}

type HighlightRegistry = Map<string, unknown>;
const registry = (): HighlightRegistry | null =>
  typeof CSS !== 'undefined' && 'highlights' in CSS ? (CSS as unknown as { highlights: HighlightRegistry }).highlights : null;
const HighlightCtor = (): (new (...r: Range[]) => unknown) | null =>
  typeof window !== 'undefined' && 'Highlight' in window ? (window as unknown as { Highlight: new (...r: Range[]) => unknown }).Highlight : null;

export const highlightSupported = () => !!registry() && !!HighlightCtor();

/** paint ranges under a highlight name (`::highlight(name)` in CSS); empty list clears it */
export function paint(name: string, ranges: Range[]) {
  const reg = registry();
  const H = HighlightCtor();
  if (!reg || !H) return;
  if (ranges.length) reg.set(name, new H(...ranges));
  else reg.delete(name);
}
