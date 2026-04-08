import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

test.describe('authentication flow', () => {
  test('redirects unauthenticated users to the localized login page', async ({
    page,
  }) => {
    await installMockApi(page);

    await page.goto('/ko/dashboard');

    await expect(page).toHaveURL(/\/ko\/login$/);
    await expect(
      page.getByRole('heading', { name: 'APIGuard에 오신 것을 환영합니다' }),
    ).toBeVisible();
  });

  test('signs in and lands on the dashboard', async ({ page }) => {
    await installMockApi(page);

    await loginViaUi(page);

    await expect(
      page.getByRole('heading', { name: '대시보드' }),
    ).toBeVisible();
    await expect(page.getByText('개인 워크스페이스')).toBeVisible();
  });
});
