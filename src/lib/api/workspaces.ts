import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
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

export function inviteMember(
  workspaceId: number,
  data: InviteMemberRequest,
): Promise<WorkspaceMember> {
  return apiPost<WorkspaceMember, InviteMemberRequest>(
    `/workspaces/${workspaceId}/members/invite`,
    data,
  );
}

export function updateMemberRole(
  workspaceId: number,
  memberId: number,
  data: UpdateMemberRoleRequest,
): Promise<WorkspaceMember> {
  return apiPut<WorkspaceMember, UpdateMemberRoleRequest>(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    data,
  );
}

export function removeMember(
  workspaceId: number,
  memberId: number,
): Promise<void> {
  return apiDelete(`/workspaces/${workspaceId}/members/${memberId}`);
}
