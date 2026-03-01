'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/lib/utils';
import { PageErrorState, PageLoadingState } from '@/components/ui/page-states';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as noticesApi from '@/lib/api/notices';
import type { NoticeResponse } from '@/types/api';

export function NoticesPage() {
  const t = useTranslations('notices');
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await noticesApi.getNotices();
      setNotices(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.loadFailed')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchNotices();
  }, [fetchNotices]);

  const sortedNotices = useMemo(
    () =>
      [...notices].sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        return Number(new Date(b.createdAt)) - Number(new Date(a.createdAt));
      }),
    [notices],
  );

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (error) {
    return <PageErrorState message={error} onAction={() => void fetchNotices()} actionLabel={t('actions.retry')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => void fetchNotices()}>
          {t('actions.refresh')}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedNotices.map((notice) => (
          <article key={notice.id} className="rounded-xl border bg-card p-4">
            <header className="mb-2 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{notice.title}</h2>
              {notice.pinned && <Badge>{t('pinned')}</Badge>}
            </header>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {t('meta', {
                createdAt: new Date(notice.createdAt).toLocaleString(),
                updatedAt: new Date(notice.updatedAt).toLocaleString(),
              })}
            </p>
          </article>
        ))}
        {sortedNotices.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
