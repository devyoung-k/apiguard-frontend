import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  AlertResponse,
  CreateAlertRequest,
  UpdateAlertRequest,
} from '@/types/api';

export async function createAlert(
  endpointId: number,
  data: CreateAlertRequest,
): Promise<AlertResponse> {
  const res = await apiClient.post<ApiResponse<AlertResponse>>(
    `/endpoints/${endpointId}/alerts`,
    data,
  );
  return res.data.data!;
}

export async function getAlerts(endpointId: number): Promise<AlertResponse[]> {
  const res = await apiClient.get<ApiResponse<AlertResponse[]>>(
    `/endpoints/${endpointId}/alerts`,
  );
  return res.data.data!;
}

export async function updateAlert(
  id: number,
  data: UpdateAlertRequest,
): Promise<AlertResponse> {
  const res = await apiClient.put<ApiResponse<AlertResponse>>(`/alerts/${id}`, data);
  return res.data.data!;
}

export async function deleteAlert(id: number): Promise<void> {
  await apiClient.delete<ApiResponse>(`/alerts/${id}`);
}

export async function toggleAlert(id: number): Promise<AlertResponse> {
  const res = await apiClient.patch<ApiResponse<AlertResponse>>(`/alerts/${id}/toggle`);
  return res.data.data!;
}
