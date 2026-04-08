import { expect, test } from '@playwright/test';
import {
  installMockApi,
  loginViaUi,
  seedSession,
} from './support/mock-api';

test.describe('project and authorization flows', () => {
  test('creates a project and navigates to its detail page', async ({
    page,
  }) => {
    await installMockApi(page);
    await loginViaUi(page);

    await page.goto('/ko/projects');
    await expect(page.getByRole('heading', { name: '프로젝트' })).toBeVisible();

    await page.getByRole('button', { name: '새 프로젝트' }).click();
    await page.getByPlaceholder('내 프로젝트').fill('Playwright 프로젝트');
    await page
      .getByPlaceholder('이 프로젝트에 대한 간단한 설명을 입력하세요')
      .fill('Playwright E2E로 생성한 테스트 프로젝트');
    await page.getByRole('button', { name: '프로젝트 생성' }).click();

    await expect(page).toHaveURL(/\/ko\/projects\/\d+$/);
    await expect(
      page.getByRole('heading', { name: 'Playwright 프로젝트' }),
    ).toBeVisible();
  });

  test('blocks non-admin users from system admin pages', async ({ page }) => {
    await installMockApi(page, { userRole: 'USER', workspaceRole: 'OWNER' });
    await seedSession(page, 'USER');

    await page.goto('/ko/system-admin/users');

    await expect(
      page.getByRole('heading', { name: '접근 권한이 없습니다' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        '시스템 관리자 기능은 관리자(ADMIN) 권한 사용자만 접근할 수 있습니다.',
      ),
    ).toBeVisible();
  });
});
