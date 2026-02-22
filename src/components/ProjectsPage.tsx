'use client';

import { useRouter } from '@/i18n/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Globe, Settings, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import * as projectsApi from '@/lib/api/projects';
import type { ProjectWithStats } from '@/types/api';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';
import { PlanLimitBanner } from '@/components/PlanLimitBanner';
import { getProjectsWithStats } from '@/lib/project-stats';

export function ProjectsPage() {
  const router = useRouter();
  const isDarkMode = useDarkMode();
  const t = useTranslations('projects');
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const projectsWithStats = await getProjectsWithStats();

      setProjects(projectsWithStats);
      setError(null);
    } catch {
      setError(t('errors.loadProjects'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error(t('errors.enterProjectName'));
      return;
    }
    setIsCreating(true);
    try {
      const created = await projectsApi.createProject({
        name: newProjectName,
        description: newProjectDesc || undefined,
      });
      toast.success(t('toasts.projectCreated'));
      setIsCreateOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      router.push(`/projects/${created.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.createProjectFailed')));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            {error}
          </p>
          <Button onClick={fetchProjects} variant="outline">
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 플랜 제한 배너 */}
      <PlanLimitBanner type="project" current={projects.length} />

      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {t('title')}
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            {t('subtitle')}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('newProject')}
            </Button>
          </DialogTrigger>
          <DialogContent
            className={isDarkMode ? 'bg-gray-900 border-gray-800' : ''}
          >
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : ''}>
                {t('createDialog.title')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className={isDarkMode ? 'text-gray-300' : ''}>
                  {t('createDialog.projectName')}
                </Label>
                <Input
                  placeholder={t('createDialog.projectNamePlaceholder')}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className={isDarkMode ? 'text-gray-300' : ''}>
                  {t('createDialog.description')}
                </Label>
                <Textarea
                  placeholder={t('createDialog.descriptionPlaceholder')}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className={
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''
                  }
                />
              </div>
              <Button
                onClick={handleCreateProject}
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isCreating
                  ? t('createDialog.creating')
                  : t('createDialog.createProject')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div
            className={`col-span-full text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <Card
                className={`transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                    : 'bg-white border-gray-300 shadow-sm hover:shadow-lg'
                }`}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <CardTitle
                        className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {project.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <p
                    className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {project.description || t('noDescription')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {t('metrics.endpoints')}
                        </span>
                        <span
                          className={
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }
                        >
                          {project.stats.totalEndpoints}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {t('metrics.status')}
                        </span>
                        <span
                          className={
                            project.stats.downCount === 0
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }
                        >
                          {t('metrics.statusValue', {
                            up: project.stats.upCount,
                            down: project.stats.downCount,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {t('metrics.avgResponse')}
                        </span>
                        <span
                          className={
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }
                        >
                          {Math.round(project.stats.avgResponseTimeMs)}ms
                        </span>
                      </div>

                      <div
                        className={`pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                      >
                        <Badge
                          variant={
                            project.stats.downCount === 0
                              ? 'outline'
                              : 'default'
                          }
                          className="w-full justify-center"
                        >
                          {project.stats.downCount === 0
                            ? t('status.allOperational')
                            : t('status.needsAttention')}
                        </Badge>
                      </div>
                    </>
                  )}

                  {!project.stats && (
                    <div
                      className={`pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                    >
                      <Badge
                        variant="outline"
                        className="w-full justify-center"
                      >
                        {t('status.noEndpoints')}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
