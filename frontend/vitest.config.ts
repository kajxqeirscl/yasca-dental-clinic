import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/mocks/**',
        'src/test/**',
        'src/setupTests.ts',
        'src/app/components/ui/**',
        'src/app/components/figma/**',
        'e2e/**',
      ],
      // Regression guard — Faz 2 (deep dialog) sonu baseline.
      // Plan hedefi: lines 65, branches 55, functions 55, statements 65 —
      // A11y (Faz 3) + ek testlerle ulaşılacak.
      // Mevcut: lines 56.7, branches 46.2, functions 39.9, statements 54.6.
      thresholds: {
        lines: 54,
        functions: 38,
        branches: 45,
        statements: 54,
      },
    },
  },
});
