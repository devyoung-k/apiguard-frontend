import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  HealthCheckResult,
  EndpointStats,
  HourlyStats,
  ProjectStats,
} from '@/types/api';

export async function testEndpoint(endpointId: number): Promise<HealthCheckResult> {
  const res = await apiClient.post<ApiResponse<HealthCheckResult>>(
    `/endpoints/${endpointId}/test`,
  );
  return res.data.data!;
}

export async function getChecks(
  endpointId: number,
  limit: number = 20,
): Promise<HealthCheckResult[]> {
  const res = await apiClient.get<ApiResponse<HealthCheckResult[]>>(
    `/endpoints/${endpointId}/checks`,
    { params: { limit } },
  );
  return res.data.data!;
}

export async function getStats(endpointId: number): Promise<EndpointStats> {
  const res = await apiClient.get<ApiResponse<EndpointStats>>(
    `/endpoints/${endpointId}/stats`,
  );
  return res.data.data!;
}

export async function getHourlyStats(endpointId: number): Promise<HourlyStats[]> {
  const res = await apiClient.get<ApiResponse<HourlyStats[]>>(
    `/endpoints/${endpointId}/stats/hourly`,
  );
  return res.data.data!;
}

export async function getProjectStats(projectId: number): Promise<ProjectStats> {
  const res = await apiClient.get<ApiResponse<ProjectStats>>(
    `/projects/${projectId}/stats`,
  );
  return res.data.data!;
}
