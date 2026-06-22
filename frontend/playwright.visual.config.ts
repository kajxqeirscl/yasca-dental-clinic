import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression — ayrı Playwright config'i (Faz 9)
 *
 * NEDEN AYRI CONFIG?
 * Normal E2E testleri "buton çalışıyor mu?" der ama "doğru GÖRÜNÜYOR mu?"
 * diyemez. Bir CSS değişikliği layout'u bozsa hiçbir fonksiyonel test patlamaz.
 * Visual regression, sayfanın ekran görüntüsünü önceki onaylı görüntüyle
 * piksel piksel karşılaştırır.
 *
 * NEDEN auth GEREKMEYEN SAYFALAR?
 * Snapshot testleri deterministik olmalı. Backend/DB'ye bağımlı sayfalar
 * (dashboard, hasta listesi) her koşuda farklı veri gösterir → kararsız snapshot.
 * Bu yüzden sadece statik public sayfaları + login formunu hedefliyoruz.
 * Hepsi path-tabanlı routing ile düz localhost'ta çalışır (*.localhost gerekmez).
 *
 * KULLANIM:
 *   İlk çalıştırma (baseline üret):  npm run test:visual:update
 *   Sonraki karşılaştırmalar:        npm run test:visual
 *
 * Baseline görüntüler OS'a bağlı (font rendering farkı) olduğu için CI'da
 * (Linux) üretilip commit'lenmeli. Yerelde Windows baseline'ı CI'da patlar.
 * Bu yüzden snapshotPathTemplate platform adını içerir.
 */
export default defineConfig({
  testDir: './e2e-visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report-visual' }]],

  // Snapshot'ları platform bazında ayrı tut (linux vs win32 font farkı)
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      // Anti-aliasing / sub-pixel farklarına küçük tolerans → daha az flaky
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_VISUAL_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  // Build + preview sunucusunu Playwright otomatik başlatır (CI için şart)
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
