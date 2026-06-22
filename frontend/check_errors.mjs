import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', exception => {
    console.log('UNCAUGHT EXCEPTION:', exception.message);
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);
  
  // Fill in login
  try {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'demo123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if vite-error-overlay exists
    const errorOverlay = await page.$('vite-error-overlay');
    if (errorOverlay) {
      const errorText = await page.evaluate(el => el.shadowRoot.innerHTML, errorOverlay);
      console.log('VITE ERROR OVERLAY:', errorText);
    }

    // Go to settings
    await page.goto('http://localhost:5173/ayarlar');
    await page.waitForTimeout(2000);
    await page.selectOption('select', 'en');
    await page.waitForTimeout(2000);
    
    const errorOverlay2 = await page.$('vite-error-overlay');
    if (errorOverlay2) {
      const errorText2 = await page.evaluate(el => el.shadowRoot.innerHTML, errorOverlay2);
      console.log('VITE ERROR OVERLAY AFTER LANG:', errorText2);
    }
  } catch(e) {}
  
  await browser.close();
})();
