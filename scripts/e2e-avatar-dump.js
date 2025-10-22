(async () => {
  const puppeteer = require('puppeteer');
  const waitOn = require('wait-on');
  try {
    const port = process.env.PORT || '5174';
    await waitOn({ resources: [`http://localhost:${port}`], timeout: 30000 });
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const testUser = { id: 'test_local_1', email: 'test@example.com', nome: 'Joao Gabriel' };
    await page.evaluateOnNewDocument((u) => { try { localStorage.setItem('usuario-logado', JSON.stringify(u)); } catch(e){} }, testUser);
  const url = `http://localhost:${port}/#/buscar-pecas?t=${Date.now()}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));
    const sel = '.user-initials-desktop, .user-initials-mobile, .user-initials';
    const nodes = await page.evaluate((s) => {
      const list = Array.from(document.querySelectorAll(s));
      return list.map(el => ({ nodeName: el.nodeName, outer: el.outerHTML, text: el.textContent.trim() }));
    }, sel);
    console.log('matches:', JSON.stringify(nodes, null, 2));
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('dump error', e);
    process.exit(2);
  }
})();
