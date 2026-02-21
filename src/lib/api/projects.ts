import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import type { ProjectResponse, CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

export async function createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
  return apiPost<ProjectResponse, CreateProjectRequest>('/projects', data);
}

export async function getProjects(): Promise<ProjectResponse[]> {
  return apiGet<ProjectResponse[]>('/projects');
}

export async function getProject(id: number): Promise<ProjectResponse> {
  return apiGet<ProjectResponse>(`/projects/${id}`);
}

export async function updateProject(id: number, data: UpdateProjectRequest): Promise<ProjectResponse> {
  return apiPut<ProjectResponse, UpdateProjectRequest>(`/projects/${id}`, data);
}

export async function deleteProject(id: number): Promise<void> {
  await apiDelete(`/projects/${id}`);
}
