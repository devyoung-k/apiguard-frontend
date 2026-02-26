'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { usePlan } from '@/contexts/plan-context';
import { getUsagePercentage } from '@/lib/plans';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface PlanLimitBannerProps {
  type: 'project' | 'endpoint';
  current: number;
}

export function PlanLimitBanner({ type, current }: PlanLimitBannerProps) {
  const { currentPlan, limits, isPro } = usePlan();
  const isDarkMode = useDarkMode();
  const t = useTranslations('planLimit');

  // Pro 유저는 배너를 표시하지 않음 (제한이 매우 높으므로)
  if (isPro) return null;

  const max =
    type === 'project' ? limits.maxProjects : limits.maxEndpointsPerProject;
  const percentage = getUsagePercentage(current, max);

  // 70% 미만이면 표시하지 않음
  if (percentage < 70) return null;

  const isAtLimit = current >= max;
  const planName = currentPlan === 'FREE' ? 'Free' : 'Pro';

  const warningKey = type === 'project' ? 'projectWarning' : 'endpointWarning';

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
        isAtLimit
          ? isDarkMode
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-red-50 border-red-200'
          : isDarkMode
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <AlertTriangle
        className={`h-5 w-5 shrink-0 ${
          isAtLimit ? 'text-red-500' : 'text-yellow-500'
        }`}
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            isAtLimit
              ? isDarkMode
                ? 'text-red-400'
                : 'text-red-700'
              : isDarkMode
                ? 'text-yellow-400'
                : 'text-yellow-700'
          }`}
        >
          {t(warningKey, { current, max, plan: planName })}
        </p>
        <p
          className={`text-xs mt-0.5 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {t('upgradeMessage')}
        </p>
      </div>

      {/* 사용량 바 */}
      <div className="hidden sm:flex items-center gap-3">
        <div
          className={`w-24 h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? 'bg-red-500'
                : percentage >= 90
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={`text-xs font-medium tabular-nums ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {current}/{max}
        </span>
      </div>

      <Link href="/billing">
        <Button
          size="sm"
          className="gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white whitespace-nowrap"
        >
          {t('upgradeCta')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
