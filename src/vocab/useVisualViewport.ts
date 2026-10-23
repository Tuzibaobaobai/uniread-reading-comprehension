import { useEffect } from 'react';

/**
 * On-screen keyboards (iPad / phones) shrink the visual viewport but not the layout: expose the hidden height as
 * `--kb-h` and a `kb-open` class on <html> so the quiz can pad its scroller and hide its footer while typing (#110).
 */
export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      const hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty('--kb-h', `${hidden}px`);
      root.classList.toggle('kb-open', hidden > 120);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb-h');
      root.classList.remove('kb-open');
    };
  }, []);
}

/** after the keyboard has opened, bring the focused field to the middle of its scroller */
export function centreOnFocus(e: { currentTarget: HTMLElement }) {
  const el = e.currentTarget;
  window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
}
