'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  WorkspaceResponse,
  WorkspaceMember,
  WorkspaceRole,
} from '@/types/api';
import * as workspacesApi from '@/lib/api/workspaces';
import { useAuth } from '@/contexts/auth-context';

interface WorkspaceContextType {
  /** 내가 속한 워크스페이스 목록 */
  workspaces: WorkspaceResponse[];
  /** 현재 선택된 워크스페이스 */
  currentWorkspace: WorkspaceResponse | null;
  /** 현재 워크스페이스에서의 내 역할 */
  myRole: WorkspaceRole | undefined;
  /** 현재 워크스페이스 멤버 목록 */
  members: WorkspaceMember[];
  /** 로딩 상태  */
  isLoading: boolean;
  /** 워크스페이스 전환 */
  switchWorkspace: (id: number) => void;
  /** 워크스페이스 목록 새로고침 */
  refreshWorkspaces: () => Promise<void>;
  /** 멤버 목록 새로고침 */
  refreshMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

// ── Mock 데이터 (백엔드 API 미구현 시 사용) ──

const MOCK_WORKSPACES: WorkspaceResponse[] = [
  {
    id: 1,
    name: 'My Workspace',
    slug: 'my-workspace',
    createdAt: '2025-01-15T14:30:00',
  },
];

const MOCK_MEMBERS: WorkspaceMember[] = [
  {
    id: 1,
    userId: 1,
    email: 'owner@example.com',
    nickname: 'Owner',
    role: 'owner',
    joinedAt: '2025-01-15T14:30:00',
  },
  {
    id: 2,
    userId: 2,
    email: 'admin@example.com',
    nickname: 'Admin User',
    role: 'admin',
    joinedAt: '2025-01-20T10:00:00',
  },
  {
    id: 3,
    userId: 3,
    email: 'member@example.com',
    nickname: 'Team Member',
    role: 'member',
    joinedAt: '2025-02-01T09:00:00',
  },
  {
    id: 4,
    userId: 4,
    email: 'viewer@example.com',
    nickname: 'Read Only',
    role: 'viewer',
    joinedAt: '2025-02-10T11:30:00',
  },
];

// 백엔드 API가 준비되면 false로 변경
const USE_MOCK = true;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 현재 워크스페이스에서 내 역할 도출
  const myRole =
    members.find((m) => m.userId === user?.id)?.role ??
    (USE_MOCK ? 'owner' : undefined);

  const refreshWorkspaces = useCallback(async () => {
    if (USE_MOCK) {
      setWorkspaces(MOCK_WORKSPACES);
      return;
    }
    try {
      const data = await workspacesApi.getWorkspaces();
      setWorkspaces(data);
    } catch {
      // 네트워크 오류 무시 — UI에서 빈 목록 표시
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    if (!currentWorkspace) return;
    if (USE_MOCK) {
      setMembers(MOCK_MEMBERS);
      return;
    }
    try {
      const data = await workspacesApi.getMembers(currentWorkspace.id);
      setMembers(data);
    } catch {
      // ignore
    }
  }, [currentWorkspace]);

  const switchWorkspace = useCallback(
    (id: number) => {
      const ws = workspaces.find((w) => w.id === id);
      if (ws) {
        setCurrentWorkspace(ws);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentWorkspaceId', String(id));
        }
      }
    },
    [workspaces],
  );

  // 인증 완료 시 (또는 Mock 모드) 워크스페이스 목록 로드
  useEffect(() => {
    if (!USE_MOCK && !isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    const init = async () => {
      setIsLoading(true);
      await refreshWorkspaces();
      setIsLoading(false);
    };
    init();
  }, [isAuthenticated, refreshWorkspaces]);

  // 워크스페이스 목록이 바뀌면 자동으로 선택
  useEffect(() => {
    if (workspaces.length === 0) return;

    const savedId =
      typeof window !== 'undefined'
        ? localStorage.getItem('currentWorkspaceId')
        : null;

    const found = savedId
      ? workspaces.find((w) => w.id === Number(savedId))
      : null;

    setCurrentWorkspace(found ?? workspaces[0]);
  }, [workspaces]);

  // 현재 워크스페이스가 바뀌면 멤버 목록 로드
  useEffect(() => {
    if (currentWorkspace) {
      refreshMembers();
    }
  }, [currentWorkspace, refreshMembers]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        myRole,
        members,
        isLoading,
        switchWorkspace,
        refreshWorkspaces,
        refreshMembers,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
