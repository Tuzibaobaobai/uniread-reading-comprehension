import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from '@/components/Icons';
import './QuestionNav.css';

/**
 * ui/quiz/QuestionNav — extends UniRead UIKit-Quiz `pagination` (7870:51500, issue #138): the quiz footer — previous
 * button, the strip of question numbers (ui/PartPager), next / submit / 重新作答. Variant Overflow none / start / end /
 * both: when the numbers do not fit, a "‹ +N" / "+N ›" more button appears on the side that hides numbers (measured,
 * not a prop). Keeps the legacy classes (.question-nav, .question-strip, .question-dots, .strip-more …).
 */
export function QuestionNav({
  label,
  prev,
  action,
  current,
  count,
  children,
}: {
  /** aria-label of the nav landmark */
  label: string;
  /** the previous button (ui/QuizButton) */
  prev: ReactNode;
  /** next / submit / retry (ui/QuizButton) */
  action: ReactNode;
  /** index of the current page and the number of pages (keeps the current number centred) */
  current: number;
  count: number;
  /** the numbers (ui/PartPager) */
  children: ReactNode;
}) {
  return (
    <nav className="question-nav" aria-label={label}>
      {prev}
      <QuestionStrip current={current} count={count}>
        {children}
      </QuestionStrip>
      {action}
    </nav>
  );
}

/**
 * The row of question numbers in the quiz footer. When there are more questions than fit, it shows a
 * "more" button on each side that still hides numbers (with how many), fades only that edge, lets a
 * vertical mouse wheel scroll it sideways, and keeps the current question centred.
 */
export function QuestionStrip({ current, count, children }: { current: number; count: number; children: ReactNode }) {
  const { t } = useTranslation();
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
        <button type="button" className="strip-more strip-more-left" onClick={() => page(-1)} aria-label={t('reader.stripBack', { count: hidden.left })}>
          <ChevronLeft />
          <span className="strip-more-count" aria-hidden>+{hidden.left}</span>
        </button>
      )}
      <div className="question-dots" ref={ref}>
        {children}
      </div>
      {hidden.right > 0 && (
        <button type="button" className="strip-more strip-more-right" onClick={() => page(1)} aria-label={t('reader.stripForward', { count: hidden.right })}>
          <span className="strip-more-count" aria-hidden>+{hidden.right}</span>
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
