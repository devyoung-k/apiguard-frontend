import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * API 에러에서 사용자 친화적 메시지를 추출합니다.
 * Axios 에러의 response.data.message를 우선 사용하고,
 * 없으면 fallback 메시지를 반환합니다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const serverMessage = data?.message || data?.detail;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return serverMessage;
    }
  }
  return fallback;
}
