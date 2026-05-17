import { apiGet, apiPost } from '@/lib/api-client';
import type {
  ApiSpecDiffDetailResponse,
  ApiSpecDiffResponse,
  ApiSpecSourceResponse,
  CreateApiSpecSourceRequest,
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
