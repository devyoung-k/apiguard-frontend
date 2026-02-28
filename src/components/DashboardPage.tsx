"use client"

import { Activity, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, AlertCircle, Sun, Moon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { StatCard } from "./StatCard";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import type { ProjectWithStats } from "@/types/api";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useTranslations } from "next-intl";
import { getProjectsWithStats } from "@/lib/project-stats";
import { useWorkspace } from "@/contexts/workspace-context";

export function DashboardPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const isDarkMode = useDarkMode();
  const t = useTranslations("dashboard");
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!currentWorkspace) {
          setProjects([]);
          setError(null);
          return;
        }

        const projectsWithStats = await getProjectsWithStats(currentWorkspace.id);

        setProjects(projectsWithStats);
        setError(null);
      } catch {
        setError(t('errors.loadData'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentWorkspace, t]);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  // Aggregate stats
  const totalEndpoints = projects.reduce((sum, p) => sum + (p.stats?.totalEndpoints || 0), 0);
  const totalUp = projects.reduce((sum, p) => sum + (p.stats?.upCount || 0), 0);
  const totalDown = projects.reduce((sum, p) => sum + (p.stats?.downCount || 0), 0);
  const avgResponseTime = projects.length > 0
    ? projects.reduce((sum, p) => sum + (p.stats?.avgResponseTimeMs || 0), 0) / projects.filter(p => p.stats).length || 0
    : 0;

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
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('title')}</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            {t('subtitle')}
          </p>
        </div>
        <button
          type="button"
          aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          onClick={toggleTheme}
          className={`p-3 rounded-xl transition-all ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
              : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm'
          }`}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title={t('stats.totalEndpoints')}
            value={totalEndpoints.toString()}
            icon={Activity}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title={t('stats.endpointsUp')}
            value={totalUp.toString()}
            icon={CheckCircle}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title={t('stats.endpointsDown')}
            value={totalDown.toString()}
            icon={XCircle}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <StatCard
            title={t('stats.avgResponse')}
            value={`${Math.round(avgResponseTime)}ms`}
            icon={Clock}
          />
        </motion.div>
      </div>

      {/* Projects Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('projectsOverview.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t('projectsOverview.empty')}
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${project.name} 상세 보기`}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                      isDarkMode
                        ? 'bg-gray-800/50 hover:bg-gray-800'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/projects/${project.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        !project.stats ? 'bg-gray-400' :
                        project.stats.downCount === 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {project.name}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {project.description || t('projectsOverview.noDescription')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {project.stats && (
                        <>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {t('projectsOverview.upCount', {count: project.stats.upCount})}
                            </span>
                          </div>
                          {project.stats.downCount > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-500" />
                              <span className="text-red-500">
                                {t('projectsOverview.downCount', {count: project.stats.downCount})}
                              </span>
                            </div>
                          )}
                          <Badge variant="outline">
                            {Math.round(project.stats.avgResponseTimeMs)}ms
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
