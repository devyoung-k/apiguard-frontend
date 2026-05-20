'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCw,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { usePlan } from '@/contexts/plan-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useDarkMode } from '@/hooks/use-dark-mode';
import * as billingApi from '@/lib/api/billing';
import { formatPrice, getPlanInfo } from '@/lib/plans';
import { openTossCheckout } from '@/lib/toss-payments';
import { getApiErrorMessage } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

function formatBillingDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const PAYMENT_BADGE_CLASSNAME: Record<billingApi.PaymentStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  SUCCESS: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
  CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function BillingPage() {
  const { currentPlan, subscription, isPro, limits, refreshSubscription } = usePlan();
  const { currentWorkspace, myRole } = useWorkspace();
  const isDarkMode = useDarkMode();
  const t = useTranslations('billing');
  const locale = useLocale();
  const localeTag = locale === 'ko' ? 'ko-KR' : 'en-US';
  const billingPeriodLabel = locale === 'ko' ? '/월' : '/month';
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [payments, setPayments] = useState<billingApi.PaymentResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const planInfo = getPlanInfo(currentPlan);
  const canManageBilling = Boolean(currentWorkspace && myRole === 'OWNER');
  const cancelAtPeriodEnd = Boolean(subscription?.cancelAtPeriodEnd);
  const subscriptionStatusLabel = cancelAtPeriodEnd
    ? t('planInfo.cancelScheduled')
    : subscription?.active
      ? t('status.ACTIVE')
      : t('status.NONE');
  const latestSuccessfulPayment = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'SUCCESS')
        .sort(
          (left, right) =>
            new Date(right.paidAt).getTime() - new Date(left.paidAt).getTime(),
        )[0] ?? null,
    [payments],
  );

  const loadPaymentHistory = useCallback(async () => {
    if (!currentWorkspace || myRole !== 'OWNER') {
      setPayments([]);
      setHistoryLoaded(false);
      return;
    }

    setIsHistoryLoading(true);
    try {
      const data = await billingApi.getPaymentHistory(currentWorkspace.id);
      setPayments(data);
    } catch (error) {
      setPayments([]);
      toast.error(getApiErrorMessage(error, t('toasts.historyLoadError')));
    } finally {
      setIsHistoryLoading(false);
      setHistoryLoaded(true);
    }
  }, [currentWorkspace, myRole, t]);

  useEffect(() => {
    void loadPaymentHistory();
  }, [loadPaymentHistory]);

  const handleUpgradeToPro = async () => {
    if (!currentWorkspace) {
      toast.error(t('toasts.workspaceRequired'));
      return;
    }
    if (myRole !== 'OWNER') {
      toast.error(t('toasts.ownerOnly'));
      return;
    }

    setIsUpgrading(true);
    try {
      const prepareData = await billingApi.preparePayment(currentWorkspace.id);

      if (!prepareData.clientKey) {
        toast.error(t('toasts.sdkNotLoaded'));
        return;
      }

      await openTossCheckout({
        clientKey: prepareData.clientKey,
        amount: prepareData.amount,
        orderId: prepareData.orderId,
        orderName: prepareData.orderName,
        customerEmail: prepareData.customerEmail,
        customerName: prepareData.customerName,
        successUrl: `${window.location.origin}/${locale}/payment/success?workspaceId=${currentWorkspace.id}`,
        failUrl: `${window.location.origin}/${locale}/payment/fail?workspaceId=${currentWorkspace.id}`,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('toasts.upgradeError')));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentWorkspace) {
      toast.error(t('toasts.workspaceRequired'));
      return;
    }
    if (myRole !== 'OWNER') {
      toast.error(t('toasts.ownerOnly'));
      return;
    }
    if (!confirm(t('actions.confirmCancel'))) {
      return;
    }

    setIsCancelling(true);
    try {
      await billingApi.cancelSubscription(currentWorkspace.id);
      await refreshSubscription(currentWorkspace.id);
      await loadPaymentHistory();
      toast.success(t('toasts.cancelScheduled'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('toasts.cancelError')));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={
            isDarkMode
              ? 'border-gray-800 bg-linear-to-br from-gray-900 via-gray-900 to-gray-800'
              : 'border-gray-200 bg-linear-to-br from-white via-white to-gray-50 shadow-sm'
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}
              >
                <CreditCard
                  className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                />
              </div>
              <div className="space-y-1">
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {t('planInfo.title')}
                </CardTitle>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {t('description')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('planInfo.plan')}
              </span>
              <div className="flex items-center gap-2 text-right">
                <span
                  className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {planInfo.name}
                </span>
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  (
                  {planInfo.price === 0
                    ? t('planInfo.freeLabel')
                    : formatPrice(planInfo.price, localeTag)}
                  {billingPeriodLabel})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('planInfo.status')}
              </span>
              <Badge
                variant={subscription?.active ? 'default' : 'outline'}
                className={
                  cancelAtPeriodEnd
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-600'
                    : subscription?.active
                      ? 'border-green-500/20 bg-green-500/10 text-green-500'
                      : 'border-gray-500/20 bg-gray-500/10 text-gray-500'
                }
              >
                {subscriptionStatusLabel}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {cancelAtPeriodEnd ? t('planInfo.endsAt') : t('planInfo.nextBilling')}
              </span>
              <div className="flex items-center gap-2">
                <Calendar
                  className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {subscription?.expiredAt
                    ? formatBillingDate(subscription.expiredAt, localeTag)
                    : t('planInfo.noBillingDate')}
                </span>
              </div>
            </div>

            <div
              className={`grid grid-cols-2 gap-3 border-t pt-2 ${
                isDarkMode ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              {[
                {
                  label: t('limits.maxEndpoints'),
                  value: limits.maxEndpointsPerProject,
                },
                {
                  label: t('limits.minInterval'),
                  value: `${limits.minCheckInterval}s`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className={`rounded-lg p-3 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}
                >
                  <p
                    className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {!isPro && (
              <div
                className={`space-y-3 border-t pt-4 ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}
              >
                <Button
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading || !canManageBilling}
                  className="flex w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isUpgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('actions.upgradeToPro')
                  )}
                </Button>
                {!canManageBilling && (
                  <p
                    className={`text-sm ${
                      isDarkMode ? 'text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    {t('notes.ownerOnly')}
                  </p>
                )}
              </div>
            )}

            {isPro && canManageBilling && (
              <div
                className={`space-y-3 border-t pt-4 ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}
              >
                {cancelAtPeriodEnd ? (
                  <p
                    className={`text-sm ${
                      isDarkMode ? 'text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    {t('planInfo.cancelScheduled')}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="flex w-full gap-2 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('actions.cancelSubscription')}
                  </Button>
                )}
              </div>
            )}

            {latestSuccessfulPayment && (
              <div
                className={`rounded-xl border p-4 ${
                  isDarkMode
                    ? 'border-gray-800 bg-gray-900/80'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p
                      className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {t('history.latestPaidAt')}
                    </p>
                    <p
                      className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatBillingDate(latestSuccessfulPayment.paidAt, localeTag)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {t('history.latestAmount')}
                    </p>
                    <p
                      className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatPrice(latestSuccessfulPayment.amount, localeTag)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card
          className={
            isDarkMode
              ? 'border-gray-800 bg-gray-900'
              : 'border-gray-200 bg-white shadow-sm'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
                }`}
              >
                <ReceiptText
                  className={`h-5 w-5 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                />
              </div>
              <div className="space-y-1">
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {t('history.title')}
                </CardTitle>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {t('history.description')}
                </p>
              </div>
            </div>
            {canManageBilling && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadPaymentHistory()}
                disabled={isHistoryLoading}
                className="gap-2"
              >
                {isHistoryLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t('history.refresh')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!currentWorkspace && (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t('toasts.workspaceRequired')}
              </p>
            )}

            {currentWorkspace && !canManageBilling && (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t('history.ownerOnly')}
              </p>
            )}

            {canManageBilling && isHistoryLoading && !historyLoaded && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('history.loading')}
              </div>
            )}

            {canManageBilling &&
              !isHistoryLoading &&
              historyLoaded &&
              payments.length === 0 && (
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {t('history.empty')}
                </p>
              )}

            {canManageBilling && payments.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('history.columns.orderId')}</TableHead>
                    <TableHead>{t('history.columns.plan')}</TableHead>
                    <TableHead>{t('history.columns.status')}</TableHead>
                    <TableHead className="text-right">
                      {t('history.columns.amount')}
                    </TableHead>
                    <TableHead>{t('history.columns.paidAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="max-w-[240px] font-mono text-xs">
                        <span className="block truncate" title={payment.orderId}>
                          {payment.orderId}
                        </span>
                      </TableCell>
                      <TableCell>{payment.planType}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={PAYMENT_BADGE_CLASSNAME[payment.status]}
                        >
                          {t(`history.status.${payment.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(payment.amount, localeTag)}
                      </TableCell>
                      <TableCell>
                        {formatBillingDate(payment.paidAt, localeTag)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
