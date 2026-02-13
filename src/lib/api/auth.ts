import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  RefreshRequest,
  LogoutRequest,
} from '@/types/api';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
  return res.data.data!;
}

export async function signup(data: SignupRequest): Promise<number> {
  const res = await apiClient.post<ApiResponse<number>>('/users/signup', data);
  return res.data.data!;
}

export async function refresh(data: RefreshRequest): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', data);
  return res.data.data!;
}

export async function logout(data: LogoutRequest): Promise<void> {
  await apiClient.post<ApiResponse>('/auth/logout', data);
}
