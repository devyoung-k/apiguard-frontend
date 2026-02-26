'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { PlanType, SubscriptionResponse, PlanLimits } from '@/types/api';
import { getPlanLimits } from '@/lib/plans';
import * as billingApi from '@/lib/api/billing';
import { useWorkspace } from '@/contexts/workspace-context';
import { USE_MOCK_API } from '@/lib/runtime-config';

interface PlanContextType {
  /** 현재 플랜 타입 */
  currentPlan: PlanType;
  /** 구독 상세 정보 */
  subscription: SubscriptionResponse | null;
  /** 현재 플랜 제한 값 */
  limits: PlanLimits;
  /** Pro 플랜 여부 */
  isPro: boolean;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 구독 새로고침 */
  refreshSubscription: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const MOCK_SUBSCRIPTION: SubscriptionResponse = {
  planType: 'FREE',
  active: false,
  expiredAt: null,
  maxEndpointsPerProject: 5,
  minCheckIntervalSeconds: 300,
  maxAlertChannels: 2,
  maxMembers: 3,
  dataRetentionDays: 1,
};

export function PlanProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const currentPlan: PlanType = subscription?.planType ?? 'FREE';
  const isPro = currentPlan === 'PRO';
  const limits = getPlanLimits(currentPlan);

  const refreshSubscription = useCallback(async () => {
    if (USE_MOCK_API) {
      setSubscription(MOCK_SUBSCRIPTION);
      return;
    }
    if (!currentWorkspace) return;
    try {
      const data = await billingApi.getSubscription(currentWorkspace.id);
      setSubscription(data);
    } catch {
      setSubscription(MOCK_SUBSCRIPTION);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshSubscription();
      setIsLoading(false);
    };
    init();
  }, [currentWorkspace, refreshSubscription]);

  return (
    <PlanContext.Provider
      value={{
        currentPlan,
        subscription,
        limits,
        isPro,
        isLoading,
        refreshSubscription,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
