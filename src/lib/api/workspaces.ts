import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type {
  WorkspaceResponse,
  WorkspaceMember,
  CreateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '@/types/api';

// ── 워크스페이스 ──

export function getWorkspaces(): Promise<WorkspaceResponse[]> {
  return apiGet<WorkspaceResponse[]>('/workspaces');
}

export function createWorkspace(
  data: CreateWorkspaceRequest,
): Promise<WorkspaceResponse> {
  return apiPost<WorkspaceResponse, CreateWorkspaceRequest>(
    '/workspaces',
    data,
  );
}

export function getWorkspace(id: number): Promise<WorkspaceResponse> {
  return apiGet<WorkspaceResponse>(`/workspaces/${id}`);
}

export function deleteWorkspace(id: number): Promise<void> {
  return apiDelete(`/workspaces/${id}`);
}

// ── 멤버 관리 ──

export function getMembers(workspaceId: number): Promise<WorkspaceMember[]> {
  return apiGet<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
}

/**
 * 멤버 초대: POST /workspaces/{workspaceId}/members
 * API 명세상 /members/invite가 아닌 /members로 요청
 */
export function inviteMember(
  workspaceId: number,
  data: InviteMemberRequest,
): Promise<WorkspaceMember> {
  return apiPost<WorkspaceMember, InviteMemberRequest>(
    `/workspaces/${workspaceId}/members`,
    data,
  );
}

/**
 * 역할 변경: PATCH /workspaces/{workspaceId}/members/{userId}/role
 * API 명세상 PUT이 아닌 PATCH
 */
export function updateMemberRole(
  workspaceId: number,
  userId: number,
  data: UpdateMemberRoleRequest,
): Promise<WorkspaceMember> {
  return apiPatch<WorkspaceMember, UpdateMemberRoleRequest>(
    `/workspaces/${workspaceId}/members/${userId}/role`,
    data,
  );
}

export function removeMember(
  workspaceId: number,
  userId: number,
): Promise<void> {
  return apiDelete(`/workspaces/${workspaceId}/members/${userId}`);
}
