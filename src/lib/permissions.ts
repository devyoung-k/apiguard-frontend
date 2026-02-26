import type { WorkspaceRole } from '@/types/api';

/**
 * 역할 계층: owner(4) > admin(3) > member(2) > viewer(1)
 */
const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

/**
 * 사용자 역할이 요구 역할 이상인지 확인
 */
export function hasPermission(
  userRole: WorkspaceRole | undefined,
  requiredRole: WorkspaceRole,
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/** 멤버 관리(초대/역할 변경/제거) 가능 여부 — OWNER, ADMIN */
export function canManageMembers(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'ADMIN');
}

/** 멤버 초대 가능 여부 — OWNER, ADMIN */
export function canInviteMembers(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'ADMIN');
}

/** 멤버 역할 변경 가능 여부 — OWNER */
export function canChangeMemberRole(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'OWNER');
}

/** 멤버 제거 가능 여부 — OWNER */
export function canRemoveMember(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'OWNER');
}

/** 프로젝트/엔드포인트 편집 가능 여부 — VIEWER 제외 */
export function canEdit(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'MEMBER');
}

/** 프로젝트/엔드포인트 삭제 가능 여부 — OWNER, ADMIN */
export function canDelete(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'ADMIN');
}

/** 워크스페이스 설정(이름 변경, 삭제) 가능 여부 — OWNER만 */
export function canManageWorkspace(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'OWNER');
}

/** 역할 표시 라벨 */
export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

/** 선택 가능한 역할 목록 (초대/변경 시 사용) */
export const ASSIGNABLE_ROLES: WorkspaceRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];
