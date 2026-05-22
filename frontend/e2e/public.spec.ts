import { test, expect } from '@playwright/test';

/**
 * PUBLIC SaaS SAYFA TESTLERİ
 * Endpoint: GET /api/public/clinic-info/ (unauthenticated)
 * Frontend: PublicApp (HomePage, RegisterPage, TenantLoginPage)
 *
 * App.tsx: hostname === 'localhost' → <PublicApp />
 */

test.describe('Public SaaS Sayfası', () => {

  test('Ana domain ziyaretinde SaaS landing sayfası görünmeli', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Navbar linkleri çalışmalı', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Kayıt sayfasına navigasyon çalışmalı', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(1000);
    // Kayıt formu veya sayfası yüklenmeli
    const hasForm = await page.locator('form').first().isVisible().catch(() => false);
    const hasContent = await page.locator('h1, h2').first().isVisible().catch(() => false);
    expect(hasForm || hasContent).toBeTruthy();
  });

  test('Tenant giriş sayfasına navigasyon çalışmalı', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    const hasContent = await page.locator('h1, h2, form').first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
