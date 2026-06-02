import { test, expect } from '@playwright/test';

/**
 * Visual Regression Suite (Faz 9)
 *
 * Her test, sayfanın görsel parmak izini alır ve __screenshots__ altındaki
 * onaylı baseline ile karşılaştırır. Fark eşiği aşılırsa test patlar ve
 * playwright-report-visual altında "expected / actual / diff" üçlüsü üretilir.
 *
 * DİNAMİK İÇERİK MASKELEME:
 * Tarih, saat, rastgele üretilen metin gibi her koşuda değişen öğeler
 * maskelenmeli (mask: [...]) yoksa snapshot sürekli "değişti" der.
 * Bu sayfalarda şimdilik dinamik içerik yok ama desen referans olsun diye
 * yorum olarak bırakıldı.
 */

test.describe('Visual Regression — Public & Auth sayfaları', () => {
  test('Public landing sayfası', async ({ page }) => {
    await page.goto('/');
    // Sayfa tam yüklensin (fontlar, görseller) — layout shift'i önler
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('public-landing.png', {
      fullPage: true,
      // mask: [page.locator('[data-dynamic]')],
    });
  });

  test('Kayıt (register) sayfası', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register.png', { fullPage: true });
  });

  test('Klinik login formu (path-based tenant)', async ({ page }) => {
    // /app/:slug → ClinicApp → oturum yoksa LoginPage render edilir
    await page.goto('/app/standard');
    // Login formunun alanı görünene kadar bekle
    await page.waitForSelector('#username', { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('clinic-login.png', { fullPage: true });
  });
});
