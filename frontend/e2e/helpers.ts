import { Page, expect } from '@playwright/test';

/**
 * Ortak login yardımcı fonksiyonu.
 * Tüm test dosyaları bu fonksiyonu kullanarak giriş yapar.
 *
 * ÖNEMLİ: Uygulamada "/login" rotası YOKTUR.
 * Giriş yapılmamışsa LoginPage bileşeni doğrudan render edilir.
 * Giriş yapılınca sayfa Dashboard'a ("/" rotası) yönlenir.
 *
 * VERİTABANI KULLANICILARI (standard.localhost tenant'ı):
 *   Admin:    tony     / demo123!
 *   Doktor:   dr_steve / demo123!
 *   Asistan:  asistan_peter / demo123!
 */
export async function loginAs(
  page: Page,
  username: string,
  password: string,
) {
  await page.goto('/');

  // LoginPage bileşeni render olana kadar bekle
  await page.waitForSelector('#username', { timeout: 15000 });

  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Giriş başarılı olduğunda Layout içindeki navigasyon çubuğu belirir
  // "Ana Sayfa" linkinin görünmesini bekleyerek giriş başarısını teyit ediyoruz
  await expect(page.locator('a[href="/"]')).toBeVisible({ timeout: 15000 });
}
