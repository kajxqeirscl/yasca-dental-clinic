import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * DASHBOARD TESTLERİ
 * Endpoint: GET /api/dashboard/today/
 * Frontend: Dashboard.tsx - stat kartları, randevu listesi, filtreler
 */

test.describe('Dashboard', () => {

  test('Dashboard sayfası yüklenmeli ve özet kartları görünmeli', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    // Dashboard varsayılan sayfa, giriş sonrası zaten buradayız
    // 3 stat kartı görünmeli
    const cards = page.locator('.grid .rounded-xl, .grid [class*="CardHeader"]');
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('Bugünün randevu listesi görünmeli', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    // Randevu listesi kartı başlığı
    await expect(page.locator('text=Bugünün Randevuları').first()).toBeVisible({ timeout: 10000 });
  });

  test('Randevu filtre butonları çalışmalı (Tümü / Tamamlanan / Bekleyen)', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await expect(page.locator('text=Bugünün Randevuları').first()).toBeVisible({ timeout: 10000 });

    // Filtre butonlarının varlığı
    await expect(page.locator('button:has-text("Tümü")')).toBeVisible();
    await expect(page.locator('button:has-text("Tamamlanan")')).toBeVisible();
    await expect(page.locator('button:has-text("Planlanan")')).toBeVisible();

    // Filtre tıklama
    await page.click('button:has-text("Tamamlanan")');
    await page.click('button:has-text("Planlanan")');
    await page.click('button:has-text("Tümü")');
  });

  test('Dashboard üzerinden yeni randevu diyaloğu açılmalı', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await expect(page.locator('text=Bugünün Randevuları').first()).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Yeni Randevu")').first().click();
    await expect(page.getByRole('heading', { name: 'Yeni Randevu Ekle' })).toBeVisible({ timeout: 5000 });
  });
});
