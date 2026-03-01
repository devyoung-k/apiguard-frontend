import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';
import type {
  CreateNoticeRequest,
  NoticeResponse,
  UpdateNoticeRequest,
} from '@/types/api';

export async function getNotices(): Promise<NoticeResponse[]> {
  return apiGet<NoticeResponse[]>('/notices');
}

export async function getNotice(noticeId: number): Promise<NoticeResponse> {
  return apiGet<NoticeResponse>(`/notices/${noticeId}`);
}

export async function createNotice(
  data: CreateNoticeRequest,
): Promise<NoticeResponse> {
  return apiPost<NoticeResponse, CreateNoticeRequest>('/admin/notices', data);
}

export async function updateNotice(
  noticeId: number,
  data: UpdateNoticeRequest,
): Promise<NoticeResponse> {
  return apiPut<NoticeResponse, UpdateNoticeRequest>(
    `/admin/notices/${noticeId}`,
    data,
  );
}

export async function deleteNotice(noticeId: number): Promise<void> {
  await apiDelete(`/admin/notices/${noticeId}`);
}
