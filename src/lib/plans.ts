import type { PlanType, PlanInfo, PlanLimits } from '@/types/api';

// ── 플랜 정의 ──

export const FREE_PLAN: PlanInfo = {
  type: 'free',
  name: 'Free',
  price: 0,
  limits: {
    maxProjects: 3,
    maxEndpointsPerProject: 5,
    minCheckInterval: 300, // 5분
  },
  features: [
    'features.threeProjects',
    'features.fiveEndpoints',
    'features.fiveMinInterval',
    'features.emailAlerts',
    'features.twentyFourHourHistory',
  ],
};

export const PRO_PLAN: PlanInfo = {
  type: 'pro',
  name: 'Pro',
  price: 2900, // $29.00
  limits: {
    maxProjects: 50,
    maxEndpointsPerProject: 100,
    minCheckInterval: 30, // 30초
  },
  features: [
    'features.fiftyProjects',
    'features.hundredEndpoints',
    'features.thirtySecondInterval',
    'features.emailSlackAlerts',
    'features.ninetyDayHistory',
    'features.prioritySupport',
    'features.customWebhooks',
  ],
};

export const PLANS: PlanInfo[] = [FREE_PLAN, PRO_PLAN];

// ── 유틸리티 ──

export function getPlanLimits(planType: PlanType): PlanLimits {
  return planType === 'pro' ? PRO_PLAN.limits : FREE_PLAN.limits;
}

export function getPlanInfo(planType: PlanType): PlanInfo {
  return planType === 'pro' ? PRO_PLAN : FREE_PLAN;
}

export interface UsageInfo {
  currentProjects: number;
  currentEndpoints: number;
}

export function isOverProjectLimit(
  planType: PlanType,
  currentProjects: number,
): boolean {
  const limits = getPlanLimits(planType);
  return currentProjects >= limits.maxProjects;
}

export function isOverEndpointLimit(
  planType: PlanType,
  currentEndpoints: number,
): boolean {
  const limits = getPlanLimits(planType);
  return currentEndpoints >= limits.maxEndpointsPerProject;
}

export function getUsagePercentage(current: number, max: number): number {
  return Math.min(Math.round((current / max) * 100), 100);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
