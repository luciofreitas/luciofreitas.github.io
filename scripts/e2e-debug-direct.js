const puppeteer = require('puppeteer');
(async () => {
  const port = process.env.PORT || '5174';
  const url = `http://localhost:${port}/#/guia/glossario-automotivo`;
  console.log('Opening', url);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try{
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('Page loaded, waiting for rating container...');
    await page.waitForSelector('.rating-stars-container', { timeout: 60000 });
    console.log('rating-stars-container found');
    const stars = await page.$$('.rating-stars-container .star-button');
    console.log('stars count =', stars.length);
    if(stars.length >= 5){
      await stars[4].click();
      await page.waitForTimeout(1000);
      const avg = await page.$eval('.rating-average', el => el.textContent).catch(() => null);
      const total = await page.$eval('.rating-count', el => el.textContent).catch(() => null);
      console.log('avg', avg, 'total', total);
    } else {
      console.log('Not enough stars present');
    }
    await page.screenshot({ path: 'e2e-debug-direct.png', fullPage: true });
    console.log('Saved screenshot e2e-debug-direct.png');
  }catch(e){
    console.error('Error in debug script', e);
    try{ await page.screenshot({ path: 'e2e-debug-direct-fail.png', fullPage: true }); console.log('Saved fail screenshot'); }catch(err){}
    try{ const html = await page.content(); require('fs').writeFileSync('e2e-debug-direct-fail.html', html); console.log('Saved fail HTML'); }catch(err){}
  }finally{
    await browser.close();
  }
})();
