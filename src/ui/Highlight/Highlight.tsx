import './Highlight.css';

export type HighlightEmphasis = 'evidence' | 'flash';

/**
 * ui/Highlight — extends UniRead UIkit-Read `highlight` (15398:105249, issue #138) with Emphasis evidence / flash:
 * the evidence sentence of the current question in review (CSS Custom Highlight API `::highlight(evidence)`, or the
 * whole block with `.is-evidence` where a sentence cannot be matched) and the short flash after 定位原文
 * (`::highlight(flash)`, or `.flash` on the block). The painting itself lives in src/reader/evidence.ts.
 */
export const Highlight = {
  /** class for a block highlighted as a whole (the fallback when the sentence range is not found) */
  evidenceClass: 'is-evidence',
  /** restart the locate flash on a whole block */
  flash(el: HTMLElement) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  },
};
