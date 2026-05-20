import { apiGet } from '@/lib/api-client';
import type { IncidentResponse, IncidentStatus } from '@/types/api';

export function getProjectIncidents(
  projectId: number,
  status?: IncidentStatus,
): Promise<IncidentResponse[]> {
  return apiGet<IncidentResponse[]>(`/projects/${projectId}/incidents`, {
    params: status ? { status } : undefined,
  });
}

export function getEndpointIncidents(
  endpointId: number,
): Promise<IncidentResponse[]> {
  return apiGet<IncidentResponse[]>(`/endpoints/${endpointId}/incidents`);
}
