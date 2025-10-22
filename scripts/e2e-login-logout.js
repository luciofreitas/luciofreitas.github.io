const puppeteer = require('puppeteer');
const fs = require('fs');

// Small helper to wait for a short timeout
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const port = process.env.PORT || '5174';
  const base = process.env.APP_URL || `http://localhost:${port}`;
  const url = `${base}/#/login`;
  console.log('Opening', url);

  // wait for the app to be reachable (avoid ERR_CONNECTION_REFUSED)
  async function waitForServer(url, timeoutMs = 30000, intervalMs = 500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res && (res.status === 200 || res.status === 204 || res.status === 301 || res.status === 302)) return true;
      } catch (e) {
        // ignore and retry
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error('Timed out waiting for server ' + url);
  }

  // ensure the root URL responds before launching Puppeteer
  const rootUrl = base + '/';
  console.log('Waiting for server at', rootUrl);
  try {
    await waitForServer(rootUrl, 30000, 500);
  } catch (err) {
    console.warn('Server did not become ready in time:', err && err.message ? err.message : err);
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Ensure we are on the login page and wait a moment for client scripts to render the buttons
    console.log('Ensuring on /#/login and waiting for UI to render...');
    await page.goto(`${base}/#/login`, { waitUntil: 'networkidle0' });
    await (page.waitForTimeout ? page.waitForTimeout(800) : new Promise(r => setTimeout(r, 800)));

    // Attempt to click a Google login button. Try several common labels.
    const googleSelectors = [
      'button.google-signin',
      'button:has(span:contains("Google"))',
      'button:has(svg[aria-label="google"])',
      'button[title*="Google"]',
      'button:contains("Entrar com Google" )',
      'button:contains("Google")'
    ];

  // Prefer explicit selector for the Google button when available
  // Wait for the Google button to appear (best-effort)
  try { await page.waitForSelector('.google-btn, .google-btn-round, button[aria-label="Entrar com Google"]', { timeout: 10000 }); } catch(e) { console.warn('Google selector did not appear in time'); }
  // Robust click helper executed inside the page context
  const clickedGoogle = await page.evaluate(() => {
      function robustClick(el){
        try{
          el.scrollIntoView({block: 'center', inline: 'center'});
          el.focus();
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width/2;
          const y = rect.top + rect.height/2;
          const ev = new MouseEvent('click', { bubbles:true, cancelable:true, view: window, clientX: x, clientY: y });
          el.dispatchEvent(ev);
          return true;
        }catch(e){return false;}
      }
      const sel = document.querySelector('.google-btn, .google-btn-round, button[aria-label="Entrar com Google"]');
      if (sel) return robustClick(sel);
      return false;
    });
    if (clickedGoogle) console.log('Clicked Google login button (via explicit selector)');
    else {
      console.warn('Google login button not found or click failed, aborting login step');
      throw new Error('Google login button not found');
    }

    // Wait for auth flow to complete. This is app-specific: wait for a user avatar or menu.
    console.log('Waiting for user avatar/menu to appear...');
    await page.waitForFunction(() => {
      return !!(document.querySelector('.user-menu-root') || document.querySelector('.menu-usuario') || document.querySelector('[data-usuario-logado]'));
    }, { timeout: 60000 });

    console.log('Detected logged-in UI');

    // Check localStorage was set
    const stored = await page.evaluate(() => localStorage.getItem('usuario-logado'));
    console.log('localStorage usuario-logado present?', !!stored);

    // Now perform logout via the user menu
    console.log('Opening user menu and clicking Sair...');
    // Try to open user menu via robust click inside page
    const openedMenu = await page.evaluate(() => {
      function robustClick(el){
        try{ el.scrollIntoView({block:'center'}); el.focus(); el.click(); return true;}catch(e){return false}
      }
      const sel = document.querySelector('.user-menu-root button, .user-button, .user-menu-root .user-button');
      if (sel) return robustClick(sel);
      return false;
    });
    if (openedMenu) await new Promise(r => setTimeout(r, 500));

    // Click logout item
    const logoutButton = await page.evaluateHandle(() => {
      const candidates = Array.from(document.querySelectorAll('button, a'));
      for (const c of candidates) {
        const t = (c.textContent || '').toLowerCase();
        if (t.includes('sair') || t.includes('logout') || t.includes('sign out')) return c;
      }
      return null;
    });

    // Click logout inside page context to avoid ElementHandle click issues
    const clickedLogout = await page.evaluate(() => {
      function robustClick(el){
        try{ el.scrollIntoView({block:'center', inline:'center'}); el.focus(); el.click(); return true;}catch(e){return false}
      }
      const candidates = Array.from(document.querySelectorAll('button, a'));
      for (const c of candidates) {
        const t = (c.textContent || '').toLowerCase();
        if (t.includes('sair') || t.includes('logout') || t.includes('sign out')) {
          if (robustClick(c)) return true; else return false;
        }
      }
      return false;
    });
    if (clickedLogout) console.log('Clicked logout (via page.evaluate)');
    else {
      console.warn('Logout button not found or click failed');
      // dump potential candidates for debugging
      const candidates = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, a')).map(el => ({ text: (el.textContent||'').trim(), class: el.className }));
      });
      console.log('Logout candidates dump:', JSON.stringify(candidates.slice(0,40), null, 2));
    }

    // Wait shortly for logout to propagate (use fallback)
    await (page.waitForTimeout ? page.waitForTimeout(1500) : new Promise(r => setTimeout(r, 1500)));

    // Verify localStorage cleared
    const storedAfter = await page.evaluate(() => localStorage.getItem('usuario-logado'));
    console.log('localStorage usuario-logado after logout?', !!storedAfter);

    // Best-effort provider session checks inside page context (Firebase & Supabase)
    const providerStatus = await page.evaluate(() => {
      const out = { firebase: null, supabase: null };
      try {
        // Firebase modular SDK: window.firebase (legacy) or window.__FIREBASE__ (app-specific)
        if (window.firebase && firebase.auth && typeof firebase.auth === 'function') {
          out.firebase = !!(firebase.auth().currentUser);
        }
      } catch (e) { out.firebase = 'unknown'; }

      try {
        // Supabase: check for window.__SUPABASE_CLIENT or window.supabase
        const s = window.__SUPABASE_CLIENT || window.supabase;
        if (s && s.auth && typeof s.auth.getSession === 'function') {
          // getSession may be async but some clients expose it
          // we attempt synchronous inspection if possible
          out.supabase = 'unknown-sync';
        } else if (s && s.auth && typeof s.auth.session === 'function') {
          try { out.supabase = !!s.auth.session(); } catch(e) { out.supabase = 'unknown'; }
        }
      } catch (e) { out.supabase = 'unknown'; }

      return out;
    });

    console.log('Provider status (best-effort):', providerStatus);

    await page.screenshot({ path: 'e2e-login-logout.png', fullPage: true });
    console.log('Saved screenshot e2e-login-logout.png');

    // Write a small result file
    const result = {
      url: base,
      storedBefore: !!stored,
      storedAfter: !!storedAfter,
      providerStatus
    };
    fs.writeFileSync('e2e-login-logout-result.json', JSON.stringify(result, null, 2));
    console.log('Wrote e2e-login-logout-result.json');

  } catch (err) {
    console.error('E2E login-logout failed', err && err.stack ? err.stack : err);
    try { await page.screenshot({ path: 'e2e-login-logout-fail.png', fullPage: true }); } catch(e){}
  } finally {
    await browser.close();
  }

})();
