import { useEffect } from 'react';

// FocusTrap with support for stacked modals.
// Maintains a global stack so only the topmost modal traps focus and
// focus is restored correctly when modals are closed in LIFO order.

const globalModalStack = [];

export default function useFocusTrap(active, containerRef) {
  useEffect(() => {
    const container = containerRef?.current;
    if (!active || !container) return undefined;

    const prevActive = document.activeElement;

    // push to stack
    globalModalStack.push({ container, prevActive });

    const focusableSelector = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(',');

    function getFocusableElements() {
      return Array.from(container.querySelectorAll(focusableSelector)).filter((el) => {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
    }

    function focusInitial() {
      const focusable = getFocusableElements();
      if (focusable.length) {
        focusable[0].focus();
      } else {
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        container.focus();
      }
    }

    // Only the top of the stack should trap keys
    function isTopModal() {
      const top = globalModalStack[globalModalStack.length - 1];
      return top && top.container === container;
    }

    function onKeyDown(e) {
      if (!isTopModal()) return;
      if (e.key !== 'Tab') return;

      const items = getFocusableElements();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    focusInitial();
    document.addEventListener('keydown', onKeyDown);

    return () => {
      // remove from stack (only the first matching container from top)
      for (let i = globalModalStack.length - 1; i >= 0; i--) {
        if (globalModalStack[i].container === container) {
          const removed = globalModalStack.splice(i, 1)[0];
          // try restore focus from the removed entry
          try {
            if (removed.prevActive && typeof removed.prevActive.focus === 'function') removed.prevActive.focus();
          } catch (err) {
            // ignore
          }
          break;
        }
      }

      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active, containerRef]);
}
