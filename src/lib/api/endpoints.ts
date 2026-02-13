import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  EndpointResponse,
  CreateEndpointRequest,
  UpdateEndpointRequest,
} from '@/types/api';

export async function createEndpoint(
  projectId: number,
  data: CreateEndpointRequest,
): Promise<EndpointResponse> {
  const res = await apiClient.post<ApiResponse<EndpointResponse>>(
    `/projects/${projectId}/endpoints`,
    data,
  );
  return res.data.data!;
}

export async function getEndpoints(projectId: number): Promise<EndpointResponse[]> {
  const res = await apiClient.get<ApiResponse<EndpointResponse[]>>(
    `/projects/${projectId}/endpoints`,
  );
  return res.data.data!;
}

export async function getEndpoint(id: number): Promise<EndpointResponse> {
  const res = await apiClient.get<ApiResponse<EndpointResponse>>(`/endpoints/${id}`);
  return res.data.data!;
}

export async function updateEndpoint(
  id: number,
  data: UpdateEndpointRequest,
): Promise<EndpointResponse> {
  const res = await apiClient.put<ApiResponse<EndpointResponse>>(`/endpoints/${id}`, data);
  return res.data.data!;
}

export async function deleteEndpoint(id: number): Promise<void> {
  await apiClient.delete<ApiResponse>(`/endpoints/${id}`);
}

export async function toggleEndpoint(id: number): Promise<EndpointResponse> {
  const res = await apiClient.patch<ApiResponse<EndpointResponse>>(`/endpoints/${id}/toggle`);
  return res.data.data!;
}
