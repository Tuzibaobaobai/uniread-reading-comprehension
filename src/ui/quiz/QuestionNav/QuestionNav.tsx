import { scrollBehavior } from '@/lib/scroll';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from '@/components/Icons';
import { NavActionButton, NavArrow, type NavAction } from './NavButton';
import './QuestionNav.css';

/**
 * ui/quiz/QuestionNav — designer component `question-nav` (Figma 19802:13269, every 时文阅读 frame 1.02–1.20; extends
 * UniRead UIKit-Quiz `pagination` 7870:51500): the quiz footer of one question a page — a 56 × 80 round previous
 * button, the strip of question numbers (ui/PartPager), a round next button; on the last question the brand 提交
 * circle (dim while questions are left), after submitting 重新作答. When the numbers do not fit, each arrow shows
 * "+N" — the numbers hidden on its side (variant 个数超出=yes; measured, not a prop) — and that edge of the strip fades.
 * No previous button on the first question (variant 对齐方式=left). Keeps the legacy classes (.question-nav,
 * .question-strip, .question-dots).
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
  /** the previous question; `hidden` on the first */
  prev: { label: string; hidden?: boolean; onClick: () => void };
  /** next / submit / retry */
  action: NavAction;
  /** index of the current page and the number of pages (keeps the current number centred) */
  current: number;
  count: number;
  /** the numbers (ui/PartPager) */
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useStripOverflow(ref, current, count);
  return (
    <nav className={`question-nav ${prev.hidden ? 'no-prev' : ''}`} aria-label={label}>
      {!prev.hidden && <NavArrow dir="prev" label={prev.label} more={hidden.left} onClick={prev.onClick} />}
      <div className={`question-strip ${hidden.left ? 'has-left' : ''} ${hidden.right ? 'has-right' : ''}`}>
        <div className="question-dots" ref={ref}>
          {children}
        </div>
      </div>
      <NavActionButton {...action} more={action.kind === 'next' ? hidden.right : undefined} />
    </nav>
  );
}

/**
 * How many children of a scrolling strip are hidden on each side; a vertical mouse wheel scrolls it sideways and the
 * current child (.is-current) is kept centred. A child counts as hidden when its centre is outside the strip or inside
 * the outer half of a faded edge (--strip-fade).
 */
function useStripOverflow(ref: RefObject<HTMLDivElement>, current: number, count: number) {
  const [hidden, setHidden] = useState({ left: 0, right: 0 });
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
  }, [ref]);

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
  }, [measure, ref]);

  // keep the current child in view (centred) whenever it changes
  useLayoutEffect(() => {
    const el = ref.current;
    const dot = el?.querySelector<HTMLElement>(':scope > .is-current');
    if (el && dot) el.scrollTo({ left: dot.offsetLeft - (el.clientWidth - dot.offsetWidth) / 2, behavior: scrollBehavior() });
    measure();
  }, [current, count, measure, ref]);
  return hidden;
}

/**
 * A scrolling row with "more" buttons: when the children do not fit, a "‹ +N" / "+N ›" button on each side that still
 * hides some (scrolls a page), that edge faded, the current child centred. Used for the Part cards of rc/Vocab/PartNav.
 */
export function QuestionStrip({ current, count, children }: { current: number; count: number; children: ReactNode }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useStripOverflow(ref, current, count);

  const page = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: scrollBehavior() });

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
