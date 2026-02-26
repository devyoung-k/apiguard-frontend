import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { ProjectResponse, CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

export async function createProject(
  workspaceId: number,
  data: CreateProjectRequest,
): Promise<ProjectResponse> {
  return apiPost<ProjectResponse, CreateProjectRequest>(
    `/workspaces/${workspaceId}/projects`,
    data,
  );
}

export async function getProjects(workspaceId: number): Promise<ProjectResponse[]> {
  return apiGet<ProjectResponse[]>(`/workspaces/${workspaceId}/projects`);
}

export async function getProject(id: number): Promise<ProjectResponse> {
  return apiGet<ProjectResponse>(`/projects/${id}`);
}

export async function updateProject(
  id: number,
  data: UpdateProjectRequest,
): Promise<ProjectResponse> {
  return apiPatch<ProjectResponse, UpdateProjectRequest>(`/projects/${id}`, data);
}

export async function deleteProject(id: number): Promise<void> {
  await apiDelete(`/projects/${id}`);
}
