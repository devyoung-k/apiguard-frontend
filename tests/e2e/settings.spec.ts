import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

test.describe('settings flows', () => {
  test('updates nickname', async ({ page }) => {
    await installMockApi(page);
    await loginViaUi(page);

    await page.goto('/ko/settings');
    await expect(
      page.getByRole('heading', { name: '설정' }),
    ).toBeVisible();

    // Clear and fill new nickname
    const nicknameInput = page.getByPlaceholder('닉네임을 입력하세요');
    await nicknameInput.clear();
    await nicknameInput.fill('NewNickname');

    // Save
    await page.getByRole('button', { name: '저장' }).click();

    // Verify success toast
    await expect(page.getByText('닉네임이 변경되었습니다')).toBeVisible();
  });

  test('changes password', async ({ page }) => {
    await installMockApi(page);
    await loginViaUi(page);

    await page.goto('/ko/settings');

    // Fill password fields
    await page
      .getByPlaceholder('현재 비밀번호를 입력하세요')
      .fill('OldPassword1!');
    await page
      .getByPlaceholder('새 비밀번호를 입력하세요')
      .fill('NewPassword1!');
    await page
      .getByPlaceholder('새 비밀번호를 다시 입력하세요')
      .fill('NewPassword1!');

    // Submit
    await page.getByRole('button', { name: '비밀번호 변경' }).click();

    // Verify success toast
    await expect(page.getByText('비밀번호가 변경되었습니다')).toBeVisible();
  });

  test('deletes current workspace', async ({ page }) => {
    await installMockApi(page);
    await loginViaUi(page);

    await page.goto('/ko/settings');

    await page.getByRole('button', { name: '워크스페이스 삭제' }).click();
    await expect(
      page.getByRole('heading', { name: '워크스페이스를 삭제하시겠습니까?' }),
    ).toBeVisible();

    await page.getByRole('button', { name: '삭제' }).click();

    await expect(page.getByText('워크스페이스가 삭제되었습니다.')).toBeVisible();
    await expect(
      page.getByText('선택된 워크스페이스가 없습니다.'),
    ).toBeVisible();
  });
});
