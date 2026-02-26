'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('payment.fail');

  const reason = useMemo(() => {
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    return [code, message].filter(Boolean).join(' - ') || t('defaultReason');
  }, [searchParams, t]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            {reason}
          </p>
          <Button variant="outline" onClick={() => router.push('/billing')}>
            {t('goBilling')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
