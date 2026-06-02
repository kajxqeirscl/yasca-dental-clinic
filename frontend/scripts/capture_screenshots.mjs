// Yaşca canlı uygulama ekran görüntüsü alıcı (Playwright).
// Çalıştır (frontend dizininden):  node scripts/capture_screenshots.mjs
// App içi ekranlar için ortam değişkenleri:
//   TENANT_URL=https://yasca-dental-clinic.vercel.app/app/<slug>
//   YASCA_USER=<kullanici>  YASCA_PASS=<parola>
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const OUT = process.env.OUT || 'C:/Users/CIHAN/Desktop/Yasca_Screenshots';
const BASE = process.env.BASE || 'https://yasca-dental-clinic.vercel.app';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function snap(name, { full = false, wait = 3500 } = {}) {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log('OK  ->', name + '.png');
}
async function go(url, name, opts = {}) {
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
  catch (e) { console.log('NAV WARN', url, e.message); }
  await snap(name, opts);
}

// --- Public sayfalar (kimlik gerekmez) ---
await go(BASE + '/', '01_landing', { full: true });
await go(BASE + '/register', '02_register', {});
await go(BASE + '/login', '03_login', {});

// --- App içi (kimlik verilirse) ---
const TURL = process.env.TENANT_URL;
const U = process.env.YASCA_USER;
const P = process.env.YASCA_PASS;
if (TURL && U && P) {
  const root = TURL.replace(/\/+$/, '');
  try {
    await page.goto(root, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#username', { timeout: 20000 });
    await snap('04_clinic_login', { wait: 1500 });
    await page.fill('#username', U);
    await page.fill('#password', P);
    await page.click('button[type="submit"]');
    await page.waitForSelector('a[href$="/"]', { timeout: 20000 }).catch(() => {});
    await snap('10_dashboard', { wait: 4000 });
    for (const [path, name] of [['/hastalar', '11_hastalar'], ['/randevular', '12_randevular']]) {
      try {
        await page.goto(root + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await snap(name, { wait: 3500 });
      } catch (e) { console.log('APP NAV WARN', path, e.message); }
    }
    // ilk hastanin profili: "Detay" butonuna tikla
    try {
      await page.goto(root + '/hastalar', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const detay = page.getByRole('button', { name: /Detay/i }).first();
      if (await detay.count()) {
        await detay.click({ timeout: 8000 }).catch(() => {});
      } else {
        await page.locator('text=Detay').first().click({ timeout: 8000 }).catch(() => {});
      }
      await page.waitForTimeout(4000);
      await snap('13_hasta_profil', { wait: 1500 });
    } catch (e) { console.log('PROFILE WARN', e.message); }
  } catch (e) {
    console.log('LOGIN FAILED:', e.message, '-> sadece public sayfalar alindi.');
  }
} else {
  console.log('NOT: TENANT_URL/YASCA_USER/YASCA_PASS verilmedi -> sadece public sayfalar alindi.');
}

await browser.close();
console.log('BITTI. Cikti klasoru:', OUT);
