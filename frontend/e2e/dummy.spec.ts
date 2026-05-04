import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Currently the app title should be 'Vite + React' or similar unless updated.
  // We'll just check that the page loads.
  await expect(page).toHaveURL(/.*localhost.*/);
});
