const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

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
export const Locate = () => (
  <svg viewBox="0 0 24 24" aria-hidden {...s} strokeWidth={2}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);
