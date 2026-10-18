import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from '@/components/Icons';

/**
 * The row of question numbers in the quiz footer. When there are more questions than fit, it shows a
 * "more" button on each side that still hides numbers (with how many), fades only that edge, lets a
 * vertical mouse wheel scroll it sideways, and keeps the current question centred.
 */
export function QuestionStrip({ current, count, children }: { current: number; count: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState({ left: 0, right: 0 });

  // a number counts as hidden when its centre is outside the strip or inside the outer half of a faded edge
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const fade = (parseFloat(getComputedStyle(el).getPropertyValue('--strip-fade')) || 0) / 2;
    let left = 0;
    let right = 0;
    for (const d of Array.from(el.children)) {
      const r = d.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      const overflow = el.scrollWidth > el.clientWidth;
      if (mid < box.left + (overflow && el.scrollLeft > 0 ? fade : 0)) left++;
      else if (mid > box.right - (overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1 ? fade : 0)) right++;
    }
    setHidden((h) => (h.left === left && h.right === right ? h : { left, right }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    // PC mouse wheels scroll vertically; turn that into sideways scrolling while the strip overflows
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
      el.removeEventListener('wheel', onWheel);
    };
  }, [measure]);

  // keep the current question in view (centred) whenever it changes
  useLayoutEffect(() => {
    const el = ref.current;
    const dot = el?.querySelector<HTMLElement>('.is-current');
    if (el && dot) el.scrollTo({ left: dot.offsetLeft - (el.clientWidth - dot.offsetWidth) / 2, behavior: 'smooth' });
    measure();
  }, [current, count, measure]);

  const page = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className={`question-strip ${hidden.left ? 'has-left' : ''} ${hidden.right ? 'has-right' : ''}`}>
      {hidden.left > 0 && (
        <button className="strip-more strip-more-left" onClick={() => page(-1)} aria-label={`向前查看，前面还有 ${hidden.left} 题`}>
          <ChevronLeft />
          <span className="strip-more-count" aria-hidden>+{hidden.left}</span>
        </button>
      )}
      <div className="question-dots" ref={ref}>
        {children}
      </div>
      {hidden.right > 0 && (
        <button className="strip-more strip-more-right" onClick={() => page(1)} aria-label={`向后查看，后面还有 ${hidden.right} 题`}>
          <span className="strip-more-count" aria-hidden>+{hidden.right}</span>
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
