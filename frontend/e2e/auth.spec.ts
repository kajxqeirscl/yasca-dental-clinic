import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * AUTH & NAVIGATION TESTLERİ
 * Endpoints: POST /api/auth/token/, GET /api/auth/me/, POST /api/auth/logout/
 * Frontend: LoginPage, Layout navigasyon, rol bazlı menü
 */

test.describe('Kimlik Doğrulama', () => {

  test('Geçersiz şifre ile giriş → hata mesajı gösterilmeli', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.fill('#username', 'yanlis_kullanici');
    await page.fill('#password', 'yanlissifre123');
    await page.click('button[type="submit"]');
    const errorBox = page.locator('.bg-red-50');
    await expect(errorBox).toBeVisible({ timeout: 10000 });
  });

  test('Boş form ile giriş yapılamamalı (HTML5 required)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.click('button[type="submit"]');
    // HTML5 required validation engeller, sayfa hala login'de kalır
    await expect(page.locator('#username')).toBeVisible();
  });

  test('Admin hesabı ile başarılı giriş', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('Doktor hesabı ile başarılı giriş', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('Asistan hesabı ile başarılı giriş', async ({ page }) => {
    await loginAs(page, 'asistan_peter', 'demo123!');
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('Giriş yapmadan korumalı sayfaya erişilemez', async ({ page }) => {
    await page.goto('/randevular');
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('Giriş yapmadan /hastalar erişilemez', async ({ page }) => {
    await page.goto('/hastalar');
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('Giriş yapmadan /ayarlar erişilemez', async ({ page }) => {
    await page.goto('/ayarlar');
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('Güvenli çıkış (Logout)', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('button:has-text("Çıkış")');
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('Çıkış sonrası korumalı sayfaya erişilemez', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('button:has-text("Çıkış")');
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
    await page.goto('/hastalar');
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigasyon ve Menü', () => {
  test.setTimeout(60000);

  test('Tüm ana menü linkleri görünür olmalı (admin)', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/randevular"]')).toBeVisible();
    await expect(page.locator('a[href="/hastalar"]')).toBeVisible();
    await expect(page.locator('a[href="/tedavi-turleri"]')).toBeVisible();
    await expect(page.locator('a[href="/ayarlar"]')).toBeVisible();
    await expect(page.locator('a[href="/islem-gecmisi"]')).toBeVisible();
  });

  test('Doktor İşlem Geçmişi linkini görememeli', async ({ page }) => {
    await loginAs(page, 'dr_steve', 'demo123!');
    await expect(page.locator('a[href="/islem-gecmisi"]')).toBeHidden();
  });

  test('Asistan İşlem Geçmişi linkini görememeli', async ({ page }) => {
    await loginAs(page, 'asistan_peter', 'demo123!');
    await expect(page.locator('a[href="/islem-gecmisi"]')).toBeHidden();
  });

  test('Dil değiştirme dropdown görünür olmalı', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await expect(page.locator('select').first()).toBeVisible();
  });
});
