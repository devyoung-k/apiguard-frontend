import { apiGet, apiPost } from '@/lib/api-client';
import type { HealthCheckResult, EndpointStats, HourlyStats, ProjectStats } from '@/types/api';

export async function testEndpoint(endpointId: number): Promise<HealthCheckResult> {
  return apiPost<HealthCheckResult>(`/endpoints/${endpointId}/test`);
}

export async function getChecks(
  endpointId: number,
  limit: number = 20,
): Promise<HealthCheckResult[]> {
  return apiGet<HealthCheckResult[]>(
    `/endpoints/${endpointId}/checks`,
    { params: { limit } },
  );
}

export async function getStats(endpointId: number): Promise<EndpointStats> {
  return apiGet<EndpointStats>(`/endpoints/${endpointId}/stats`);
}

export async function getHourlyStats(endpointId: number): Promise<HourlyStats[]> {
  return apiGet<HourlyStats[]>(`/endpoints/${endpointId}/stats/hourly`);
}

export async function getProjectStats(projectId: number): Promise<ProjectStats> {
  return apiGet<ProjectStats>(`/projects/${projectId}/stats`);
}
