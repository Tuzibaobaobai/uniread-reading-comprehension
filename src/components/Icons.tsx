const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Figma Header → btn-back icon (11790-77480 / 7750-19446): 18 × 18, stroke 4, colour from the button (#99) */
export const BackArrow = () => (
  <svg className="back-icon" viewBox="0 0 18 18" aria-hidden {...s} strokeWidth={4}>
    <path d="M16 9H2M9 2L2 9L9 16" />
  </svg>
);
/** Figma arrow-down-01-sharp (select, 19215-125964): 24 × 24, stroke 1.5 */
export const ChevronDown = () => (
  <svg className="chevron-down" viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={1.5}>
    <path d="M5.25 9.1l5.3 5.3c.33.33.5.5.7.5s.37-.17.7-.5l5.3-5.3" />
  </svg>
);
export const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={1.8}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
);
export const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={3}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const Cross = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={3}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Book = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5a1.5 1.5 0 0 0 0 3H20v1H6.5A2.5 2.5 0 0 1 4 19.5z" />
  </svg>
);
export const Question = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01" style={{ stroke: 'var(--white)' }} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);
export const Pencil = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
    <path d="M7 17l1-3 6.5-6.5 2 2L10 16z" style={{ fill: 'var(--white)' }} />
  </svg>
);
export const Link = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
    <path d="M8 8h3M8 12h3M8 16h3M13 8l3 4M13 16l3-4" style={{ stroke: 'var(--white)' }} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
/** 定位原文: the designer's location-01 pin (Ready frame 1.05 / 1.06, Figma 19834:180034) */
export const Locate = () => (
  <svg className="locate-icon" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth={1}>
    <g transform="translate(1.5 0.83)">
      <path d="M7.57878 13.4113C7.28965 13.682 6.90321 13.8333 6.50103 13.8333C6.09885 13.8333 5.7124 13.682 5.42327 13.4113C2.77563 10.9173 -0.772544 8.13128 0.957793 4.08644C1.89337 1.89944 4.13918 0.5 6.50103 0.5C8.86287 0.5 11.1087 1.89944 12.0443 4.08644C13.7724 8.12618 10.233 10.9259 7.57878 13.4113Z" />
      <path d="M8.83361 6.5C8.83361 7.78866 7.78895 8.83333 6.50028 8.83333C5.21162 8.83333 4.16695 7.78866 4.16695 6.5C4.16695 5.21134 5.21162 4.16667 6.50028 4.16667C7.78895 4.16667 8.83361 5.21134 8.83361 6.5Z" />
    </g>
  </svg>
);
/** rc/Common/Chip Icon=Flag: 标记本题 (exam mode) */
export const Flag = () => (
  <svg className="flag-icon" viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={2}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
);
export const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const ChevronRight = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
/** quiz footer 重做 (review, last question): a circular arrow */
export const Retry = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={2}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" />
  </svg>
);
/** 词汇天天练 Scan tab (#133): a stack of word cards */
export const Cards = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="6" width="14" height="16" rx="3" fill="currentColor" />
    <path d="M8 3.5h10a2.5 2.5 0 0 1 2.5 2.5v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
