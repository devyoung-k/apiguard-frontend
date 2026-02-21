import type { WorkspaceRole } from '@/types/api';

/**
 * 역할 계층: owner(4) > admin(3) > member(2) > viewer(1)
 */
const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
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

/** 멤버 관리(초대/역할 변경/제거) 가능 여부 — owner, admin */
export function canManageMembers(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'admin');
}

/** 프로젝트/엔드포인트 편집 가능 여부 — viewer 제외 */
export function canEdit(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'member');
}

/** 프로젝트/엔드포인트 삭제 가능 여부 — owner, admin */
export function canDelete(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'admin');
}

/** 워크스페이스 설정(이름 변경, 삭제) 가능 여부 — owner만 */
export function canManageWorkspace(role: WorkspaceRole | undefined): boolean {
  return hasPermission(role, 'owner');
}

/** 역할 표시 라벨 */
export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

/** 선택 가능한 역할 목록 (초대/변경 시 사용) */
export const ASSIGNABLE_ROLES: WorkspaceRole[] = ['admin', 'member', 'viewer'];
