"use client"

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Play, Edit, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { PageLoadingState, PageErrorState } from "./ui/page-states";
import * as endpointsApi from "@/lib/api/endpoints";
import * as healthChecksApi from "@/lib/api/health-checks";
import type { EndpointResponse, HealthCheckResult, EndpointStats, HourlyStats } from "@/types/api";
import { toast } from "sonner";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useLocale, useTranslations } from "next-intl";
import { EndpointStatsCards } from "@/components/endpoint-detail/EndpointStatsCards";
import { EndpointCharts } from "@/components/endpoint-detail/EndpointCharts";
import { RecentChecksTable } from "@/components/endpoint-detail/RecentChecksTable";

export function EndpointDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isDarkMode = useDarkMode();
  const t = useTranslations("endpointDetail");
  const locale = useLocale();
  const [endpoint, setEndpoint] = useState<EndpointResponse | null>(null);
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [stats, setStats] = useState<EndpointStats | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const endpointId = Number(params.endpointId);
  const projectId = params.id;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ep, checkList, statsData, hourly] = await Promise.all([
        endpointsApi.getEndpoint(endpointId),
        healthChecksApi.getChecks(endpointId, 20),
        healthChecksApi.getStats(endpointId),
        healthChecksApi.getHourlyStats(endpointId),
      ]);
      setEndpoint(ep);
      setChecks(checkList);
      setStats(statsData);
      setHourlyStats(hourly);
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
          <Button
            variant="outline"
            className={`gap-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : ''}`}
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {t('actions.testNow')}
          </Button>
          <Button className="gap-2" onClick={() => router.push(`/projects/${projectId}/endpoints/${endpointId}/edit`)}>
            <Edit className="h-4 w-4" />
            {t('actions.edit')}
          </Button>
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

      <RecentChecksTable checks={checks} />
    </div>
  );
}
