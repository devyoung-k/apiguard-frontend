"use client"

import { useRouter, useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft, Play, Edit, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import * as endpointsApi from "@/lib/api/endpoints";
import * as healthChecksApi from "@/lib/api/health-checks";
import type { EndpointResponse, HealthCheckResult, EndpointStats, HourlyStats } from "@/types/api";
import { toast } from "sonner";

const COLORS = ['#10b981', '#ef4444'];

export function EndpointDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [endpoint, setEndpoint] = useState<EndpointResponse | null>(null);
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [stats, setStats] = useState<EndpointStats | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const endpointId = Number(params.endpointId);
  const projectId = params.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (theme === 'dark' || theme === 'system');

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
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [endpointId]);

  useEffect(() => {
    if (endpointId) fetchData();
  }, [endpointId, fetchData]);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await healthChecksApi.testEndpoint(endpointId);
      if (result.status === 'SUCCESS') {
        toast.success(`체크 성공! ${result.statusCode} - ${result.responseTimeMs}ms`);
      } else {
        toast.error(`체크 실패: ${result.status} - ${result.errorMessage || result.statusCode}`);
      }
      // 데이터 새로고침
      await fetchData();
    } catch {
      toast.error('체크 실행에 실패했습니다.');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !endpoint) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{error || '엔드포인트를 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.push(`/projects/${projectId}`)} variant="outline">돌아가기</Button>
        </div>
      </div>
    );
  }

  // 차트 데이터 변환
  const responseTimeData = hourlyStats.map((h) => ({
    time: new Date(h.hour).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    value: Math.round(h.avgResponseTimeMs),
  }));

  const uptimeData = stats
    ? [
        { name: 'Success', value: stats.successCount },
        { name: 'Failed', value: stats.totalChecks - stats.successCount },
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
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{endpoint.url}</h1>
            <Badge className="bg-blue-100 text-blue-700">{endpoint.httpMethod}</Badge>
            <Badge variant="outline" className={endpoint.isActive ? 'border-green-500 text-green-700' : 'border-gray-400 text-gray-500'}>
              {endpoint.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Expected: {endpoint.expectedStatusCode} · Interval: {endpoint.checkInterval}s
            {endpoint.lastCheckedAt && ` · Last checked: ${new Date(endpoint.lastCheckedAt).toLocaleString()}`}
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
            Test Now
          </Button>
          <Button className="gap-2" onClick={() => router.push(`/projects/${projectId}/endpoints/${endpointId}/edit`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardContent className="pt-6">
              <div className="text-2xl text-green-600 mb-1">{stats.successRate.toFixed(2)}%</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Success Rate</div>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardContent className="pt-6">
              <div className={`text-2xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(stats.avgResponseTimeMs)}ms</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Response Time</div>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardContent className="pt-6">
              <div className={`text-2xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalChecks.toLocaleString()}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Checks</div>
            </CardContent>
          </Card>
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardContent className="pt-6">
              <div className={`text-2xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{endpoint.checkInterval}s</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Check Interval</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent className={isDarkMode ? 'bg-gray-900' : ''}>
              {responseTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="time" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  데이터가 아직 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Success vs Failed</CardTitle>
            </CardHeader>
            <CardContent className={isDarkMode ? 'bg-gray-900' : ''}>
              {uptimeData.length > 0 && stats && stats.totalChecks > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={uptimeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {uptimeData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  데이터가 아직 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Checks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            {checks.length === 0 ? (
              <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                체크 기록이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'border-gray-800 border-b' : 'border-b'}>
                      <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp</th>
                      <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status Code</th>
                      <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Response Time</th>
                      <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => (
                      <tr key={check.id} className={`border-b ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                        <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {new Date(check.checkedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={check.statusCode >= 200 && check.statusCode < 300 ? 'outline' : 'destructive'}
                            className={isDarkMode && check.statusCode >= 200 && check.statusCode < 300 ? 'border-green-500/50 text-green-400' : ''}
                          >
                            {check.statusCode}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{check.responseTimeMs}ms</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={check.status === 'SUCCESS' ? 'outline' : 'destructive'}
                            className={isDarkMode && check.status === 'SUCCESS' ? 'border-green-500/50 text-green-400' : ''}
                          >
                            {check.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
