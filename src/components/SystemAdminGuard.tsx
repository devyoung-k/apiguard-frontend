'use client';

import type { ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface SystemAdminGuardProps {
  children: ReactNode;
}

export function SystemAdminGuard({ children }: SystemAdminGuardProps) {
  const { isLoading, isAuthenticated, isSystemAdmin } = useAuth();
  const router = useRouter();
  const t = useTranslations('systemAdmin.guard');

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isSystemAdmin) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('description')}</p>
            <Button onClick={() => router.push('/dashboard')}>
              {t('goDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
