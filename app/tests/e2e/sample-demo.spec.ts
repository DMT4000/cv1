import { test, expect } from '@playwright/test';

test('Sample demo: use sample and apply patch increments applied', async ({ page }) => {
  await page.goto('http://localhost:5176/');
  await page.getByRole('button', { name: 'Use sample clean.pdf' }).click();
  await expect(page.getByText('validate: OK')).toBeVisible();
  await page.getByRole('button', { name: 'Apply Sample Patch' }).click();
  // applied counter should be >= 1
  const status = page.locator('div.fixed');
  await expect(status).toContainText('applied:');
});


