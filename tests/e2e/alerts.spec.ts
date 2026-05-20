import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

const PROJECT = {
  id: 1,
  name: 'Alert 프로젝트',
  description: '',
  createdAt: '2026-03-15T12:00:00.000Z',
};

const ENDPOINT = {
  id: 500,
  projectId: PROJECT.id,
  url: 'https://api.example.com/health',
  httpMethod: 'GET' as const,
  headers: null,
  body: null,
  expectedStatusCode: 200,
  checkInterval: 300,
  isActive: true,
  lastCheckedAt: null,
  createdAt: '2026-03-15T12:00:00.000Z',
};

test.describe('alert flows', () => {
  test('creates an email alert and shows it in the list', async ({ page }) => {
    await installMockApi(page, {
      projects: [PROJECT],
      endpointsByProjectId: { [PROJECT.id]: [ENDPOINT] },
    });
    await loginViaUi(page);

    await page.goto('/ko/alerts');
    await expect(
      page.getByRole('heading', { name: '알림 설정' }),
    ).toBeVisible();

    // Open new alert form
    await page.getByRole('button', { name: '새 알림' }).click();

    // Select project
    await page.getByRole('combobox', { name: '프로젝트' }).click();
    await page.getByRole('option', { name: PROJECT.name }).click();

    // Select endpoint (option shows "GET https://..." format)
    await page.getByRole('combobox', { name: '엔드포인트' }).click();
    await page.getByRole('option', { name: /api\.example\.com\/health/ }).click();

    // Select alert type
    await page.getByRole('combobox', { name: '알림 유형' }).click();
    await page.getByRole('option', { name: /이메일/ }).click();

    // Fill target
    await page
      .getByPlaceholder(
        'admin@example.com 또는 https://hooks.slack.com/services/...',
      )
      .fill('alert@example.com');

    // Submit
    await page.getByRole('button', { name: '알림 생성' }).click();

    // Verify alert appears in list
    await expect(page.getByText('alert@example.com')).toBeVisible();

    await page.getByRole('button', { name: '테스트 알림 발송' }).click();
    await expect(page.getByText('최근 발송 이력')).toBeVisible();
    await expect(page.getByText('성공')).toBeVisible();
  });
});
