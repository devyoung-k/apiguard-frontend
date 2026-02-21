import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client';
import type { AlertResponse, CreateAlertRequest, UpdateAlertRequest } from '@/types/api';

export async function createAlert(
  endpointId: number,
  data: CreateAlertRequest,
): Promise<AlertResponse> {
  return apiPost<AlertResponse, CreateAlertRequest>(`/endpoints/${endpointId}/alerts`, data);
}

export async function getAlerts(endpointId: number): Promise<AlertResponse[]> {
  return apiGet<AlertResponse[]>(`/endpoints/${endpointId}/alerts`);
}

export async function updateAlert(
  id: number,
  data: UpdateAlertRequest,
): Promise<AlertResponse> {
  return apiPut<AlertResponse, UpdateAlertRequest>(`/alerts/${id}`, data);
}

export async function deleteAlert(id: number): Promise<void> {
  await apiDelete(`/alerts/${id}`);
}

export async function toggleAlert(id: number): Promise<AlertResponse> {
  return apiPatch<AlertResponse>(`/alerts/${id}/toggle`);
}
