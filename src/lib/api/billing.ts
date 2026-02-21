import { apiGet, apiPost } from '@/lib/api-client';
import type { SubscriptionResponse } from '@/types/api';

export function getSubscription(): Promise<SubscriptionResponse> {
  return apiGet<SubscriptionResponse>('/billing/subscription');
}

export function createCheckoutSession(
  planType: string,
): Promise<{ url: string }> {
  return apiPost<{ url: string }, { planType: string }>('/billing/checkout', {
    planType,
  });
}

export function createPortalSession(): Promise<{ url: string }> {
  return apiPost<{ url: string }>('/billing/portal');
}
