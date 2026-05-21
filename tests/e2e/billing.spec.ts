import { expect, test } from '@playwright/test';
import { installMockApi, loginViaUi } from './support/mock-api';

test.describe('billing flows', () => {
  test('upgrades to Pro after Toss success redirect', async ({ page }) => {
    await installMockApi(page);
    await page.addInitScript(() => {
      type MockTossWindow = Window & {
        TossPayments?: () => {
          payment: () => {
            requestPayment: (params: {
              successUrl: string;
              orderId: string;
              amount: { value: number };
            }) => Promise<void>;
          };
        };
      };

      (window as MockTossWindow).TossPayments = () => ({
        payment: () => ({
          requestPayment: async ({ successUrl, orderId, amount }) => {
            const redirectUrl = new URL(successUrl);
            redirectUrl.searchParams.set('paymentKey', 'mock-payment-key');
            redirectUrl.searchParams.set('orderId', orderId);
            redirectUrl.searchParams.set('amount', String(amount.value));
            window.location.assign(redirectUrl.toString());
          },
        }),
      });
    });

    await loginViaUi(page);
    await page.goto('/ko/billing');

    await page.getByRole('button', { name: 'Pro로 업그레이드' }).click();

    await expect(
      page.getByText('구독 정보가 정상적으로 반영되었습니다.'),
    ).toBeVisible();

    await page.getByRole('button', { name: '결제 페이지로 이동' }).click();
    await page.getByRole('button', { name: '결제 관리' }).click();

    await expect(page.getByText('결제 완료')).toBeVisible();
    await expect(page.getByText(/apiguard-1-mock-/)).toBeVisible();
    await expect(page.getByText('₩19,900').last()).toBeVisible();
  });
});
