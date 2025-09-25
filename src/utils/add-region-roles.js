// Lightweight script that marks div[id] elements that contain a heading as accessible regions
// Adds role="region" and ariaLabelledby="heading-id" if not present.
// NonIntrusive: only runs in browser, is idempotent and safe to include in SPA.

(function addRegionRolesOnLoad() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function applyRoles() {
    try {
      const candidates = Array.from(document.querySelectorAll('div[id]'));
      candidates.forEach((el) => {
        // Skip if already annotated
        if (el.hasAttribute('role') || el.hasAttribute('aria-labelledby')) return;

        // Find a heading inside
        const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
        if (!heading) return;

        // Ensure heading has an id
        if (!heading.id) {
          const base = el.id || 'region';
          let hid = `${base}-heading`;
          let counter = 1;
          while (document.getElementById(hid)) {
            hid = `${base}-heading-${counter++}`;
          }
          heading.id = hid;
        }

        el.setAttribute('role', 'region');
        el.setAttribute('aria-labelledby', heading.id);
      });
    } catch (err) {
      // Don't break the app if something goes wrong
      // eslint-disable-next-line no-console
      console.warn('addRegionRoles: failed to apply roles', err);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(applyRoles, 0);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(applyRoles, 0));
  }

  // Re-apply after SPA navigation
  const originalPush = history.pushState;
  history.pushState = function () {
    originalPush.apply(this, arguments);
    setTimeout(applyRoles, 60);
  };
  window.addEventListener('popstate', () => setTimeout(applyRoles, 60));
})();
