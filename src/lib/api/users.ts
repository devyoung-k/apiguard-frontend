import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  UserResponse,
  UpdateUserRequest,
  ChangePasswordRequest,
} from '@/types/api';

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
  return res.data.data!;
}

export async function updateMe(data: UpdateUserRequest): Promise<void> {
  await apiClient.patch<ApiResponse>('/users/me', data);
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.patch<ApiResponse>('/users/me/password', data);
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete<ApiResponse>('/users/me');
}
