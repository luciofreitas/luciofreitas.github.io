(async () => {
  const puppeteer = require('puppeteer');
  const waitOn = require('wait-on');
  const fs = require('fs');
  try {
    const port = process.env.PORT || '5174';
    await waitOn({ resources: [`http://localhost:${port}`], timeout: 30000 });
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Set a test usuario in localStorage BEFORE the page loads so the app picks it up on mount
    const testUser = { id: 'test_local_1', email: 'test@example.com', nome: 'Joao Gabriel' };
    await page.evaluateOnNewDocument((u) => { try { localStorage.setItem('usuario-logado', JSON.stringify(u)); } catch(e){} }, testUser);

    // Navigate to the app after injection
  const url = `http://localhost:${port}/#/buscar-pecas?t=${Date.now()}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait a bit for header render
    await new Promise(r => setTimeout(r, 1200));

    // Try to find the initials badge using a simpler selector
    const avatarSelector = '.user-initials-desktop, .user-initials-mobile, .user-initials';
    await page.waitForSelector(avatarSelector, { timeout: 15000 });

    // Get computed initials text and background-color
    const debug = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { found: false };
      const dataBg = el.getAttribute('data-bg');
      const attrStyle = el.getAttribute('style');
      const style = window.getComputedStyle(el);
      const varBg = style.getPropertyValue('--avatar-bg');
      return {
        found: true,
        outer: el.outerHTML,
        attrStyle: attrStyle || null,
        dataBg: dataBg || null,
        varBg: varBg || null,
        computed: style.backgroundColor || null,
        inlineStyleValue: (el && el.style) ? el.style.backgroundColor || null : null,
        text: el.textContent.trim()
      };
    }, avatarSelector);

      const buttonDebug = await page.evaluate(() => {
        const btn = document.querySelector('.user-menu-root .user-button.icon-only') || document.querySelector('.menu-login-root .user-menu-root .user-button.icon-only');
        if (!btn) return { found: false };
        const style = window.getComputedStyle(btn);
        return { found: true, outer: btn.outerHTML, computed: style.backgroundColor || null, inlineStyle: btn.getAttribute('style') };
      });

      console.log('button-debug:', JSON.stringify(buttonDebug, null, 2));

    console.log('avatar-debug:', JSON.stringify(debug, null, 2));
    const result = debug.found ? { text: debug.text, background: (debug.dataBg || debug.varBg || debug.computed) } : null;

    // Screenshot header area
    const header = await page.$('header') || (await page.$('.site-header')) || null;
    if (header) {
      const clip = await header.boundingBox();
      if (clip) {
        await page.screenshot({ path: 'e2e-avatar.png', clip, omitBackground: false });
        console.log('Saved e2e-avatar.png');
      } else {
        await page.screenshot({ path: 'e2e-avatar-full.png', fullPage: false });
        console.log('Saved e2e-avatar-full.png');
      }
    } else {
      await page.screenshot({ path: 'e2e-avatar-fallback.png', fullPage: false });
      console.log('Saved e2e-avatar-fallback.png');
    }

    await browser.close();
    console.log('avatar-result', result);
    process.exit(result ? 0 : 2);
  } catch (e) {
    console.error('avatar-e2e error', e);
    process.exit(1);
  }
})();