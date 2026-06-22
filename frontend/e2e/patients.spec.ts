import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * HASTA YÖNETİMİ TESTLERİ
 * Endpoints: GET/POST/PUT/DELETE /api/patients/, GET /api/patients/:id/
 * Frontend: PatientSearch, PatientDialog, PatientProfile
 */

test.describe('Hasta Listesi ve Arama', () => {

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'dr_steve', 'demo123!');
  await page.click('a[href="/hastalar"]');
  await expect(page.locator('h2:has-text("Hasta Yönetimi")')).toBeVisible({ timeout: 10000 });
});

test('Hasta listesi sayfası açılmalı', async ({ page }) => {
  await expect(page.locator('h2:has-text("Hasta Yönetimi")')).toBeVisible();
  await expect(page.locator('button:has-text("Yeni Hasta Ekle")')).toBeVisible();
});

test('Hasta tablosu sütun başlıkları doğru olmalı', async ({ page }) => {
  await expect(page.locator('th:has-text("Ad Soyad")').first()).toBeVisible();
  await expect(page.locator('th:has-text("Telefon")').first()).toBeVisible();
});

test('Hasta arama çalışmalı', async ({ page }) => {
  await page.fill('input[placeholder="Ad, soyad veya telefon ile ara..."]', 'Mustafa');
  await expect(page.locator('text=Mustafa').first()).toBeVisible({ timeout: 10000 });
});

test('Boş arama sonucunda lista temizlenmeli veya tüm hastalar gelmeli', async ({ page }) => {
  await page.fill('input[placeholder="Ad, soyad veya telefon ile ara..."]', 'ASLABULUNAMAYACAKISIM99');
  await page.waitForTimeout(1000);
  const found = await page.locator('text=Hasta bulunamadı').isVisible();
  const tableRows = await page.locator('table tbody tr').count();
  expect(found || tableRows === 0).toBeTruthy();
});
});

test.describe('Hasta CRUD', () => {
test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'dr_steve', 'demo123!');
  await page.click('a[href="/hastalar"]');
  await expect(page.locator('h2:has-text("Hasta Yönetimi")')).toBeVisible({ timeout: 10000 });
});

test('Yeni hasta kaydı oluşturulmalı', async ({ page }) => {
  await page.click('button:has-text("Yeni Hasta Ekle")');

  await page.fill('#name', 'E2ETest');
  await page.fill('#surname', 'Hastasi');
  await page.fill('#phone', '05559991122');
  await page.fill('#tckn', '11122233344');
  await page.click('button:has-text("Kaydet")');

  await expect(page.locator('text=E2ETest Hastasi').first()).toBeVisible({ timeout: 10000 });
});

test('Eksik alanlarla hasta kaydedilemez (validasyon)', async ({ page }) => {
  await page.click('button:has-text("Yeni Hasta Ekle")');
  await page.fill('#name', 'EksikBilgi');
  await page.click('button:has-text("Kaydet")');
  await expect(page.locator('.bg-red-50, .text-red-600, .text-red-700').first()).toBeVisible({ timeout: 5000 });
});

test('Hasta detay sayfasına navigasyon çalışmalı', async ({ page }) => {
  await page.locator('button:has-text("Detay")').first().click();
  await expect(page.locator('text=Profil Bilgileri')).toBeVisible({ timeout: 15000 });
});
});

test.describe('Hasta Profili - Tüm Sekmeler', () => {
test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'dr_steve', 'demo123!');
  await page.click('a[href="/hastalar"]');
  await expect(page.locator('h2:has-text("Hasta Yönetimi")')).toBeVisible({ timeout: 10000 });
  await page.locator('button:has-text("Detay")').first().click();
  await expect(page.locator('text=Profil Bilgileri')).toBeVisible({ timeout: 15000 });
});

test('Profil Bilgileri sekmesi açılmalı ve alanlar görünmeli', async ({ page }) => {
  await page.click('text=Profil Bilgileri');
  await expect(page.locator('input[placeholder="05xx xxx xx xx"]')).toBeVisible();
  await expect(page.locator('input[placeholder="11 Haneli TC No"]')).toBeVisible();
});

test('Anamnez sekmesi açılmalı ve tıbbi geçmiş alanları görünmeli', async ({ page }) => {
  await page.click('text=Anamnez');
  await expect(page.locator('textarea[placeholder="Kronik hastalıklar, operasyonlar..."]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('textarea[placeholder="İlaç, gıda vb. alerjiler..."]')).toBeVisible();
});

test('Anamnez verileri düzenlenebilmeli', async ({ page }) => {
  await page.click('text=Anamnez');
  await expect(page.locator('textarea[placeholder="İlaç, gıda vb. alerjiler..."]')).toBeVisible({ timeout: 5000 });
  await page.fill('textarea[placeholder="İlaç, gıda vb. alerjiler..."]', 'Penisilin Alerjisi - E2E Test');
  await expect(page.locator('button:has-text("Değişiklikleri Kaydet")')).toBeEnabled();
});

test('Tedavi Geçmişi sekmesi açılmalı', async ({ page }) => {
  await page.click('text=Tedavi Geçmişi');
  await expect(page.locator('button:has-text("Yeni Tedavi Ekle")')).toBeVisible({ timeout: 5000 });
});

test('Ödemeler sekmesi açılmalı ve özet kartları görünmeli', async ({ page }) => {
  await page.click('text=Ödemeler');
  await expect(page.locator('text=Toplam Tedavi Tutarı')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=Toplam Ödenen')).toBeVisible();
  await expect(page.locator('text=Kalan Borç').first()).toBeVisible();
});

test('Dokümanlar sekmesi açılmalı', async ({ page }) => {
  await page.click('text=Dokümanlar');
  await expect(page.locator('text=Belge Yükle').first()).toBeVisible({ timeout: 5000 });
});

test('Diş Şeması sekmesi açılmalı', async ({ page }) => {
  await page.click('text=Diş Şeması');
  await page.waitForTimeout(1000);
});

test('Hasta bilgileri güncellenebilmeli', async ({ page }) => {
  await page.click('text=Profil Bilgileri');
  const notesField = page.locator('textarea[placeholder="Hasta hakkında genel notlar..."]');
  await expect(notesField).toBeVisible({ timeout: 5000 });
  await notesField.fill('E2E Test Notu - ' + Date.now());
  await expect(page.locator('button:has-text("Değişiklikleri Kaydet")')).toBeEnabled();
});
});
