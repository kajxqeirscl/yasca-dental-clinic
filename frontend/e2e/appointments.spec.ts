import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * RANDEVU YÖNETİMİ TESTLERİ
 * Endpoints: GET/POST/PUT/PATCH/DELETE /api/appointments/
 *            GET /api/doctors/
 * Frontend: AppointmentCalendar, AppointmentDialog, AppointmentDetailDialog
 */

test.describe('Randevu Takvimi', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await page.click('a[href="/randevular"]');
    await expect(page.locator('h2:has-text("Randevu Takvimi")')).toBeVisible({ timeout: 10000 });
  });

  test('Takvim sayfası yüklenmeli ve temel elemanlar görünmeli', async ({ page }) => {
    await expect(page.locator('button:has-text("Yeni Randevu")')).toBeVisible();
    await expect(page.locator('button:has-text("Bugün")')).toBeVisible();
  });

  test('Günlük görünüme geçilmeli', async ({ page }) => {
    await page.click('button:has-text("Günlük")');
    await expect(page.locator('button:has-text("Bugün")')).toBeVisible();
  });

  test('Haftalık görünüme geçilmeli', async ({ page }) => {
    await page.click('button:has-text("Haftalık")');
    await expect(page.locator('th:has-text("Saat")')).toBeVisible();
  });

  test('Önceki/sonraki hafta/gün navigasyonu çalışmalı', async ({ page }) => {
    // İleri butonu (ChevronRight)
    const nextButton = page.locator('button:has(svg.lucide-chevron-right)');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
    // Bugün butonuna dön
    await page.click('button:has-text("Bugün")');
  });

  test('Takvimde boş slota tıklayınca diyalog açılmalı', async ({ page }) => {
    await page.click('button:has-text("Haftalık")');
    await expect(page.locator('th:has-text("Saat")')).toBeVisible({ timeout: 5000 });
    await page.locator('table tbody tr:first-child td:nth-child(2)').click();
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Randevu Diyaloğu', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await page.click('a[href="/randevular"]');
    await expect(page.locator('h2:has-text("Randevu Takvimi")')).toBeVisible({ timeout: 10000 });
  });

  test('"Yeni Randevu" butonu ile diyalog açılmalı', async ({ page }) => {
    await page.click('button:has-text("Yeni Randevu")');
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#patient-search')).toBeVisible();
    await expect(page.locator('#doctor')).toBeVisible();
    await expect(page.locator('#notes')).toBeVisible();
  });

  test('Randevu diyaloğunda tarih ve saat alanları görünmeli', async ({ page }) => {
    await page.click('button:has-text("Yeni Randevu")');
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder="GG.AA.YYYY"], input[placeholder="MM/DD/YYYY"]')).toBeVisible();
    // Saat seçimi - select elementi
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('Eksik alanlarla randevu kaydedilememeli', async ({ page }) => {
    await page.click('button:has-text("Yeni Randevu")');
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Kaydet")');
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
  });

  test('Hasta arama autocomplete çalışmalı', async ({ page }) => {
    await page.click('button:has-text("Yeni Randevu")');
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeVisible({ timeout: 5000 });
    await page.fill('#patient-search', 'Mustafa');
    // Dropdown açılmalı - sonuçlar görünmeli
    await expect(page.locator('button:has-text("Mustafa")').first()).toBeVisible({ timeout: 5000 });
  });

  test('İptal butonu diyaloğu kapatmalı', async ({ page }) => {
    await page.click('button:has-text("Yeni Randevu")');
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("İptal")');
    await expect(page.locator('text=Yeni Randevu Ekle')).toBeHidden({ timeout: 5000 });
  });
});
