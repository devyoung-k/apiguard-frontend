import { apiGet, apiPost } from '@/lib/api-client';
import type { SubscriptionResponse } from '@/types/api';

// ── 구독 조회 ──

export function getSubscription(
  workspaceId: number,
): Promise<SubscriptionResponse> {
  return apiGet<SubscriptionResponse>(
    `/workspaces/${workspaceId}/subscription`,
  );
}

// ── 결제 (토스페이먼츠 플로우) ──

export interface PreparePaymentResponse {
  orderId: string;
  orderName: string;
  amount: number;
  clientKey: string;
  customerKey?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface ConfirmPaymentRequest {
  orderId: string;
  paymentKey: string;
  amount: number;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface PaymentResponse {
  id: number;
  orderId: string;
  paymentKey: string;
  planType: 'FREE' | 'PRO';
  amount: number;
  status: PaymentStatus;
  paidAt: string;
}

export function preparePayment(
  workspaceId: number,
): Promise<PreparePaymentResponse> {
  return apiPost<PreparePaymentResponse>(
    `/workspaces/${workspaceId}/payment/prepare`,
  );
}

export function confirmPayment(
  workspaceId: number,
  data: ConfirmPaymentRequest,
): Promise<PaymentResponse> {
  return apiPost<PaymentResponse, ConfirmPaymentRequest>(
    `/workspaces/${workspaceId}/payment/confirm`,
    data,
  );
}

export function getPaymentHistory(
  workspaceId: number,
): Promise<PaymentResponse[]> {
  return apiGet<PaymentResponse[]>(
    `/workspaces/${workspaceId}/payment/history`,
  );
}

export function cancelSubscription(
  workspaceId: number,
): Promise<SubscriptionResponse> {
  return apiPost<SubscriptionResponse>(
    `/workspaces/${workspaceId}/subscription/cancel`,
  );
}
