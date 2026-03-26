'use client';

import { useEffect } from 'react';
import { useStomp } from './use-stomp';
import type { HealthCheckResult } from '@/types/api';

/**
 * 특정 엔드포인트의 헬스체크 결과를 실시간으로 수신한다.
 */
export function useEndpointCheckStream(
  endpointId: number | null,
  onCheck: (result: HealthCheckResult) => void,
) {
  const { subscribe } = useStomp({ enabled: !!endpointId });

  useEffect(() => {
    if (!endpointId) return;

    const unsubscribe = subscribe<HealthCheckResult>(
      `/topic/endpoints/${endpointId}/checks`,
      onCheck,
    );

    return unsubscribe;
  }, [endpointId, subscribe, onCheck]);
}

/**
 * 특정 프로젝트에 속한 모든 엔드포인트의 헬스체크 결과를 실시간으로 수신한다.
 */
export function useProjectCheckStream(
  projectId: number | null,
  onCheck: (result: HealthCheckResult) => void,
) {
  const { subscribe } = useStomp({ enabled: !!projectId });

  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribe<HealthCheckResult>(
      `/topic/projects/${projectId}/checks`,
      onCheck,
    );

    return unsubscribe;
  }, [projectId, subscribe, onCheck]);
}
