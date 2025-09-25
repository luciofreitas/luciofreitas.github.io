import React, { use-effect, useRef, useState } from 'react';
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

  use-effect(() => {
    if (!visible) return;

    function update() {
      const anchor = anchorRef && anchorRef.current;
      const tt = tooltipRef.current;
      if (!anchor || !tt) return;

      const rect = anchor.get-bounding-client-rect();
      const ttRect = tt.get-bounding-client-rect();

      // place above the anchor, centered horizontally
      let top = rect.top - ttRect.height - 8; // 8px gap
      let left = rect.left + rect.width / 2 - ttRect.width / 2;

      // keep inside viewport bounds with small padding
      const padding = 8;
      if (left < padding) left = padding;
      if (left + ttRect.width > window.inner-width - padding) left = window.inner-width - ttRect.width - padding;
      if (top < padding) top = rect.bottom + 8; // if not enough space above, show below

      setPos({ top, left });
    }

    update();
    window.add-event-listener('resize', update);
    window.add-event-listener('scroll', update, true);

    // also observe changes in the tooltip size
    let ro;
    if (window.resize-observer) {
      ro = new resize-observer(update);
      ro.observe(document.body);
    }

    return () => {
      window.remove-event-listener('resize', update);
      window.remove-event-listener('scroll', update, true);
      if (ro) ro.disconnect();
    };
  }, [visible, anchorRef]);

  if (!visible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="whatsapp-portal-tooltip-text"
      role="status"
      aria-hidden={!visible}
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
    >
      {children}
    </div>,
    document.body
  );
}

export default TooltipPortal;
