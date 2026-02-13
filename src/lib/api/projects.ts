import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/types/api';

export async function createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
  const res = await apiClient.post<ApiResponse<ProjectResponse>>('/projects', data);
  return res.data.data!;
}

export async function getProjects(): Promise<ProjectResponse[]> {
  const res = await apiClient.get<ApiResponse<ProjectResponse[]>>('/projects');
  return res.data.data!;
}

export async function getProject(id: number): Promise<ProjectResponse> {
  const res = await apiClient.get<ApiResponse<ProjectResponse>>(`/projects/${id}`);
  return res.data.data!;
}

export async function updateProject(id: number, data: UpdateProjectRequest): Promise<ProjectResponse> {
  const res = await apiClient.put<ApiResponse<ProjectResponse>>(`/projects/${id}`, data);
  return res.data.data!;
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete<ApiResponse>(`/projects/${id}`);
}
