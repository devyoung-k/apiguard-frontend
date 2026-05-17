import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

test.describe('workspace member flows', () => {
  test('invites a new member and shows them in the list', async ({ page }) => {
    await installMockApi(page);
    await loginViaUi(page);

    await page.goto('/ko/admin/members');
    await expect(
      page.getByRole('heading', { name: '멤버' }),
    ).toBeVisible();

    // Verify current member is listed
    await expect(page.getByText('owner@example.com')).toBeVisible();

    // Click invite
    await page.getByRole('button', { name: '멤버 초대' }).click();

    // Fill email
    await page.getByPlaceholder('user@example.com').fill('newbie@example.com');

    // Select role (native <select> element)
    await page.getByRole('combobox', { name: /role/i }).selectOption('MEMBER');

    // Submit invite (second "멤버 초대" button — the one inside the form)
    await page
      .getByRole('button', { name: '멤버 초대', exact: true })
      .last()
      .click();

    // Verify new member in list
    await expect(page.getByText('newbie@example.com')).toBeVisible();
  });
});
