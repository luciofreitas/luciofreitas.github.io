(async () => {
  const puppeteer = require('puppeteer');
  const waitOn = require('wait-on');
  try {
  const portToUse = process.env.PORT || process.env.REACT_APP_PORT || '5174';
  const resources = [`http://localhost:${portToUse}`];
  await waitOn({ resources, timeout: 30000 });
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
  // Try the common HashRouter variants: '#/guias' (preferred) and '#!/guias' (legacy)
  const tryPaths = [`#/guias`, `#!/guias`];
  let navigated = false;
  for (const p of tryPaths) {
    try {
      await page.goto(`http://localhost:${portToUse}/#${p.replace(/^#/, '')}`, { waitUntil: 'networkidle0', timeout: 30000 });
      navigated = true;
      break;
    } catch (e) {
      // try next
    }
  }
  if (!navigated) {
    // last attempt: try the plain root and let client routing handle it
    await page.goto(`http://localhost:${portToUse}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  }
  // wait for guias list wrapper first
  await page.waitForSelector('.page-title', { timeout: 20000 }).catch(() => null);
  await page.waitForSelector('.guias-grid', { timeout: 30000 }).catch(() => null);
  // try to click the first available 'Ver guia completo' CTA
  try {
    await page.waitForSelector('.guias-grid .guia-card .guia-cta', { timeout: 15000 });
    await page.evaluate(() => { const el = document.querySelector('.guias-grid .guia-card .guia-cta'); if(el) el.click(); });
  } catch (err) {
    // Fallback: open a known guia directly (glossario-automotivo) and continue
    console.warn('CTA selector not found, navigating directly to a known guia route as fallback');
    await page.goto(`http://localhost:${portToUse}/#/guia/glossario-automotivo`, { waitUntil: 'networkidle0', timeout: 20000 });
    try { await page.screenshot({ path: 'e2e-debug-initial.png', fullPage: true }); console.log('Saved e2e-debug-initial.png'); } catch(e){ console.warn('initial screenshot failed', e && e.message ? e.message : e); }
  }
  // Portable sleep to support different puppeteer versions
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  await sleep(1000);
    // wait for rating stars
  await page.waitForSelector('.rating-stars-container', { timeout: 30000 });
  // click 5th star and read average/total (scope to container)
  const stars = await page.$$('.rating-stars-container .star-button');
    if (stars.length >= 5) {
  await stars[4].click();
  await sleep(800);
      console.log('Clicked 5th star');
      const avg = await page.$eval('.rating-average', el => el.textContent).catch(() => null);
      const total = await page.$eval('.rating-count', el => el.textContent).catch(() => null);
      console.log('avg', avg, 'total', total);
    } else {
      console.log('Not enough stars found:', stars.length);
    }
    await browser.close();
    process.exit(0);
  } catch (e) {
      try {
        if (typeof page !== 'undefined' && page) {
          try { await page.screenshot({ path: 'e2e-debug.png', fullPage: true }); console.log('Saved e2e-debug.png'); } catch (s) { console.warn('Screenshot failed', s && s.message ? s.message : s); }
          try { const html = await page.content(); require('fs').writeFileSync('e2e-debug.html', html); console.log('Saved e2e-debug.html'); } catch (w) { console.warn('Save HTML failed', w && w.message ? w.message : w); }
        }
      } catch (dbgErr) {
        console.warn('Debug capture failed', dbgErr && dbgErr.message ? dbgErr.message : dbgErr);
      }
      console.error('E2E error', e);
      process.exit(1);
  }
})();
