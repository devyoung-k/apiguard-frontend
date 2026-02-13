"use client"

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Globe, Settings, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import * as projectsApi from "@/lib/api/projects";
import * as healthChecksApi from "@/lib/api/health-checks";
import type { ProjectWithStats } from "@/types/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";

export function ProjectsPage() {
  const router = useRouter();
  const isDarkMode = useDarkMode();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const projectList = await projectsApi.getProjects();

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
      setError('프로젝트를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('프로젝트 이름을 입력해 주세요.');
      return;
    }
    setIsCreating(true);
    try {
      const created = await projectsApi.createProject({
        name: newProjectName,
        description: newProjectDesc || undefined,
      });
      toast.success('프로젝트가 생성되었습니다.');
      setIsCreateOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      router.push(`/projects/${created.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, '프로젝트 생성에 실패했습니다.'));
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
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
          <Button onClick={fetchProjects} variant="outline">다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Projects</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your API monitoring projects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className={isDarkMode ? 'bg-gray-900 border-gray-800' : ''}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : ''}>새 프로젝트 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className={isDarkMode ? 'text-gray-300' : ''}>프로젝트 이름</Label>
                <Input
                  placeholder="My Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className={isDarkMode ? 'text-gray-300' : ''}>설명 (선택)</Label>
                <Textarea
                  placeholder="프로젝트에 대한 설명을 입력하세요"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                />
              </div>
              <Button onClick={handleCreateProject} className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isCreating ? '생성 중...' : '프로젝트 생성'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className={`col-span-full text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>프로젝트가 없습니다. 새 프로젝트를 만들어 보세요.</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
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
                      <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {project.name}
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {project.description || 'No description'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Endpoints</span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {project.stats.totalEndpoints}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</span>
                        <span className={project.stats.downCount === 0 ? 'text-green-500' : 'text-yellow-500'}>
                          {project.stats.upCount} up / {project.stats.downCount} down
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Response</span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {Math.round(project.stats.avgResponseTimeMs)}ms
                        </span>
                      </div>

                      <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <Badge variant={project.stats.downCount === 0 ? 'outline' : 'default'} className="w-full justify-center">
                          {project.stats.downCount === 0 ? '✓ All Systems Operational' : '⚠ Needs Attention'}
                        </Badge>
                      </div>
                    </>
                  )}

                  {!project.stats && (
                    <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                      <Badge variant="outline" className="w-full justify-center">
                        No endpoints yet
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