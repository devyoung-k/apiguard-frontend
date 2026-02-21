'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { usePlan } from '@/contexts/plan-context';
import { PLANS } from '@/lib/plans';
import { formatPrice } from '@/lib/plans';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as billingApi from '@/lib/api/billing';
import type { PlanType } from '@/types/api';

const USE_MOCK = true;

export function PricingPage() {
  const { currentPlan } = usePlan();
  const isDarkMode = useDarkMode();
  const t = useTranslations('pricing');
  const tBilling = useTranslations('billing');
  const tFeatures = useTranslations('features');

  const handleUpgrade = async (planType: PlanType) => {
    if (planType === currentPlan) return;

    if (USE_MOCK) {
      toast.info(tBilling('toasts.checkoutMock'));
      return;
    }

    try {
      const { url } = await billingApi.createCheckoutSession(planType);
      window.location.href = url;
    } catch {
      toast.error(tBilling('toasts.checkoutError'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2
          className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {t('title')}
        </h2>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan, index) => {
          const isCurrent = plan.type === currentPlan;
          const isPro = plan.type === 'pro';

          return (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
            >
              <Card
                className={`relative overflow-hidden transition-all h-full ${
                  isPro
                    ? isDarkMode
                      ? 'border-blue-500/50 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/30 shadow-xl shadow-blue-500/10'
                      : 'border-blue-300 bg-gradient-to-br from-white via-white to-blue-50 shadow-xl shadow-blue-200/40'
                    : isDarkMode
                      ? 'border-gray-800 bg-gray-900'
                      : 'border-gray-300 bg-white shadow-sm'
                }`}
              >
                {/* Pro 리본 */}
                {isPro && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t('popular')}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <h3
                    className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span
                      className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {plan.price === 0 ? t('free') : formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span
                        className={
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }
                      >
                        {t('perMonth')}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* 기능 목록 */}
                  <ul className="space-y-3">
                    {plan.features.map((featureKey) => {
                      const key = featureKey.replace('features.', '');
                      return (
                        <li key={featureKey} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 rounded-full p-0.5 ${
                              isPro
                                ? 'bg-blue-500/20 text-blue-500'
                                : isDarkMode
                                  ? 'bg-gray-800 text-green-400'
                                  : 'bg-green-100 text-green-600'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <span
                            className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            {tFeatures(key)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* 버튼 */}
                  <Button
                    onClick={() => handleUpgrade(plan.type)}
                    disabled={isCurrent}
                    className={`w-full ${
                      isCurrent
                        ? isDarkMode
                          ? 'bg-gray-800 text-gray-400 border border-gray-700'
                          : 'bg-gray-100 text-gray-500 border border-gray-300'
                        : isPro
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
                          : ''
                    }`}
                    variant={
                      isCurrent ? 'outline' : isPro ? 'default' : 'default'
                    }
                  >
                    {isCurrent
                      ? tBilling('actions.currentPlan')
                      : tBilling('actions.upgrade')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
