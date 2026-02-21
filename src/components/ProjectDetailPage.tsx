'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Plus, ArrowLeft, Play, Edit, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { motion } from 'framer-motion';
import { PageLoadingState, PageErrorState } from './ui/page-states';
import * as projectsApi from '@/lib/api/projects';
import * as endpointsApi from '@/lib/api/endpoints';
import * as healthChecksApi from '@/lib/api/health-checks';
import type { ProjectResponse, EndpointResponse } from '@/types/api';
import { toast } from 'sonner';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { PlanLimitBanner } from '@/components/PlanLimitBanner';

export function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isDarkMode = useDarkMode();
  const t = useTranslations('projectDetail');
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = Number(params.id);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectData, endpointList] = await Promise.all([
        projectsApi.getProject(projectId),
        endpointsApi.getEndpoints(projectId),
      ]);
      setProject(projectData);
      setEndpoints(endpointList);
      setError(null);
    } catch {
      setError(t('errors.loadData'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId, fetchData]);

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'text-green-500',
      POST: 'text-blue-500',
      PUT: 'text-yellow-500',
      PATCH: 'text-orange-500',
      DELETE: 'text-red-500',
    };
    return colors[method] || 'text-gray-500';
  };

  const handleBack = () => {
    router.push('/projects');
  };

  const handleToggle = async (endpointId: number) => {
    try {
      const updated = await endpointsApi.toggleEndpoint(endpointId);
      setEndpoints((prev) =>
        prev.map((ep) => (ep.id === endpointId ? updated : ep)),
      );
      toast.success(
        updated.isActive
          ? t('toasts.endpointEnabled')
          : t('toasts.endpointDisabled'),
      );
    } catch {
      toast.error(t('errors.toggleFailed'));
    }
  };

  const handleDelete = async (endpointId: number) => {
    if (!confirm(t('confirmDeleteEndpoint'))) return;
    try {
      await endpointsApi.deleteEndpoint(endpointId);
      setEndpoints((prev) => prev.filter((ep) => ep.id !== endpointId));
      toast.success(t('toasts.endpointDeleted'));
    } catch {
      toast.error(t('errors.deleteFailed'));
    }
  };

  const handleTest = async (endpointId: number) => {
    try {
      const result = await healthChecksApi.testEndpoint(endpointId);
      if (result.status === 'SUCCESS') {
        toast.success(
          t('toasts.checkSucceeded', {
            statusCode: result.statusCode,
            responseTimeMs: result.responseTimeMs,
          }),
        );
      } else {
        toast.error(
          t('toasts.checkFailed', {
            status: result.status,
            detail: result.errorMessage || result.statusCode,
          }),
        );
      }
    } catch {
      toast.error(t('errors.checkFailed'));
    }
  };

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (error || !project) {
    return (
      <PageErrorState
        message={error || t('notFound')}
        onAction={handleBack}
        actionLabel={t('backToProjects')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1
              className={`text-3xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {project.name}
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {project.description || t('noDescription')}
            </p>
          </div>
        </div>
        <Button
          className="gap-2"
          onClick={() => router.push(`/projects/${projectId}/endpoints/new`)}
        >
          <Plus className="h-4 w-4" />
          {t('addEndpoint')}
        </Button>
      </div>

      {/* Plan Limit Banner */}
      <PlanLimitBanner type="endpoint" current={endpoints.length} />

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.length === 0 ? (
          <Card
            className={
              isDarkMode
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-300 shadow-sm'
            }
          >
            <CardContent className="py-12 text-center">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t('empty')}
              </p>
            </CardContent>
          </Card>
        ) : (
          endpoints.map((endpoint, index) => (
            <motion.div
              key={endpoint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={`transition-all ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    : 'bg-white border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/projects/${projectId}/endpoints/${endpoint.id}`,
                        )
                      }
                    >
                      <Badge
                        variant="outline"
                        className={getMethodColor(endpoint.httpMethod)}
                      >
                        {endpoint.httpMethod}
                      </Badge>
                      <div>
                        <p
                          className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {endpoint.url}
                        </p>
                        <p
                          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {t('endpointMeta', {
                            expectedStatusCode: endpoint.expectedStatusCode,
                            checkInterval: endpoint.checkInterval,
                          })}
                          {endpoint.lastCheckedAt &&
                            ` · ${t('lastChecked')}: ${new Date(endpoint.lastCheckedAt).toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(endpoint.id)}
                        title={t('runCheckNow')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/projects/${projectId}/endpoints/${endpoint.id}/edit`,
                          )
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(endpoint.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Switch
                        checked={endpoint.isActive}
                        onCheckedChange={() => handleToggle(endpoint.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
