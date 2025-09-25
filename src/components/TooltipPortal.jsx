import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * TooltipPortal
 * Renders a tooltip into document.body and positions it relative to an anchor element.
 * Props:
 * - anchorRef: React ref pointing to the trigger element
 * - children: tooltip content
 * - visible: boolean to show/hide
 */
function TooltipPortal({ anchorRef, children, visible }) {
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!visible) return;

    function update() {
      const anchor = anchorRef && anchorRef.current;
      const tt = tooltipRef.current;
      if (!anchor || !tt) return;

      const rect = anchor.getBoundingClientRect();
      const ttRect = tt.getBoundingClientRect();

      // place above the anchor, centered horizontally
      let top = rect.top - ttRect.height - 8; // 8px gap
      let left = rect.left + rect.width / 2 - ttRect.width / 2;

      // keep inside viewport bounds with small padding
      const padding = 8;
      if (left < padding) left = padding;
      if (left + ttRect.width > window.innerWidth - padding) left = window.innerWidth - ttRect.width - padding;
      if (top < padding) top = rect.bottom + 8; // if not enough space above, show below

      setPos({ top, left });
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    // also observe changes in the tooltip size
    let ro;
    if (window.resizeObserver) {
      ro = new resizeObserver(update);
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      if (ro) ro.disconnect();
    };
  }, [visible, anchorRef]);

  if (!visible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="whatsapp-portal-tooltip-text"
      role="status"
      ariaHidden={!visible}
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
    >
      {children}
    </div>,
    document.body
  );
}

export default TooltipPortal;
