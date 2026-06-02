import { defineConfig } from 'vitest/config';

/**
 * Pact consumer testleri için AYRI vitest config'i (Faz 9).
 *
 * Normal vitest.config.ts MSW'yi global başlatır ve fetch'i mock'lar —
 * bu, Pact'in kendi mock provider'ı ile çakışır. Ayrıca Pact testleri
 * gerçek HTTP (node) kullanır, jsdom değil. Bu yüzden:
 *   - include sadece pact/ altını kapsar
 *   - environment 'node'
 *   - setupFiles YOK (MSW başlamaz)
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['pact/**/*.pact.test.ts'],
    testTimeout: 30000,
  },
});
