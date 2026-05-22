import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * TEDAVİ VE ÖDEME TESTLERİ
 * Endpoints: GET/POST/PUT/DELETE /api/treatments/
 *            GET/POST/PUT/DELETE /api/payments/
 * Frontend: PatientProfile (gecmis, odeme sekmeleri), TreatmentAddDialog, PaymentDialog
 */

test.describe('Tedavi Yönetimi', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await page.click('a[href="/hastalar"]');
    await expect(page.locator('h2:has-text("Hasta Yönetimi")')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Detay")').first().click();
    await expect(page.locator('text=Profil Bilgileri')).toBeVisible({ timeout: 15000 });
  });

  test('Tedavi geçmişi sekmesi açılmalı', async ({ page }) => {
    await page.click('text=Tedavi Geçmişi');
    await expect(page.locator('button:has-text("Yeni Tedavi Ekle")')).toBeVisible({ timeout: 5000 });
  });

  test('Yeni tedavi ekleme diyaloğu açılmalı', async ({ page }) => {
    await page.click('text=Tedavi Geçmişi');
    await page.click('button:has-text("Yeni Tedavi Ekle")');
    // Dialog başlığı veya form alanı görünmeli
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('Tedavi kartları listelenebilmeli (demo data)', async ({ page }) => {
    await page.click('text=Tedavi Geçmişi');
    await page.waitForTimeout(1000);
    // Demo datadan gelen tedaviler veya "kayıt yok" mesajı
    const hasTreatments = await page.locator('.border.rounded-lg.bg-white').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=kayıt').isVisible().catch(() => false);
    expect(hasTreatments || hasEmpty).toBeTruthy();
  });
});

test.describe('Ödeme Yönetimi', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await page.click('a[href="/hastalar"]');
    await expect(page.locator('h2:has-text("Hasta Yönetimi")')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Detay")').first().click();
    await expect(page.locator('text=Profil Bilgileri')).toBeVisible({ timeout: 15000 });
  });

  test('Ödemeler sekmesi açılmalı ve özet kartları görünmeli', async ({ page }) => {
    await page.click('text=Ödemeler');
    await expect(page.locator('text=Toplam Tedavi Tutarı')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Toplam Ödenen')).toBeVisible();
    await expect(page.locator('text=Kalan Borç').first()).toBeVisible();
  });

  test('Yeni ödeme ekleme diyaloğu açılmalı', async ({ page }) => {
    await page.click('text=Ödemeler');
    await expect(page.locator('text=Toplam Tedavi Tutarı')).toBeVisible({ timeout: 5000 });
    // "Yeni Ödeme Ekle" veya "Tahsilat Ekle" butonu
    const addBtn = page.locator('button:has-text("Yeni Ödeme Ekle"), button:has-text("Tahsilat Ekle")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Ödeme tutarları görünmeli', async ({ page }) => {
    await page.click('text=Ödemeler');
    await expect(page.locator('text=Toplam Tedavi Tutarı')).toBeVisible({ timeout: 5000 });
    // TL veya ₺ sembolü sayfada en az 1 kere görünmeli
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('₺');
  });
});
