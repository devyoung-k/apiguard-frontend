"use client"

import { Activity, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, AlertCircle, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { StatCard } from "./StatCard";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as projectsApi from "@/lib/api/projects";
import * as healthChecksApi from "@/lib/api/health-checks";
import type { ProjectResponse, ProjectStats } from "@/types/api";
import { Loader2 } from "lucide-react";

interface ProjectWithStats extends ProjectResponse {
  stats?: ProjectStats;
}

export function DashboardPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const projectList = await projectsApi.getProjects();
        
        // 각 프로젝트의 통계도 함께 로드
        const projectsWithStats = await Promise.all(
          projectList.map(async (project) => {
            try {
              const stats = await healthChecksApi.getProjectStats(project.id);
              return { ...project, stats };
            } catch {
              return { ...project };
            }
          })
        );
        
        setProjects(projectsWithStats);
        setError(null);
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const isDarkMode = mounted && (theme === 'dark' || theme === 'system');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // 통계 계산
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
          <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Monitor your API endpoints in real-time
          </p>
        </div>
        <button
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
            title="Total Endpoints"
            value={totalEndpoints.toString()}
            icon={Activity}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Endpoints Up"
            value={totalUp.toString()}
            icon={CheckCircle}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title="Endpoints Down"
            value={totalDown.toString()}
            icon={XCircle}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <StatCard
            title="Avg Response"
            value={`${Math.round(avgResponseTime)}ms`}
            icon={Clock}
          />
        </motion.div>
      </div>

      {/* Projects Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Projects Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                프로젝트가 없습니다. 새 프로젝트를 만들어 보세요.
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                      isDarkMode
                        ? 'bg-gray-800/50 hover:bg-gray-800'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => router.push(`/projects/${project.id}`)}
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
                          {project.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {project.stats && (
                        <>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {project.stats.upCount} up
                            </span>
                          </div>
                          {project.stats.downCount > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-500" />
                              <span className="text-red-500">
                                {project.stats.downCount} down
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