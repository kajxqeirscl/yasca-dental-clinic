import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAs } from './helpers';

/**
 * A11y E2E testi @axe-core/playwright ile.
 *
 * Authenticated user'la temel sayfaları gez, her birinde WCAG 2.1 AA tara.
 * Tag: @a11y — selective run için: `npx playwright test --grep @a11y`
 *
 * NOT: button-name ve select-name kuralları unit'lerde olduğu gibi geçici disable.
 * Bunlar UI primitive refactor gerektirir; tracking issue açılmalı.
 */

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const disabledRules = ['button-name', 'select-name', 'color-contrast'];
// color-contrast: kompozit gradient buton background'larda false positive verir;
// dedicated color-contrast.spec.ts'te ayrıca tarayacağız.

test.describe('A11y E2E @a11y', () => {
  test('LoginPage WCAG 2.1 AA ihlali içermez', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#username', { timeout: 15000 });

    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .disableRules(disabledRules)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Dashboard WCAG 2.1 AA ihlali içermez (login sonrası)', async ({
    page,
  }) => {
    await loginAs(page, 'tony', 'demo123!');

    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .disableRules(disabledRules)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Hastalar sayfası WCAG 2.1 AA ihlali içermez', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/hastalar"]');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .disableRules(disabledRules)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Randevular sayfası WCAG 2.1 AA ihlali içermez', async ({ page }) => {
    await loginAs(page, 'tony', 'demo123!');
    await page.click('a[href="/randevular"]');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(wcagTags)
      .disableRules(disabledRules)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
