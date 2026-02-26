'use client';

import { motion } from 'framer-motion';
import { CreditCard, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { usePlan } from '@/contexts/plan-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { getPlanInfo, formatPrice } from '@/lib/plans';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import * as billingApi from '@/lib/api/billing';
import { useState } from 'react';

export function BillingPage() {
  const { currentPlan, subscription, isPro, limits } = usePlan();
  const { currentWorkspace } = useWorkspace();
  const isDarkMode = useDarkMode();
  const t = useTranslations('billing');
  const locale = useLocale();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const planInfo = getPlanInfo(currentPlan);

  const handleUpgradeToPro = async () => {
    if (!currentWorkspace) return;
    setIsUpgrading(true);
    try {
      // 1단계: 결제 준비 (토스페이먼츠 주문 정보 생성)
      const prepareData = await billingApi.preparePayment(currentWorkspace.id, {
        planType: 'PRO',
      });

      // 2단계: 토스페이먼츠 결제창 호출
      // @ts-expect-error 토스페이먼츠 SDK는 window에 주입됨
      const tossPayments = window.TossPayments?.(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
      );
      if (!tossPayments) {
        toast.error(t('toasts.sdkNotLoaded'));
        return;
      }
      await tossPayments.requestPayment('카드', {
        amount: prepareData.amount,
        orderId: prepareData.orderId,
        orderName: prepareData.orderName,
        customerEmail: prepareData.customerEmail,
        customerName: prepareData.customerName,
        successUrl: `${window.location.origin}/${locale}/payment/success`,
        failUrl: `${window.location.origin}/${locale}/payment/fail`,
      });
    } catch {
      toast.error(t('toasts.upgradeError'));
    } finally {
      setIsUpgrading(false);
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
                variant={subscription?.active ? 'default' : 'outline'}
                className={
                  subscription?.active
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                }
              >
                {subscription?.active ? t('status.ACTIVE') : t('status.NONE')}
              </Badge>
            </div>

            {/* 만료일 */}
            {subscription?.expiredAt && (
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
                    {new Date(subscription.expiredAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* 플랜 제한 정보 */}
            <div className={`grid grid-cols-2 gap-3 pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              {[
                { label: t('limits.maxEndpoints'), value: limits.maxEndpointsPerProject },
                { label: t('limits.minInterval'), value: `${limits.minCheckInterval}s` },
              ].map(({ label, value }) => (
                <div key={label} className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                  <p className={`text-sm font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* 업그레이드 버튼 (Free 플랜에만 표시) */}
            {!isPro && (
              <div
                className={`flex gap-3 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
              >
                <Button
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('actions.upgradeToPro')
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
