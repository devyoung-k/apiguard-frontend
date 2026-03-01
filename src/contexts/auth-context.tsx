'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserResponse } from '@/types/api';
import * as authApi from '@/lib/api/auth';
import * as usersApi from '@/lib/api/users';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isSystemAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRoleFromAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decodedPayload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const role = decodedPayload.role ?? decodedPayload['User.role'];
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isSystemAdmin = (user?.role ?? getRoleFromAccessToken()) === 'ADMIN';

  // 앱 시작 시 토큰 존재하면 유저 정보 복원
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await usersApi.getMe();
          setUser(userData);
        } catch {
          // 토큰 만료 등 — 클라이언트 인터셉터가 처리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    const userData = await usersApi.getMe();
    setUser(userData);
  }, []);

  const signup = useCallback(async (email: string, password: string, nickname: string) => {
    await authApi.signup({ email, password, nickname });
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch {
      // 로그아웃 실패해도 클라이언트 토큰은 삭제
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isSystemAdmin,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
