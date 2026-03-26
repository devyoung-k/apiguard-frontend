import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import type {
  StatusPageResponse,
  CreateStatusPageRequest,
  UpdateStatusPageRequest,
  PublicStatusPageResponse,
} from '@/types/api';
import axios from 'axios';

// ── 관리 API (인증 필요) ──

export function getStatusPage(workspaceId: number): Promise<StatusPageResponse> {
  return apiGet<StatusPageResponse>(`/workspaces/${workspaceId}/status-page`);
}

export function createStatusPage(
  workspaceId: number,
  data: CreateStatusPageRequest,
): Promise<StatusPageResponse> {
  return apiPost<StatusPageResponse, CreateStatusPageRequest>(
    `/workspaces/${workspaceId}/status-page`,
    data,
  );
}

export function updateStatusPage(
  workspaceId: number,
  data: UpdateStatusPageRequest,
): Promise<StatusPageResponse> {
  return apiPut<StatusPageResponse, UpdateStatusPageRequest>(
    `/workspaces/${workspaceId}/status-page`,
    data,
  );
}

export function deleteStatusPage(workspaceId: number): Promise<void> {
  return apiDelete(`/workspaces/${workspaceId}/status-page`);
}

// ── 공개 API (인증 불필요) ──

export async function getPublicStatusPage(slug: string): Promise<PublicStatusPageResponse> {
  const res = await axios.get<{ success: boolean; data: PublicStatusPageResponse }>(
    `/api/status/${slug}`,
  );
  if (!res.data.success) {
    throw new Error('Status page not found');
  }
  return res.data.data;
}
