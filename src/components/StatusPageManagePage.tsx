'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Globe, Copy, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/contexts/workspace-context';
import { canEdit } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/utils';
import * as statusPageApi from '@/lib/api/status-page';
import type { StatusPageResponse } from '@/types/api';

export function StatusPageManagePage() {
  const isDarkMode = useDarkMode();
  const t = useTranslations('statusPage');
  const { currentWorkspace, myRole } = useWorkspace();
  const canWrite = canEdit(myRole);

  const [statusPage, setStatusPage] = useState<StatusPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 생성 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchStatusPage = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);
      const data = await statusPageApi.getStatusPage(currentWorkspace.id);
      setStatusPage(data);
      setNotFound(false);
    } catch {
      setStatusPage(null);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchStatusPage();
  }, [fetchStatusPage]);

  const handleCreate = async () => {
    if (!currentWorkspace || !title.trim() || !slug.trim()) return;
    setIsCreating(true);
    try {
      const data = await statusPageApi.createStatusPage(currentWorkspace.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        slug: slug.trim(),
      });
      setStatusPage(data);
      setNotFound(false);
      toast.success(t('toasts.created'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('errors.createFailed')));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!currentWorkspace || !statusPage) return;
    try {
      const data = await statusPageApi.updateStatusPage(currentWorkspace.id, {
        isPublic: !statusPage.isPublic,
      });
      setStatusPage(data);
      toast.success(t('toasts.updated'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('errors.updateFailed')));
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace || !confirm(t('manage.confirmDelete'))) return;
    try {
      await statusPageApi.deleteStatusPage(currentWorkspace.id);
      setStatusPage(null);
      setNotFound(true);
      setTitle('');
      setDescription('');
      setSlug('');
      toast.success(t('toasts.deleted'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('errors.deleteFailed')));
    }
  };

  const handleCopyLink = () => {
    if (!statusPage) return;
    const url = `${window.location.origin}/status/${statusPage.slug}`;
    navigator.clipboard.writeText(url);
    toast.success(t('manage.linkCopied'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('title')}
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {t('subtitle')}
        </p>
      </div>

      {/* 기존 상태 페이지 표시 */}
      {statusPage && (
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Globe className="h-5 w-5 text-blue-500" />
              {statusPage.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 공개 링크 */}
            <div>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('manage.publicLink')}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/status/${statusPage.slug}`}
                  className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : ''}
                />
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => window.open(`/status/${statusPage.slug}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 공개/비공개 토글 */}
            {canWrite && (
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('manage.visibility')}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {statusPage.isPublic ? t('manage.public') : t('manage.private')}
                  </p>
                </div>
                <Switch
                  checked={statusPage.isPublic}
                  onCheckedChange={handleToggleVisibility}
                />
              </div>
            )}

            {/* 삭제 */}
            {canWrite && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t('manage.delete')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 상태 페이지 생성 폼 */}
      {notFound && canWrite && (
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              {t('create.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('create.titleLabel')}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('create.titlePlaceholder')}
                className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('create.descriptionLabel')}
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('create.descriptionPlaceholder')}
                className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('create.slugLabel')}
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={t('create.slugPlaceholder')}
                className={`mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {t('create.slugHelp', { slug: slug || 'my-api-status' })}
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !title.trim() || !slug.trim()}
              className="w-full"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('create.submit')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* VIEWER일 때 빈 상태 */}
      {notFound && !canWrite && (
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardContent className="py-12 text-center">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {t('empty')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
