'use client';

import { motion } from 'framer-motion';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { usePlan } from '@/contexts/plan-context';
import { getPlanInfo, formatPrice } from '@/lib/plans';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as billingApi from '@/lib/api/billing';
import type { SubscriptionStatus } from '@/types/api';
import { USE_MOCK_API } from '@/lib/runtime-config';

function getStatusVariant(
  status: SubscriptionStatus,
): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (status) {
    case 'active':
      return 'default';
    case 'trialing':
      return 'secondary';
    case 'past_due':
      return 'destructive';
    case 'canceled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'trialing':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'past_due':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'canceled':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

export function BillingPage() {
  const { currentPlan, subscription } = usePlan();
  const isDarkMode = useDarkMode();
  const t = useTranslations('billing');

  const planInfo = getPlanInfo(currentPlan);
  const status = subscription?.status ?? 'none';

  const handleManageSubscription = async () => {
    if (USE_MOCK_API) {
      toast.info(t('toasts.portalMock'));
      return;
    }

    try {
      const { url } = await billingApi.createPortalSession();
      window.location.assign(url);
    } catch {
      toast.error(t('toasts.portalError'));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 현재 플랜 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={
            isDarkMode
              ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-800'
              : 'bg-gradient-to-br from-white via-white to-gray-50 border-gray-200 shadow-sm'
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}
              >
                <CreditCard
                  className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                />
              </div>
              <CardTitle
                className={isDarkMode ? 'text-white' : 'text-gray-900'}
              >
                {t('planInfo.title')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 플랜 & 가격 */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('planInfo.plan')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {planInfo.name}
                </span>
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  ({planInfo.price === 0 ? t('planInfo.freeLabel') : formatPrice(planInfo.price)}
                  /mo)
                </span>
              </div>
            </div>

            {/* 구독 상태 */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('planInfo.status')}
              </span>
              <Badge
                variant={getStatusVariant(status)}
                className={getStatusColor(status)}
              >
                {t(`status.${status}`)}
              </Badge>
            </div>

            {/* 다음 결제일 */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('planInfo.nextBilling')}
              </span>
              <div className="flex items-center gap-2">
                <Calendar
                  className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <span
                  className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                >
                  {subscription?.currentPeriodEnd
                    ? new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()
                    : t('planInfo.noBillingDate')}
                </span>
              </div>
            </div>

            {/* 취소 예정 안내 */}
            {subscription?.cancelAtPeriodEnd && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  isDarkMode
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t('planInfo.cancelScheduled')}
                </span>
              </div>
            )}

            {/* 액션 버튼 */}
            <div
              className={`flex gap-3 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
            >
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                className={`flex-1 gap-2 ${
                  isDarkMode
                    ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                    : ''
                }`}
              >
                <ExternalLink className="h-4 w-4" />
                {t('actions.manageSubscription')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
