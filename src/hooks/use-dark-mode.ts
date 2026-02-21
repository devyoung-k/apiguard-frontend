'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

/**
 * 다크 모드 여부를 반환하는 커스텀 훅.
 * `resolvedTheme`를 사용해 system 설정까지 반영된 실제 테마를 반환합니다.
 */
export function useDarkMode(): boolean {
  const { resolvedTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return isHydrated && resolvedTheme === 'dark';
}
