"use client"

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Play, Edit, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PageLoadingState, PageErrorState } from "./ui/page-states";
import * as endpointsApi from "@/lib/api/endpoints";
import * as healthChecksApi from "@/lib/api/health-checks";
import * as incidentsApi from "@/lib/api/incidents";
import type { EndpointResponse, HealthCheckResult, EndpointStats, HourlyStats, IncidentResponse } from "@/types/api";
import { toast } from "sonner";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useLocale, useTranslations } from "next-intl";
import { EndpointStatsCards } from "@/components/endpoint-detail/EndpointStatsCards";
import { EndpointCharts } from "@/components/endpoint-detail/EndpointCharts";
import { RecentChecksTable } from "@/components/endpoint-detail/RecentChecksTable";
import { useWorkspace } from "@/contexts/workspace-context";
import { canEdit } from "@/lib/permissions";
import { useEndpointCheckStream } from "@/hooks/use-health-check-stream";

export function EndpointDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isDarkMode = useDarkMode();
  const t = useTranslations("endpointDetail");
  const locale = useLocale();
  const { myRole } = useWorkspace();
  const [endpoint, setEndpoint] = useState<EndpointResponse | null>(null);
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [stats, setStats] = useState<EndpointStats | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const canWrite = canEdit(myRole);

  const endpointId = Number(params.endpointId);
  const projectId = params.id;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ep, checkList, statsData, hourly, incidentList] = await Promise.all([
        endpointsApi.getEndpoint(endpointId),
        healthChecksApi.getChecks(endpointId, 20),
        healthChecksApi.getStats(endpointId),
        healthChecksApi.getHourlyStats(endpointId),
        incidentsApi.getEndpointIncidents(endpointId),
      ]);
      setEndpoint(ep);
      setChecks(checkList);
      setStats(statsData);
      setHourlyStats(hourly);
      setIncidents(incidentList);
      setError(null);
    } catch {
      setError(t('errors.loadData'));
    } finally {
      setIsLoading(false);
    }
  }, [endpointId, t]);

  useEffect(() => {
    if (endpointId) fetchData();
  }, [endpointId, fetchData]);

  // 실시간 헬스체크 결과 수신
  const handleRealtimeCheck = useCallback((result: HealthCheckResult) => {
    setChecks((prev) => [result, ...prev.slice(0, 19)]);

    // 통계를 점진적으로 업데이트
    setStats((prev) => {
      if (!prev) return prev;
      const newTotal = prev.totalChecks + 1;
      const newSuccess = prev.successCount + (result.status === 'SUCCESS' ? 1 : 0);
      return {
        ...prev,
        totalChecks: newTotal,
        successCount: newSuccess,
        successRate: newTotal > 0 ? (newSuccess / newTotal) * 100 : 0,
        avgResponseTimeMs: result.responseTimeMs
          ? (prev.avgResponseTimeMs * prev.totalChecks + result.responseTimeMs) / newTotal
          : prev.avgResponseTimeMs,
      };
    });

    // 엔드포인트의 lastCheckedAt 업데이트
    setEndpoint((prev) => prev ? { ...prev, lastCheckedAt: result.checkedAt } : prev);
  }, []);

  useEndpointCheckStream(endpointId, handleRealtimeCheck);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await healthChecksApi.testEndpoint(endpointId);
      if (result.status === 'SUCCESS') {
        toast.success(t('toasts.checkSucceeded', {
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
        }));
      } else {
        toast.error(t('toasts.checkFailed', {
          status: result.status,
          detail: result.errorMessage || result.statusCode,
        }));
      }
      // Refresh data
      await fetchData();
    } catch {
      toast.error(t('errors.checkFailed'));
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (error || !endpoint) {
    return (
      <PageErrorState
        message={error || t('notFound')}
        onAction={() => router.push(`/projects/${projectId}`)}
        actionLabel={t('back')}
      />
    );
  }

  // Transform chart data
  const responseTimeData = hourlyStats.map((h) => ({
    time: new Date(h.hour).toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", { hour: '2-digit', minute: '2-digit' }),
    value: Math.round(h.avgResponseTimeMs),
  }));

  const uptimeData = stats
    ? [
        { name: t('charts.success'), value: stats.successCount },
        { name: t('charts.failed'), value: stats.totalChecks - stats.successCount },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/projects/${projectId}`)}
          className={isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{endpoint.url}</h1>
            <Badge className="bg-blue-100 text-blue-700">{endpoint.httpMethod}</Badge>
            <Badge variant="outline" className={endpoint.isActive ? 'border-green-500 text-green-700' : 'border-gray-400 text-gray-500'}>
              {endpoint.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {t('endpointMeta', {
              expectedStatusCode: endpoint.expectedStatusCode,
              checkInterval: endpoint.checkInterval,
            })}
            {endpoint.lastCheckedAt && ` · ${t('lastChecked')}: ${new Date(endpoint.lastCheckedAt).toLocaleString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <Button
              variant="outline"
              className={`gap-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : ''}`}
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {t('actions.testNow')}
            </Button>
          )}
          {canWrite && (
            <Button className="gap-2" onClick={() => router.push(`/projects/${projectId}/endpoints/${endpointId}/edit`)}>
              <Edit className="h-4 w-4" />
              {t('actions.edit')}
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <EndpointStatsCards
          stats={stats}
          checkInterval={endpoint.checkInterval}
        />
      )}

      <EndpointCharts
        responseTimeData={responseTimeData}
        uptimeData={uptimeData}
        hasChecks={Boolean(stats && stats.totalChecks > 0)}
      />

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

      <RecentChecksTable checks={checks} />
    </div>
  );
}
