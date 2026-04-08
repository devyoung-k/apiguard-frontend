import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

test.describe('language and theme', () => {
  test('switches language from Korean to English via settings', async ({
    page,
  }) => {
    await installMockApi(page);
    await loginViaUi(page);

    await page.goto('/ko/settings');
    await expect(
      page.getByRole('heading', { name: '설정' }),
    ).toBeVisible();

    // Change language to English (combobox shows current value "한국어")
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: '영어' }).click();

    // URL should now be /en/settings
    await expect(page).toHaveURL(/\/en\/settings$/);

    // Verify English text
    await expect(
      page.getByRole('heading', { name: 'Settings' }),
    ).toBeVisible();
  });

  test('switches language from English to Korean', async ({ page }) => {
    await installMockApi(page);
    await loginViaUi(page);

    // Navigate to English settings
    await page.goto('/en/settings');

    // Change language to Korean (combobox shows current value "English")
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /Korean|한국어/ }).click();

    // URL should now be /ko/settings
    await expect(page).toHaveURL(/\/ko\/settings$/);

    // Verify Korean text
    await expect(
      page.getByRole('heading', { name: '설정' }),
    ).toBeVisible();
  });

  test('renders correctly in dark mode', async ({ page }) => {
    await installMockApi(page);

    // Set dark theme preference before navigation
    await page.emulateMedia({ colorScheme: 'dark' });

    await loginViaUi(page);
    await page.goto('/ko/dashboard');

    // Verify dark class is applied to the HTML element
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Verify page still renders key elements
    await expect(
      page.getByRole('heading', { name: '대시보드' }),
    ).toBeVisible();
  });

  test('renders correctly in light mode', async ({ page }) => {
    await installMockApi(page);

    await page.emulateMedia({ colorScheme: 'light' });

    await loginViaUi(page);
    await page.goto('/ko/dashboard');

    // In light mode, "dark" class should NOT be on html
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await expect(
      page.getByRole('heading', { name: '대시보드' }),
    ).toBeVisible();
  });
});
