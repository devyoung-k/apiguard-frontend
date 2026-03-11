import type { PlanType, PlanInfo, PlanLimits } from '@/types/api';

// ── 플랜 정의 ──

export const FREE_PLAN: PlanInfo = {
  type: 'FREE',
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
  type: 'PRO',
  name: 'Pro',
  price: 19900, // KRW 19,900
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
  ],
};

export const PLANS: PlanInfo[] = [FREE_PLAN, PRO_PLAN];

// ── 유틸리티 ──

export function getPlanLimits(planType: PlanType): PlanLimits {
  return planType === 'PRO' ? PRO_PLAN.limits : FREE_PLAN.limits;
}

export function getPlanInfo(planType: PlanType): PlanInfo {
  return planType === 'PRO' ? PRO_PLAN : FREE_PLAN;
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

export function formatPrice(amount: number, locale = 'ko-KR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}
