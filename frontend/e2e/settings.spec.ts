import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * KLİNİK AYARLARI, TEDAVİ TÜRLERİ, PERSONEL YÖNETİMİ, İŞLEM GEÇMİŞİ TESTLERİ
 * Endpoints: GET/PUT /api/settings/clinic/
 *            GET/POST/PUT/DELETE /api/treatment-types/
 *            GET/POST/PUT/DELETE /api/users/ (admin only)
 *            GET /api/audit-logs/ (admin only)
 * Frontend: ClinicSettingsPage, TreatmentTypesPage, AuditLogPage
 */

test.describe('Klinik Ayarları', () => {

  test('Admin olarak ayarlar sayfası açılmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/ayarlar"]');
    await expect(page.getByRole('heading', { name: 'Klinik Ayarları' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#start-time')).toBeVisible();
    await expect(page.locator('#end-time')).toBeVisible();
  });

  test('Çalışma saatleri görünmeli ve değiştirilebilmeli', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/ayarlar"]');
    await expect(page.locator('#start-time')).toBeVisible({ timeout: 10000 });
    // Açılış saatini değiştir
    await page.locator('#start-time').selectOption('08:00');
    await expect(page.locator('#start-time')).toHaveValue('08:00');
  });

  test('Çalışma günleri toggle butonları çalışmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/ayarlar"]');
    await expect(page.getByRole('heading', { name: 'Klinik Ayarları' })).toBeVisible({ timeout: 10000 });
    // Gün butonları görünmeli
    await expect(page.locator('button:has-text("Pazartesi")')).toBeVisible();
    await expect(page.locator('button:has-text("Cumartesi")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pazar', exact: true })).toBeVisible();
  });

  test('Doktor ayarları sadece görüntüleyebilmeli', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await page.click('a[href="/ayarlar"]');
    await expect(page.getByRole('heading', { name: 'Klinik Ayarları' })).toBeVisible({ timeout: 10000 });
    // "Sadece görüntüleme" badge'i görünmeli
    await expect(page.locator('text=Sadece görüntüleme')).toBeVisible();
  });

  test('Admin Personel Yönetimi sekmesini görebilmeli', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/ayarlar"]');
    await expect(page.getByRole('heading', { name: 'Klinik Ayarları' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Personel Yönetimi')).toBeVisible();
    await page.click('text=Personel Yönetimi');
  });
});

test.describe('Tedavi Türleri Yönetimi', () => {

  test('Tedavi türleri sayfası açılmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/tedavi-turleri"]');
    await expect(page.locator('h2:has-text("Tedavi Türleri Yönetimi")')).toBeVisible({ timeout: 10000 });
  });

  test('Tedavi türleri tablosu görünmeli', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/tedavi-turleri"]');
    await expect(page.locator('h2:has-text("Tedavi Türleri Yönetimi")')).toBeVisible({ timeout: 10000 });
    // Tablo başlıkları
    await expect(page.locator('th:has-text("Tedavi Adı")').first()).toBeVisible();
  });

  test('Yeni tedavi türü diyaloğu açılmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/tedavi-turleri"]');
    await expect(page.locator('h2:has-text("Tedavi Türleri Yönetimi")')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Yeni Tedavi Türü Ekle")');
    await expect(page.getByPlaceholder('Örn: Kompozit Dolgu')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('0.00')).toBeVisible();
  });

  test('Tedavi türü arama çalışmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/tedavi-turleri"]');
    await expect(page.locator('h2:has-text("Tedavi Türleri Yönetimi")')).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="Tedavi adı veya kategori ile ara..."]', 'Kanal');
    await expect(page.locator('text=Kanal').first()).toBeVisible({ timeout: 5000 });
  });

  test('Tedavi türü diyaloğunda iptal çalışmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/tedavi-turleri"]');
    await expect(page.locator('h2:has-text("Tedavi Türleri Yönetimi")')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Yeni Tedavi Türü Ekle")');
    await expect(page.getByPlaceholder('Örn: Kompozit Dolgu')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("İptal")');
    await expect(page.getByPlaceholder('Örn: Kompozit Dolgu')).toBeHidden({ timeout: 5000 });
  });
});

test.describe('İşlem Geçmişi (Audit Log)', () => {

  test('Admin İşlem Geçmişi sayfasına erişebilmeli', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await expect(page.locator('a[href="/islem-gecmisi"]')).toBeVisible();
    await page.click('a[href="/islem-gecmisi"]');
    await expect(page.locator('h1:has-text("İşlem Geçmişi")')).toBeVisible({ timeout: 10000 });
  });

  test('İşlem Geçmişi tablosu ve filtreleri görünmeli', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/islem-gecmisi"]');
    await expect(page.locator('h1:has-text("İşlem Geçmişi")')).toBeVisible({ timeout: 10000 });
    // Filtre alanları
    await expect(page.locator('input[placeholder*="ara"]').first()).toBeVisible();
  });

  test('Doktor İşlem Geçmişi linkini görememeli', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await expect(page.locator('a[href="/islem-gecmisi"]')).toBeHidden();
  });

  test('Asistan İşlem Geçmişi linkini görememeli', async ({ page }) => {
    await loginAs(page, 'asistan_peter', 'demo123!');
    await expect(page.locator('a[href="/islem-gecmisi"]')).toBeHidden();
  });
});
