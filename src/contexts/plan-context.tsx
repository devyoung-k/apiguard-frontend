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
  refreshSubscription: (workspaceId?: number) => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const MOCK_SUBSCRIPTION: SubscriptionResponse = {
  planType: 'FREE',
  active: true,
  cancelAtPeriodEnd: false,
  expiredAt: null,
  maxProjects: 3,
  maxEndpointsPerProject: 5,
  minCheckIntervalSeconds: 300,
  maxAlertChannels: 1,
  maxMembers: 1,
  dataRetentionDays: 7,
};

export function PlanProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const currentPlan: PlanType = subscription?.planType ?? 'FREE';
  const isPro = currentPlan === 'PRO';
  const fallbackLimits = getPlanLimits(currentPlan);
  const limits: PlanLimits = {
    maxProjects: subscription?.maxProjects ?? fallbackLimits.maxProjects,
    maxEndpointsPerProject:
      subscription?.maxEndpointsPerProject ?? fallbackLimits.maxEndpointsPerProject,
    minCheckInterval:
      subscription?.minCheckIntervalSeconds ?? fallbackLimits.minCheckInterval,
  };

  const refreshSubscription = useCallback(async (workspaceId?: number) => {
    if (USE_MOCK_API) {
      setSubscription(MOCK_SUBSCRIPTION);
      return;
    }
    const targetWorkspaceId = workspaceId ?? currentWorkspace?.id;
    if (!targetWorkspaceId) return;
    try {
      const data = await billingApi.getSubscription(targetWorkspaceId);
      setSubscription(data);
    } catch {
      setSubscription(MOCK_SUBSCRIPTION);
    }
  }, [currentWorkspace?.id]);

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
