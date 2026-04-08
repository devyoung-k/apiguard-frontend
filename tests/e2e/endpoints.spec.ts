import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

const PROJECT = {
  id: 1,
  name: 'E2E 프로젝트',
  description: '엔드포인트 테스트용 프로젝트',
  createdAt: '2026-03-15T12:00:00.000Z',
};

test.describe('endpoint flows', () => {
  test('creates an endpoint and navigates to its detail page', async ({
    page,
  }) => {
    await installMockApi(page, { projects: [PROJECT] });
    await loginViaUi(page);

    // Navigate to project detail
    await page.goto(`/ko/projects/${PROJECT.id}`);
    await expect(
      page.getByRole('heading', { name: PROJECT.name }),
    ).toBeVisible();

    // Click "엔드포인트 추가"
    await page.getByRole('button', { name: '엔드포인트 추가' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/ko/projects/${PROJECT.id}/endpoints/new$`),
    );

    // Fill endpoint form
    await page
      .getByPlaceholder('https://api.example.com/v1/endpoint')
      .fill('https://httpbin.org/get');

    // Submit
    await page.getByRole('button', { name: '엔드포인트 생성' }).click();

    // Should navigate to endpoint detail
    await expect(page).toHaveURL(
      new RegExp(`/ko/projects/${PROJECT.id}/endpoints/\\d+$`),
    );
  });

  test('runs a manual health check from endpoint detail', async ({ page }) => {
    const endpoint = {
      id: 500,
      projectId: PROJECT.id,
      url: 'https://httpbin.org/get',
      httpMethod: 'GET' as const,
      headers: null,
      body: null,
      expectedStatusCode: 200,
      checkInterval: 300,
      isActive: true,
      lastCheckedAt: null,
      createdAt: '2026-03-15T12:00:00.000Z',
    };

    await installMockApi(page, {
      projects: [PROJECT],
      endpointsByProjectId: { [PROJECT.id]: [endpoint] },
    });
    await loginViaUi(page);

    await page.goto(`/ko/projects/${PROJECT.id}/endpoints/${endpoint.id}`);

    // Verify endpoint info is visible
    await expect(page.getByText('https://httpbin.org/get')).toBeVisible();

    // Click "지금 점검"
    await page.getByRole('button', { name: '지금 점검' }).click();

    // Verify check result toast or table update
    await expect(page.getByText(/점검 성공/)).toBeVisible();
  });
});
