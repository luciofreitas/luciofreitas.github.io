const puppeteer = require('puppeteer');

async function tryPort(port) {
  const url = `http://localhost:${port}`;
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    console.log(`Trying ${url}`);

    page.on('console', msg => {
      const args = msg.args();
      Promise.all(args.map(a => a.jsonValue())).then(vals => {
        console.log('[PAGE CONSOLE]', msg.type(), ...vals);
      }).catch(() => {
        console.log('[PAGE CONSOLE]', msg.type(), msg.text());
      });
    });

    page.on('pageerror', err => console.log('[PAGE ERROR]', err && err.stack ? err.stack : err));
    page.on('requestfailed', req => console.log('[REQUEST FAILED]', req.url(), req.failure && req.failure.errorText));

    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 }).catch(e => null);
    if (!resp) {
      console.log(`No response at ${url}`);
      await browser.close();
      return false;
    }

    console.log(`Loaded ${url} - status ${resp.status()}`);

    // wait a few seconds collecting console messages
    await new Promise(resolve => setTimeout(resolve, 4000));
    await browser.close();
    return true;
  } catch (e) {
    console.log(`Error connecting to ${url}:`, e.message || e);
    return false;
  }
}

(async () => {
  const ports = [5173, 5174, 5175, 5176];
  for (const p of ports) {
    const ok = await tryPort(p);
    if (ok) process.exit(0);
  }
  console.log('No dev server found on common ports.');
  process.exit(2);
})();
