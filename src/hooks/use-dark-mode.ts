'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

/**
 * 다크 모드 여부를 반환하는 커스텀 훅.
 * SSR hydration 미스매치를 방지하기 위해 mounted 상태를 내부적으로 관리합니다.
 */
export function useDarkMode(): boolean {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && (theme === 'dark' || theme === 'system');
}
