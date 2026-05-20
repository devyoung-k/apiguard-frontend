import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client';
import type {
  ApiSpecDiffDetailResponse,
  ApiSpecDiffResponse,
  ApiSpecSourceResponse,
  CreateApiSpecSourceRequest,
  UpdateApiSpecSourceRequest,
} from '@/types/api';

export async function createSpecSource(
  projectId: number,
  data: CreateApiSpecSourceRequest,
): Promise<ApiSpecSourceResponse> {
  return apiPost<ApiSpecSourceResponse, CreateApiSpecSourceRequest>(
    `/projects/${projectId}/spec-sources`,
    data,
  );
}

export async function getSpecSources(
  projectId: number,
): Promise<ApiSpecSourceResponse[]> {
  return apiGet<ApiSpecSourceResponse[]>(`/projects/${projectId}/spec-sources`);
}

export async function updateSpecSource(
  sourceId: number,
  data: UpdateApiSpecSourceRequest,
): Promise<ApiSpecSourceResponse> {
  return apiPut<ApiSpecSourceResponse, UpdateApiSpecSourceRequest>(
    `/spec-sources/${sourceId}`,
    data,
  );
}

export async function deleteSpecSource(sourceId: number): Promise<void> {
  await apiDelete(`/spec-sources/${sourceId}`);
}

export async function toggleSpecSource(
  sourceId: number,
): Promise<ApiSpecSourceResponse> {
  return apiPatch<ApiSpecSourceResponse>(`/spec-sources/${sourceId}/toggle`);
}

export async function checkSpecSource(
  sourceId: number,
): Promise<ApiSpecDiffDetailResponse> {
  return apiPost<ApiSpecDiffDetailResponse>(`/spec-sources/${sourceId}/check`);
}

export async function getSpecDiffs(
  sourceId: number,
): Promise<ApiSpecDiffResponse[]> {
  return apiGet<ApiSpecDiffResponse[]>(`/spec-sources/${sourceId}/diffs`);
}

export async function getSpecDiff(
  diffId: number,
): Promise<ApiSpecDiffDetailResponse> {
  return apiGet<ApiSpecDiffDetailResponse>(`/spec-diffs/${diffId}`);
}
