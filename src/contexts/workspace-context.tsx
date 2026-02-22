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
import { USE_MOCK_API } from '@/lib/runtime-config';

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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null,
  );
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
    workspaces[0] ??
    null;

  // 현재 워크스페이스에서 내 역할 도출
  const myRole =
    members.find((m) => m.userId === user?.id)?.role ??
    (USE_MOCK_API ? 'owner' : undefined);

  const refreshWorkspaces = useCallback(async () => {
    if (USE_MOCK_API) {
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
    if (USE_MOCK_API) {
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
        setSelectedWorkspaceId(ws.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentWorkspaceId', String(id));
        }
      }
    },
    [workspaces],
  );

  // 인증 완료 시 (또는 Mock 모드) 워크스페이스 목록 로드
  useEffect(() => {
    const initializeWorkspaceState = async () => {
      setIsLoading(true);
      if (!USE_MOCK_API && !isAuthenticated) {
        setWorkspaces([]);
        setMembers([]);
        setSelectedWorkspaceId(null);
        setIsLoading(false);
        return;
      }

      const savedWorkspaceId =
        typeof window !== 'undefined'
          ? localStorage.getItem('currentWorkspaceId')
          : null;
      const parsedWorkspaceId = savedWorkspaceId ? Number(savedWorkspaceId) : null;
      setSelectedWorkspaceId(
        parsedWorkspaceId && Number.isFinite(parsedWorkspaceId)
          ? parsedWorkspaceId
          : null,
      );

      await refreshWorkspaces();
      setIsLoading(false);
    };

    void initializeWorkspaceState();
  }, [isAuthenticated, refreshWorkspaces]);

  // 현재 워크스페이스가 바뀌면 멤버 목록 로드
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentWorkspace) {
        setMembers([]);
        return;
      }

      if (USE_MOCK_API) {
        setMembers(MOCK_MEMBERS);
        return;
      }

      try {
        const data = await workspacesApi.getMembers(currentWorkspace.id);
        setMembers(data);
      } catch {
        setMembers([]);
      }
    };

    void loadMembers();
  }, [currentWorkspace]);

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
