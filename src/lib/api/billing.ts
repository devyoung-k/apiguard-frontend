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

export interface PreparePaymentRequest {
  planType: 'PRO';
}

export interface PreparePaymentResponse {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}

export interface ConfirmPaymentRequest {
  orderId: string;
  paymentKey: string;
  amount: number;
}

export interface PaymentHistoryItem {
  id: number;
  orderId: string;
  orderName: string;
  amount: number;
  status: string;
  method: string;
  paidAt: string;
}

export function preparePayment(
  workspaceId: number,
  data: PreparePaymentRequest,
): Promise<PreparePaymentResponse> {
  return apiPost<PreparePaymentResponse, PreparePaymentRequest>(
    `/workspaces/${workspaceId}/payment/prepare`,
    data,
  );
}

export function confirmPayment(
  workspaceId: number,
  data: ConfirmPaymentRequest,
): Promise<SubscriptionResponse> {
  return apiPost<SubscriptionResponse, ConfirmPaymentRequest>(
    `/workspaces/${workspaceId}/payment/confirm`,
    data,
  );
}

export function getPaymentHistory(
  workspaceId: number,
): Promise<PaymentHistoryItem[]> {
  return apiGet<PaymentHistoryItem[]>(
    `/workspaces/${workspaceId}/payment/history`,
  );
}
