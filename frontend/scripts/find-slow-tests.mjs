#!/usr/bin/env node
/**
 * Slow test bulucu — vitest JSON reporter çıktısını parse eder.
 *
 * Kullanım:
 *   cd frontend
 *   npx vitest run --reporter=json --outputFile=test-results.json
 *   node scripts/find-slow-tests.mjs test-results.json
 *
 * Budget:
 *   Unit testleri: <=200ms (aşan: vitest.config.ts'te slowTestThreshold uyarısı gösterir)
 */
import fs from 'node:fs';

const UNIT_BUDGET_MS = 200;
const INTEG_BUDGET_MS = 2000;

const file = process.argv[2] || 'test-results.json';

if (!fs.existsSync(file)) {
  console.error(`❌ Dosya bulunamadı: ${file}`);
  console.error('Önce: npx vitest run --reporter=json --outputFile=test-results.json');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function classify(name) {
  if (/integration|e2e/i.test(name)) return ['integration', INTEG_BUDGET_MS];
  return ['unit', UNIT_BUDGET_MS];
}

const overBudget = [];

function walk(suite, file) {
  if (!suite.tasks) return;
  for (const task of suite.tasks) {
    if (task.type === 'test' && task.result?.duration != null) {
      const ms = Math.round(task.result.duration);
      const [category, budget] = classify(file || task.name);
      if (ms > budget) {
        overBudget.push({ ms, category, budget, name: task.name, file });
      }
    }
    if (task.type === 'suite') walk(task, file);
  }
}

for (const testFile of data.testResults || []) {
  walk(testFile, testFile.name || testFile.file);
}

if (overBudget.length === 0) {
  console.log('✅ Tüm testler budget içinde!');
  process.exit(0);
}

overBudget.sort((a, b) => b.ms - a.ms);
console.log(`⚠️  ${overBudget.length} test budget'i aşıyor:\n`);
console.log('| Süre | Kategori | Budget | Dosya | Test |');
console.log('|------|----------|--------|-------|------|');
for (const { ms, category, budget, name, file } of overBudget) {
  console.log(`| ${ms}ms | ${category} | ${budget}ms | ${file || '?'} | ${name} |`);
}

console.log('\nÖneri: budget aşan unit testler için MSW handler\'ları daha hızlı yap veya jest.useFakeTimers() kullan.');
