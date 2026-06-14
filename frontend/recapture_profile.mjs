import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'docs', 'screenshots');

const BASE = 'https://yasca-dental-clinic.vercel.app';
const APP = `${BASE}/app/aliure`;

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'tr-TR' })).newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  await page.goto(APP, { waitUntil: 'networkidle' });
  await page.waitForSelector('#username');
  await page.fill('#username', 'ureali90@gmail.com');
  await page.fill('#password', 'leoMessi30');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#password', { state: 'detached' });
  await page.waitForLoadState('networkidle');

  // Hastalar -> ilk Detay
  await page.goto(`${APP}/hastalar`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /detay/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, '05_hasta_profili.png'), fullPage: true });
  console.log('saved 05_hasta_profili');

  // Odontogram sekmesi (localStorage ile garanti)
  await page.evaluate(() => localStorage.setItem('patientProfileActiveTab', 'odontogram'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, '06_odontogram.png'), fullPage: true });
  console.log('saved 06_odontogram');

  // Tedavi/randevu geçmişi sekmesi (bonus)
  await page.evaluate(() => localStorage.setItem('patientProfileActiveTab', 'gecmis'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, '09_tedavi_gecmisi.png'), fullPage: true });
  console.log('saved 09_tedavi_gecmisi');

  await browser.close();
  console.log('DONE');
})();
