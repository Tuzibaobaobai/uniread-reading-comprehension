import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Makes a dialog modal for keyboard and screen-reader users (aria-modal alone does neither): focus moves into the
 * dialog (its autoFocus element, else the first control, else the dialog itself), Tab / Shift+Tab stay inside, Esc calls
 * onClose, everything outside the dialog is `inert` (no focus, no clicks, hidden from assistive technology) while it is
 * open, and focus returns to the element that opened it.
 */
export function useModal(ref: RefObject<HTMLElement>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // read during the first render, before the dialog's autoFocus button takes the focus
  const openerRef = useRef<HTMLElement | null | undefined>(undefined);
  if (openerRef.current === undefined) openerRef.current = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = openerRef.current ?? null;
    // inert every sibling along the path from the dialog's backdrop up to <body>
    const made: HTMLElement[] = [];
    let node: HTMLElement | null = dialog.closest<HTMLElement>('.dialog-backdrop') ?? dialog;
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sib of Array.from(parent.children) as HTMLElement[]) {
        if (sib === node || sib.inert || sib.tagName === 'SCRIPT') continue;
        sib.inert = true;
        made.push(sib);
      }
      node = parent;
    }
    if (!dialog.contains(document.activeElement)) {
      const first = dialog.querySelector<HTMLElement>('[autofocus]') ?? dialog.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
      else {
        dialog.tabIndex = -1;
        dialog.focus();
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      for (const el of made) el.inert = false;
      // after this commit (the page re-renders as the dialog closes), give focus back to what opened it
      if (opener && opener !== document.body)
        requestAnimationFrame(() => {
          if (opener.isConnected && !document.activeElement?.closest('[role="dialog"]')) opener.focus({ preventScroll: true });
        });
    };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
}
