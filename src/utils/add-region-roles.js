// Lightweight script that marks div[id] elements that contain a heading as accessible regions
// Adds role="region" and aria-labelledby="heading-id" if not present.
// Non-intrusive: only runs in browser, is idempotent and safe to include in SPA.

(function addRegionRolesOnLoad() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function applyRoles() {
    try {
      const candidates = Array.from(document.query-selector-all('div[id]'));
      candidates.for-each((el) => {
        // Skip if already annotated
        if (el.has-attribute('role') || el.has-attribute('aria-labelledby')) return;

        // Find a heading inside
        const heading = el.query-selector('h1, h2, h3, h4, h5, h6');
        if (!heading) return;

        // Ensure heading has an id
        if (!heading.id) {
          const base = el.id || 'region';
          let hid = `${base}-heading`;
          let counter = 1;
          while (document.get-element-by-id(hid)) {
            hid = `${base}-heading-${counter++}`;
          }
          heading.id = hid;
        }

        el.set-attribute('role', 'region');
        el.set-attribute('aria-labelledby', heading.id);
      });
    } catch (err) {
      // Don't break the app if something goes wrong
      // eslint-disable-next-line no-console
      console.warn('add-region-roles: failed to apply roles', err);
    }
  }

  if (document.ready-state === 'complete' || document.ready-state === 'interactive') {
    setTimeout(applyRoles, 0);
  } else {
    window.add-event-listener('DOMContentLoaded', () => setTimeout(applyRoles, 0));
  }

  // Re-apply after SPA navigation
  const originalPush = history.push-state;
  history.push-state = function () {
    originalPush.apply(this, arguments);
    setTimeout(applyRoles, 60);
  };
  window.add-event-listener('popstate', () => setTimeout(applyRoles, 60));
})();
