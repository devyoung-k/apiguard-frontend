import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client';
import type { EndpointResponse, CreateEndpointRequest, UpdateEndpointRequest } from '@/types/api';

export async function createEndpoint(
  projectId: number,
  data: CreateEndpointRequest,
): Promise<EndpointResponse> {
  return apiPost<EndpointResponse, CreateEndpointRequest>(
    `/projects/${projectId}/endpoints`,
    data,
  );
}

export async function getEndpoints(projectId: number): Promise<EndpointResponse[]> {
  return apiGet<EndpointResponse[]>(`/projects/${projectId}/endpoints`);
}

export async function getEndpoint(id: number): Promise<EndpointResponse> {
  return apiGet<EndpointResponse>(`/endpoints/${id}`);
}

export async function updateEndpoint(
  id: number,
  data: UpdateEndpointRequest,
): Promise<EndpointResponse> {
  return apiPut<EndpointResponse, UpdateEndpointRequest>(`/endpoints/${id}`, data);
}

export async function deleteEndpoint(id: number): Promise<void> {
  await apiDelete(`/endpoints/${id}`);
}

export async function toggleEndpoint(id: number): Promise<EndpointResponse> {
  return apiPatch<EndpointResponse>(`/endpoints/${id}/toggle`);
}
