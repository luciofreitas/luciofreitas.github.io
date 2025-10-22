const puppeteer = require('puppeteer');

(async () => {
  const port = process.env.PORT || '5174';
  const base = process.env.APP_URL || `http://localhost:${port}`;
  const url = `${base}/#/login`;
  console.log('Opening', url);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout ? await page.waitForTimeout(800) : await new Promise(r=>setTimeout(r,800));
    const items = await page.evaluate(() => {
      const out = [];
      const nodes = Array.from(document.querySelectorAll('button, a, input'));
      for (const n of nodes) {
        const text = (n.textContent || n.getAttribute('aria-label') || n.value || '').trim();
        const tag = n.tagName.toLowerCase();
        const cls = n.className || '';
        let html = n.outerHTML || n.innerHTML || '';
        if (html.length > 240) html = html.slice(0,240) + '...';
        out.push({ tag, text, class: cls, html });
      }
      return out;
    });
    console.log('Found elements (first 80):');
    console.log(JSON.stringify(items.slice(0,80), null, 2));
  } catch (e) {
    console.error('Failed to list elements', e && e.stack ? e.stack : e);
  } finally {
    await browser.close();
  }
})();
