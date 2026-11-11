/** 'smooth' unless the learner asked the system for reduced motion (then jumps are instant) */
export function scrollBehavior(): ScrollBehavior {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function scrollParent(el: Element | null): HTMLElement | null {
  for (let n = el?.parentElement ?? null; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}

/**
 * Centres a text range (e.g. one sentence of a long transcript paragraph) in its scrolling pane. scrollIntoView on the
 * range's parent element only centres the whole paragraph, which can leave the sentence itself off-screen when the
 * paragraph is taller than the pane.
 */
export function scrollRangeIntoView(range: Range, fallback: Element) {
  const rect = range.getBoundingClientRect();
  const pane = scrollParent(range.startContainer.parentElement ?? fallback);
  if (!pane || (!rect.width && !rect.height)) {
    (range.startContainer.parentElement ?? fallback).scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    return;
  }
  const box = pane.getBoundingClientRect();
  // a sentence taller than the pane: show its start
  const delta = rect.height > box.height ? rect.top - box.top - 16 : rect.top + rect.height / 2 - (box.top + box.height / 2);
  pane.scrollBy({ top: delta, behavior: scrollBehavior() });
  // the pane itself may sit partly outside the page (narrow screens scroll the whole page)
  const outer = pane.getBoundingClientRect();
  if (outer.top < 0 || outer.bottom > window.innerHeight) pane.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
}
