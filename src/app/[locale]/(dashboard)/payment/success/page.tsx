'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useWorkspace } from '@/contexts/workspace-context';
import { usePlan } from '@/contexts/plan-context';
import * as billingApi from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { refreshSubscription } = usePlan();
  const t = useTranslations('payment.success');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');

  const payload = useMemo(() => {
    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = Number(searchParams.get('amount'));
    if (!orderId || !paymentKey || !Number.isFinite(amount)) {
      return null;
    }
    return { orderId, paymentKey, amount };
  }, [searchParams]);

  useEffect(() => {
    const confirm = async () => {
      if (!currentWorkspace || !payload) {
        setStatus('error');
        setErrorMessage(t('missingParams'));
        return;
      }

      try {
        await billingApi.confirmPayment(currentWorkspace.id, payload);
        await refreshSubscription();
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(getApiErrorMessage(error, t('confirmFailed')));
      }
    };

    void confirm();
  }, [currentWorkspace, payload, refreshSubscription, t]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('confirming')}
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {t('done')}
              </p>
              <Button onClick={() => router.push('/billing')}>
                {t('goBilling')}
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errorMessage}
              </p>
              <Button variant="outline" onClick={() => router.push('/billing')}>
                {t('goBilling')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
