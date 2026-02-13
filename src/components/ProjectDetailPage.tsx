"use client"

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, ArrowLeft, Play, Edit, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { motion } from "framer-motion";
import { PageLoadingState, PageErrorState } from "./ui/page-states";
import * as projectsApi from "@/lib/api/projects";
import * as endpointsApi from "@/lib/api/endpoints";
import * as healthChecksApi from "@/lib/api/health-checks";
import type { ProjectResponse, EndpointResponse } from "@/types/api";
import { toast } from "sonner";
import { useDarkMode } from "@/hooks/use-dark-mode";

export function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isDarkMode = useDarkMode();
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
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

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
      setEndpoints((prev) => prev.map((ep) => (ep.id === endpointId ? updated : ep)));
      toast.success(`엔드포인트가 ${updated.isActive ? '활성화' : '비활성화'}되었습니다.`);
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (endpointId: number) => {
    if (!confirm('이 엔드포인트를 삭제하시겠습니까?')) return;
    try {
      await endpointsApi.deleteEndpoint(endpointId);
      setEndpoints((prev) => prev.filter((ep) => ep.id !== endpointId));
      toast.success('엔드포인트가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleTest = async (endpointId: number) => {
    try {
      const result = await healthChecksApi.testEndpoint(endpointId);
      if (result.status === 'SUCCESS') {
        toast.success(`체크 성공! ${result.statusCode} - ${result.responseTimeMs}ms`);
      } else {
        toast.error(`체크 실패: ${result.status} - ${result.errorMessage || result.statusCode}`);
      }
    } catch {
      toast.error('체크 실행에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (error || !project) {
    return (
      <PageErrorState
        message={error || '프로젝트를 찾을 수 없습니다.'}
        onAction={handleBack}
        actionLabel="프로젝트 목록으로"
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
            <h1 className={`text-3xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{project.name}</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{project.description || 'No description'}</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => router.push(`/projects/${projectId}/endpoints/new`)}>
          <Plus className="h-4 w-4" />
          Add Endpoint
        </Button>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.length === 0 ? (
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardContent className="py-12 text-center">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                엔드포인트가 없습니다. 새 엔드포인트를 추가해 보세요.
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
              <Card className={`transition-all ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  : 'bg-white border-gray-300 shadow-sm hover:shadow-md'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => router.push(`/projects/${projectId}/endpoints/${endpoint.id}`)}
                    >
                      <Badge variant="outline" className={getMethodColor(endpoint.httpMethod)}>
                        {endpoint.httpMethod}
                      </Badge>
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {endpoint.url}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Expected: {endpoint.expectedStatusCode} · Interval: {endpoint.checkInterval}s
                          {endpoint.lastCheckedAt && ` · Last checked: ${new Date(endpoint.lastCheckedAt).toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(endpoint.id)}
                        title="즉시 체크"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/endpoints/${endpoint.id}/edit`)}
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