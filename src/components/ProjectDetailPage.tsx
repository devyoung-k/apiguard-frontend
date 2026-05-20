'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, ArrowLeft, Play, Edit, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { motion } from 'framer-motion';
import { PageLoadingState, PageErrorState } from './ui/page-states';
import * as projectsApi from '@/lib/api/projects';
import * as endpointsApi from '@/lib/api/endpoints';
import * as healthChecksApi from '@/lib/api/health-checks';
import * as incidentsApi from '@/lib/api/incidents';
import type { ProjectResponse, EndpointResponse, IncidentResponse } from '@/types/api';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { PlanLimitBanner } from '@/components/PlanLimitBanner';
import { useWorkspace } from '@/contexts/workspace-context';
import { canDelete, canEdit } from '@/lib/permissions';
import { useProjectCheckStream } from '@/hooks/use-health-check-stream';
import type { HealthCheckResult } from '@/types/api';

export function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isDarkMode = useDarkMode();
  const t = useTranslations('projectDetail');
  const { myRole } = useWorkspace();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointResponse[]>([]);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const projectId = Number(params.id);
  const canWrite = canEdit(myRole);
  const canRemove = canDelete(myRole);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectData, endpointList, incidentList] = await Promise.all([
        projectsApi.getProject(projectId),
        endpointsApi.getEndpoints(projectId),
        incidentsApi.getProjectIncidents(projectId),
      ]);
      setProject(projectData);
      setEditProjectName(projectData.name);
      setEditProjectDescription(projectData.description ?? '');
      setEndpoints(endpointList);
      setIncidents(incidentList);
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

  // 실시간 헬스체크 결과 → 엔드포인트 lastCheckedAt 반영
  const handleRealtimeCheck = useCallback((result: HealthCheckResult) => {
    setEndpoints((prev) =>
      prev.map((ep) =>
        ep.id === result.endpointId
          ? { ...ep, lastCheckedAt: result.checkedAt }
          : ep,
      ),
    );
  }, []);

  useProjectCheckStream(projectId, handleRealtimeCheck);

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

  const handleSaveProject = async () => {
    if (!project || !editProjectName.trim()) {
      toast.error(t('errors.enterProjectName'));
      return;
    }

    setIsSavingProject(true);
    try {
      const updated = await projectsApi.updateProject(project.id, {
        name: editProjectName.trim(),
        description: editProjectDescription.trim(),
      });
      setProject(updated);
      setIsEditingProject(false);
      toast.success(t('toasts.projectUpdated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.updateProjectFailed')));
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !confirm(t('confirmDeleteProject'))) return;

    setIsDeletingProject(true);
    try {
      await projectsApi.deleteProject(project.id);
      toast.success(t('toasts.projectDeleted'));
      router.push('/projects');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.deleteProjectFailed')));
    } finally {
      setIsDeletingProject(false);
    }
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
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsEditingProject((prev) => !prev)}
            >
              {isEditingProject ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {isEditingProject ? t('cancel') : t('editProject')}
            </Button>
          )}
          {canRemove && (
            <Button
              variant="outline"
              className="gap-2 border-red-500/30 text-red-600"
              onClick={handleDeleteProject}
              disabled={isDeletingProject}
            >
              {isDeletingProject ? <Trash2 className="h-4 w-4 animate-pulse" /> : <Trash2 className="h-4 w-4" />}
              {t('deleteProject')}
            </Button>
          )}
          {canWrite && (
            <Button
              className="gap-2"
              onClick={() => router.push(`/projects/${projectId}/endpoints/new`)}
            >
              <Plus className="h-4 w-4" />
              {t('addEndpoint')}
            </Button>
          )}
        </div>
      </div>

      {isEditingProject && (
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('projectForm.name')}</Label>
              <Input
                value={editProjectName}
                onChange={(event) => setEditProjectName(event.target.value)}
                className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('projectForm.description')}</Label>
              <Textarea
                value={editProjectDescription}
                onChange={(event) => setEditProjectDescription(event.target.value)}
                className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
              />
            </div>
            <Button onClick={handleSaveProject} disabled={isSavingProject || !editProjectName.trim()}>
              {t('projectForm.save')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Limit Banner */}
      <PlanLimitBanner type="endpoint" current={endpoints.length} />

      <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('incidents.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('incidents.empty')}</p>
          ) : (
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className={`rounded-lg border p-3 ${
                    isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={incident.status === 'OPEN' ? 'destructive' : 'outline'}>
                      {t(`incidents.status.${incident.status}`)}
                    </Badge>
                    <Badge variant="outline">{t(`incidents.type.${incident.type}`)}</Badge>
                    {incident.status === 'RESOLVED' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    <span className={isDarkMode ? 'text-sm text-gray-300' : 'text-sm text-gray-700'}>
                      {incident.title}
                    </span>
                  </div>
                  {incident.description && (
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {incident.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(endpoint.id)}
                          title={t('runCheckNow')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
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
                      )}
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(endpoint.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      {canWrite && (
                        <Switch
                          checked={endpoint.isActive}
                          onCheckedChange={() => handleToggle(endpoint.id)}
                        />
                      )}
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
