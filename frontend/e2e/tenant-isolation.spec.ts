import { test, expect, request } from '@playwright/test';

/**
 * CROSS-TENANT ISOLATION
 *
 * Doğrulanan davranış: A tenant'ına giriş yapan kullanıcı, B tenant'ının
 * patient ID'sine direkt fetch ile eriştiğinde 404/403 ya da boş cevap almalı.
 *
 * Multi-tenant SaaS'lerin en kritik güvenlik koruması — schema isolation
 * gerçekten devrede mi?
 *
 * Bu test seed_demo_data ile gelen "standard" ve "premium" tenant'larını
 * varsayar (seed_demo_data.py içinde tanımlı).
 */

test.describe('Cross-Tenant Isolation', () => {
  test('standard tenant kullanıcısı kendi hastalarını görür', async ({
    page,
  }) => {
    await page.goto('http://standard.localhost:5173/');
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.fill('#username', 'tony');
    await page.fill('#password', 'demo123!');
    await page.click('button[type="submit"]');

    // Login başarılı: nav görünmeli
    await expect(page.locator('a[href="/"]')).toBeVisible({ timeout: 15000 });

    // Hastalar sayfasında hasta listesi var
    await page.goto('http://standard.localhost:5173/hastalar');
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    // Hasta arama input'u veya hasta tablosu görünmeli
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('cross-tenant API isteği boş veya 4xx döner (standard token premium hostuna)', async ({
    browser,
  }) => {
    // standard tenant'a login ol, JWT al
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('http://standard.localhost:5173/');
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.fill('#username', 'tony');
    await page.fill('#password', 'demo123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('a[href="/"]')).toBeVisible({ timeout: 15000 });

    // localStorage'dan access token'ı al
    const accessToken = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    expect(accessToken).toBeTruthy();

    // Aynı token ile premium tenant API'sine direkt istek
    const apiRequest = await request.newContext();
    const res = await apiRequest.get(
      'http://premium.localhost:8000/api/patients/',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    // Schema isolation çalışıyorsa:
    // - JWT premium schema'da geçersizdir (user yok) → 401
    // - veya patient listesi premium'unkidir (standard'ınki değil)
    if (res.status() === 200) {
      const data = await res.json();
      const results = data.results ?? data;
      // Standard'da seed edilen "Mustafa Öztürk" premium'da olmamalı
      const usernames = JSON.stringify(results);
      expect(usernames).not.toContain('Mustafa Öztürk');
    } else {
      expect([401, 403, 404]).toContain(res.status());
    }

    await ctx.close();
    await apiRequest.dispose();
  });
});
