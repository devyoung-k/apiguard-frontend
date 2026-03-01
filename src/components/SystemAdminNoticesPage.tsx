'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { SystemAdminGuard } from '@/components/SystemAdminGuard';
import { PageErrorState, PageLoadingState } from '@/components/ui/page-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as noticesApi from '@/lib/api/notices';
import type { NoticeResponse } from '@/types/api';

interface NoticeFormState {
  title: string;
  content: string;
  pinned: boolean;
}

const EMPTY_FORM: NoticeFormState = {
  title: '',
  content: '',
  pinned: false,
};

export function SystemAdminNoticesPage() {
  const t = useTranslations('systemAdmin.notices');
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NoticeFormState>(EMPTY_FORM);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [deletingNotice, setDeletingNotice] = useState<NoticeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingNoticeId(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error(t('errors.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingNoticeId) {
        const updated = await noticesApi.updateNotice(editingNoticeId, {
          title: form.title.trim(),
          content: form.content.trim(),
          pinned: form.pinned,
        });
        setNotices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success(t('toasts.updated'));
      } else {
        const created = await noticesApi.createNotice({
          title: form.title.trim(),
          content: form.content.trim(),
          pinned: form.pinned,
        });
        setNotices((prev) => [created, ...prev]);
        toast.success(t('toasts.created'));
      }
      resetForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (noticeId: number) => {
    try {
      const detail = await noticesApi.getNotice(noticeId);
      setEditingNoticeId(noticeId);
      setForm({
        title: detail.title,
        content: detail.content,
        pinned: detail.pinned,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.detailFailed')));
    }
  };

  const handleDelete = async () => {
    if (!deletingNotice) {
      return;
    }

    setIsSubmitting(true);
    try {
      await noticesApi.deleteNotice(deletingNotice.id);
      setNotices((prev) => prev.filter((item) => item.id !== deletingNotice.id));
      setDeletingNotice(null);
      toast.success(t('toasts.deleted'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.deleteFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SystemAdminGuard>
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

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingNoticeId ? t('form.editTitle') : t('form.createTitle')}
          </h2>
          <div className="space-y-2">
            <Input
              placeholder={t('form.titlePlaceholder')}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder={t('form.contentPlaceholder')}
              rows={6}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <Switch
                checked={form.pinned}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, pinned: checked }))}
              />
              {t('form.pinned')}
            </label>
            <div className="flex gap-2">
              <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {editingNoticeId ? t('actions.update') : t('actions.create')}
              </Button>
              {editingNoticeId && (
                <Button variant="outline" onClick={resetForm}>
                  {t('actions.cancelEdit')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <PageLoadingState />
        ) : error ? (
          <PageErrorState message={error} onAction={() => void fetchNotices()} actionLabel={t('actions.retry')} />
        ) : (
          <div className="space-y-3">
            {sortedNotices.map((notice) => (
              <div key={notice.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{notice.title}</h3>
                      {notice.pinned && <Badge>{t('list.pinned')}</Badge>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('list.meta', {
                        createdAt: new Date(notice.createdAt).toLocaleString(),
                        updatedAt: new Date(notice.updatedAt).toLocaleString(),
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void handleEdit(notice.id)}>
                      {t('actions.edit')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingNotice(notice)}>
                      {t('actions.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {sortedNotices.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={Boolean(deletingNotice)} onOpenChange={(open) => !open && setDeletingNotice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description', {
                title: deletingNotice?.title ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingNotice(null)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isSubmitting}>
              {t('actions.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SystemAdminGuard>
  );
}
