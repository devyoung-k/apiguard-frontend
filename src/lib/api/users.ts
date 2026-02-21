import { apiDelete, apiGet, apiPatch } from '@/lib/api-client';
import type { UserResponse, UpdateUserRequest, ChangePasswordRequest } from '@/types/api';

export async function getMe(): Promise<UserResponse> {
  return apiGet<UserResponse>('/users/me');
}

export async function updateMe(data: UpdateUserRequest): Promise<void> {
  await apiPatch<void, UpdateUserRequest>('/users/me', data);
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiPatch<void, ChangePasswordRequest>('/users/me/password', data);
}

export async function deleteMe(): Promise<void> {
  await apiDelete('/users/me');
}
