import { useEffect } from 'react';

// Lightweight focus trap hook
// - active: boolean that indicates whether the trap should be enabled
// - containerRef: ref to the modal container element
export default function useFocusTrap(active, containerRef) {
  useEffect(() => {
    if (!active) return undefined;

    const prevActive = document.activeElement;
    const container = containerRef?.current;
    if (!container) return undefined;

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
        // filter out elements that are visually hidden or not in the layout
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
    }

    const focusable = getFocusableElements();

    // If there's at least one focusable element, focus the first; otherwise focus the container
    if (focusable.length) {
      focusable[0].focus();
    } else if (container.tabIndex < 0) {
      // ensure container is focusable so keyboard users can reach it
      container.tabIndex = -1;
      container.focus();
    } else {
      container.focus();
    }

    function onKeyDown(e) {
      if (e.key !== 'Tab') return;

      const items = getFocusableElements();
      if (items.length === 0) {
        // no focusable elements, nothing to do
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

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // restore previous focus if possible
      try {
        if (prevActive && typeof prevActive.focus === 'function') prevActive.focus();
      } catch (err) {
        // ignore
      }
    };
  }, [active, containerRef]);
}
