// Yaşca — Canlı site ekran görüntüsü yakalama (rapor için)
// Kullanım: cd frontend ; node capture_screenshots.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'https://yasca-dental-clinic.vercel.app';
const SLUG = 'aliure';
const APP = `${BASE}/app/${SLUG}`;
const USER = 'ureali90@gmail.com';
const PASS = 'leoMessi30';

const shot = async (page, name) => {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log('  saved:', name);
};

const safe = async (label, fn) => {
  try { await fn(); console.log('OK   ', label); }
  catch (e) { console.log('FAIL ', label, '-', e.message); }
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'tr-TR' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  // 0) Public tanıtım sayfası
  await safe('public-landing', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await shot(page, '00_public_landing');
  });

  // 1) Login sayfası (Render uyanana kadar uzun bekleyebilir)
  await safe('login-page', async () => {
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.waitForSelector('#username', { timeout: 120000 });
    await page.waitForTimeout(1500);
    await shot(page, '01_login');
  });

  // 2) Giriş yap
  await safe('login-submit', async () => {
    await page.fill('#username', USER);
    await page.fill('#password', PASS);
    await page.click('button[type="submit"]');
    await page.waitForSelector('#password', { state: 'detached', timeout: 120000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await shot(page, '02_dashboard');
  });

  // 3) Randevu takvimi
  await safe('appointments', async () => {
    await page.goto(`${APP}/randevular`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await shot(page, '03_randevular');
  });

  // 4) Hasta listesi
  await safe('patients', async () => {
    await page.goto(`${APP}/hastalar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await shot(page, '04_hastalar');
  });

  // 5) Hasta profili + Odontogram (ilk hastaya tıkla)
  await safe('patient-profile', async () => {
    await page.goto(`${APP}/hastalar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const link = page.locator('a[href*="/hasta/"]').first();
    if (await link.count()) {
      await link.click();
    } else {
      await page.locator('tr, [role="row"], .cursor-pointer').first().click();
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3500);
    await shot(page, '05_hasta_profili');
    try {
      const ot = page.getByText(/odontogram|diş şeması|tedavi/i).first();
      if (await ot.count()) { await ot.click(); await page.waitForTimeout(2000); }
    } catch {}
    await shot(page, '06_odontogram');
  });

  // 6) Tedavi türleri
  await safe('treatment-types', async () => {
    await page.goto(`${APP}/tedavi-turleri`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await shot(page, '07_tedavi_turleri');
  });

  // 7) Klinik ayarları
  await safe('settings', async () => {
    await page.goto(`${APP}/ayarlar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await shot(page, '08_ayarlar');
  });

  await browser.close();
  console.log('DONE. Output:', OUT);
})();
