import { apiPost } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, SignupRequest, RefreshRequest, LogoutRequest } from '@/types/api';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse, LoginRequest>('/auth/login', data);
}

export async function signup(data: SignupRequest): Promise<number> {
  return apiPost<number, SignupRequest>('/users/signup', data);
}

export async function refresh(data: RefreshRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse, RefreshRequest>('/auth/refresh', data);
}

export async function logout(data: LogoutRequest): Promise<void> {
  await apiPost<void, LogoutRequest>('/auth/logout', data);
}
