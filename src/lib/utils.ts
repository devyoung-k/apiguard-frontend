import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * API 에러에서 사용자 친화적 메시지를 추출합니다.
 * axios 에러 여부와 무관하게 다양한 응답 포맷(message/detail/error)에서 메시지를 파싱합니다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown;

    if (typeof data === "string" && data.trim().length > 0) {
      return data;
    }

    if (data && typeof data === "object") {
      const maybe = data as Record<string, unknown>;
      const serverMessage = maybe.message ?? maybe.detail ?? maybe.error;
      if (typeof serverMessage === "string" && serverMessage.trim().length > 0) {
        return serverMessage;
      }
    }

    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
