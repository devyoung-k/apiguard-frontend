import { apiDelete, apiGet, apiPatch } from '@/lib/api-client';
import type {
  AdminUserResponse,
  UpdateAdminUserRoleRequest,
} from '@/types/api';

export async function getAdminUsers(): Promise<AdminUserResponse[]> {
  return apiGet<AdminUserResponse[]>('/admin/users');
}

export async function getAdminUser(userId: number): Promise<AdminUserResponse> {
  return apiGet<AdminUserResponse>(`/admin/users/${userId}`);
}

export async function updateAdminUserRole(
  userId: number,
  data: UpdateAdminUserRoleRequest,
): Promise<void> {
  await apiPatch<void, UpdateAdminUserRoleRequest>(
    `/admin/users/${userId}/role`,
    data,
  );
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await apiDelete(`/admin/users/${userId}`);
}
