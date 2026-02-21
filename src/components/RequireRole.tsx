'use client';

import type { ReactNode } from 'react';
import type { WorkspaceRole } from '@/types/api';
import { useWorkspace } from '@/contexts/workspace-context';
import { hasPermission } from '@/lib/permissions';

interface RequireRoleProps {
  /** 최소 요구 역할 */
  minimum: WorkspaceRole;
  /** 권한이 있을 때 렌더링할 내용 */
  children: ReactNode;
  /** 권한이 없을 때 렌더링할 대체 내용 (선택) */
  fallback?: ReactNode;
}

/**
 * 선언적 역할 기반 권한 체크 컴포넌트.
 *
 * @example
 * <RequireRole minimum="admin">
 *   <button>멤버 초대</button>
 * </RequireRole>
 */
export function RequireRole({
  minimum,
  children,
  fallback = null,
}: RequireRoleProps) {
  const { myRole } = useWorkspace();

  if (!hasPermission(myRole, minimum)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
