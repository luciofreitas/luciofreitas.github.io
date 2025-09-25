const puppeteer = require('puppeteer');

async function findAndCapture() {
  const ports = [5173, 5174, 5175, 5176];
  let browser;
  for (const port of ports) {
    const url = `http://localhost:${port}`;
    try {
      console.log(`Trying ${url}`);
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
      page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
      page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure && req.failure().errorText));
      // set a short timeout for navigation
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 }).catch(e => { throw e; });
      console.log('Loaded', url);
      // wait a bit to capture HMR/runtime warnings
      await page.waitForTimeout(3000);
      await browser.close();
      return { port, success: true };
    } catch (e) {
      if (browser) try { await browser.close(); } catch (er) {}
      console.log(`Failed ${url}: ${e.message}`);
      // try next port
    }
  }
  return { success: false };
}

findAndCapture().then(r => {
  if (!r.success) {
    console.error('Could not load dev server on any common port.');
    process.exit(2);
  } else {
    console.log('Done, port:', r.port);
    process.exit(0);
  }
}).catch(e => {
  console.error('Unexpected error:', e);
  process.exit(3);
});
