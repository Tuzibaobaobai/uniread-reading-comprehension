import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QuestionStrip } from '@/ui/quiz/QuestionNav/QuestionNav';
import leftIcon from '@/assets/icons/scan-arrow-left.svg';
import rightIcon from '@/assets/icons/scan-arrow-right.svg';
import { Check } from '@/components/Icons';
import './PartNav.css';

/** What one question's number shows: not answered / answered (brand fill) / after submitting: right / wrong */
export type PartQuestionState = 'none' | 'answered' | 'correct' | 'wrong';

export interface PartNavPart {
  id: string;
  /** the Part's title on its own card: "Part 1" (current) */
  title: string;
  /** the short label on the other Parts' cards: "P2" */
  kicker: string;
  /** the question range under the kicker: "Q6–Q20" */
  range: string;
  questions: { id: string; number: number; state: PartQuestionState; ariaLabel: string }[];
  /** answering: questions answered / questions ("3/5"); after submitting: questions right / questions, undefined while a mark is still coming */
  count?: string;
  /** every question of the Part answered (the completion pill turns brand) */
  complete: boolean;
  ariaLabel: string;
}

/**
 * rc/Vocab/PartNav (proposed) — the footer of one-Part-a-page 词汇测验, drawn by the UniRead designer (Figma RC · Screens ·
 * DS-2026-11-03, section 词汇 › 测验 19518:124597, `question-nav` 19706:143453…): a round previous button, the Parts
 * as cards, a round next / submit button. The current Part opens into a card with its question numbers (tap one to go to
 * that question); every other Part is a small card "P2 · Q6–Q20" with its completion "3/5".
 *
 * Variants — Part card: Current no / yes; Mode answering / review (review: the pill is replaced by one 3 px dash per
 * question, green right / red wrong / grey not marked, with "right/total" below). Question number: State none /
 * answered / correct / wrong. Action: next (arrow) / submit (brand circle, `dim` while questions are left, still
 * tappable → the confirmation) / back (review's last page).
 * Layout is for the vocab quiz only; KET / PET keep ui/quiz/QuestionNav + ui/PartPager.
 */
export function PartNav({
  label,
  parts,
  page,
  review = false,
  prev,
  action,
  onPage,
  onPickQuestion,
}: {
  /** aria-label of the nav landmark */
  label: string;
  parts: PartNavPart[];
  page: number;
  /** after submitting (the answers shown with their marks) */
  review?: boolean;
  prev: { label: string; onClick: () => void };
  /** the right-hand button: next page or submit (in review the way back to the result is the breadcrumb, #146) */
  action: { kind: 'next' | 'submit'; label: string; dim?: boolean; disabled?: boolean; onClick: () => void };
  onPage: (i: number) => void;
  onPickQuestion: (partIndex: number, questionId: string) => void;
}) {
  return (
    <nav className="part-nav" aria-label={label}>
      <button type="button" className="part-arrow" disabled={page <= 0} aria-label={prev.label} onClick={prev.onClick}>
        <img src={leftIcon} alt="" />
      </button>
      <QuestionStrip current={page} count={parts.length}>
        {parts.map((p, i) =>
          i === page ? (
            <CurrentPart key={p.id} part={p} review={review} onPick={(qid) => onPickQuestion(i, qid)} />
          ) : (
            <PartCard key={p.id} part={p} review={review} onClick={() => onPage(i)} />
          ),
        )}
      </QuestionStrip>
      <ActionButton {...action} />
    </nav>
  );
}

/** the current Part: its title and every question number */
function CurrentPart({ part, review, onPick }: { part: PartNavPart; review: boolean; onPick: (qid: string) => void }) {
  // a long Part (15, 32 questions) scrolls its numbers inside the card: fade the side that hides numbers, and let a PC
  // mouse wheel scroll it sideways
  const ref = useRef<HTMLSpanElement>(null);
  const [more, setMore] = useState({ start: false, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setMore({ start: el.scrollLeft > 1, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
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
  }, []);
  return (
    <div className="part-card is-current" role="group" aria-label={part.ariaLabel} aria-current="true" data-part={part.kicker}>
      <span className="part-card-title">{part.title}</span>
      <span ref={ref} className={`part-qs${more.start ? ' has-more-start' : ''}${more.end ? ' has-more-end' : ''}`}>
        {part.questions.map((q) => (
          <button key={q.id} type="button" className={`part-q is-${q.state} ${review ? 'is-review' : ''}`} aria-label={q.ariaLabel} onClick={() => onPick(q.id)}>
            {q.number}
          </button>
        ))}
      </span>
    </div>
  );
}

/** another Part: kicker, range and the completion pill (answering) or the right / wrong dashes (review) */
function PartCard({ part, review, onClick }: { part: PartNavPart; review: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`part-card ${review ? 'is-review' : ''}`} aria-label={part.ariaLabel} data-part={part.kicker} onClick={onClick}>
      <span className="part-card-title">{part.kicker}</span>
      <span className="part-card-range">{part.range}</span>
      {review ? (
        <span className="part-result">
          <span className="part-segs" aria-hidden>
            {part.questions.map((q) => (
              <span key={q.id} className={`part-seg is-${q.state}`} />
            ))}
          </span>
          <span className="part-result-count">{part.count ?? ''}</span>
        </span>
      ) : (
        <span className={`part-pill ${part.complete ? 'is-full' : ''}`}>{part.count}</span>
      )}
    </button>
  );
}

function ActionButton({ kind, label, dim, disabled, onClick }: { kind: 'next' | 'submit'; label: string; dim?: boolean; disabled?: boolean; onClick: () => void }): ReactNode {
  if (kind === 'next')
    return (
      <button type="button" className="part-arrow" aria-label={label} disabled={disabled} onClick={onClick}>
        <img src={rightIcon} alt="" />
      </button>
    );
  return (
    <button type="button" className={`part-arrow is-primary ${dim ? 'is-dim' : ''}`} disabled={disabled} onClick={onClick}>
      <Check />
      <span>{label}</span>
    </button>
  );
}
