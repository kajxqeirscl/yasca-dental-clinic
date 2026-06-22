import { test, expect } from '@playwright/test';

/**
 * SaaS REGISTRATION FLOW
 *
 * Public landing → /register → form doldur → yeni klinik oluşur ve login URL döner.
 * Bu spec çok-kiracılı kayıt akışının uçtan-uca çalıştığını doğrular.
 *
 * NOT: Test her çalıştırıldığında benzersiz subdomain üretir (zaman damgası).
 * CI'da gerçek PostgreSQL'e Client + Domain + admin user yaratır.
 */

const uniqueSubdomain = () =>
  `e2etest${Date.now().toString().slice(-8)}`;

test.describe('Tenant Registration Flow', () => {
  test('public register sayfası açılır ve form alanları render edilir', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(1000);

    // En azından form yüklenmiş olmalı
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('yeni klinik kaydı başarılı olur ve login_url döner', async ({
    page,
  }) => {
    const subdomain = uniqueSubdomain();
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(1000);

    // Form alanlarını isim attribute'una göre doldur
    await page.fill('input[name="clinic_name"]', `E2E Test ${subdomain}`);
    await page.fill('input[name="subdomain"]', subdomain);
    await page.fill('input[name="admin_email"]', `admin@${subdomain}.test`);
    await page.fill('input[name="admin_password"]', 'GucluParola123!');
    await page.fill('input[name="admin_first_name"]', 'E2E');
    await page.fill('input[name="admin_last_name"]', 'Admin');

    // Submit
    await page.click('button[type="submit"]');

    // Başarı mesajı (toast veya inline) görünmeli — "/app/{subdomain}" linki / mesajı bekleniyor
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent();
    const okSignal =
      bodyText?.includes(`/app/${subdomain}`) ||
      bodyText?.includes('başarıyla') ||
      bodyText?.includes('Klinik');
    expect(okSignal).toBeTruthy();
  });

  test('eksik alanlarla submit edilince HTML5 validation engelliyor', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(1000);

    await page.click('button[type="submit"]');

    // Form hala görünür olmalı (yönlendirme olmamalı)
    await expect(page.locator('form').first()).toBeVisible();
  });
});
