'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { useAuth } from '@/contexts/auth-context';

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (backendUrl) {
    try {
      const url = new URL(backendUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/ws`;
    } catch {
      // fallback
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

interface UseStompOptions {
  enabled?: boolean;
}

export function useStomp(options: UseStompOptions = {}) {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, { id: string; unsubscribe: () => void }>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated || typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      brokerURL: getWsUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers.message);
    };
    client.onConnect = () => {
      setConnected(true);
    };
    client.onDisconnect = () => {
      setConnected(false);
    };
    client.onWebSocketClose = () => {
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;
    const subscriptions = subscriptionsRef.current;

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
      subscriptions.clear();
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [enabled, isAuthenticated]);

  const subscribe = useCallback(
    <T>(destination: string, callback: (data: T) => void) => {
      const client = clientRef.current;
      if (!client) return () => {};

      // 이미 같은 destination에 구독 중이면 해제 후 재구독
      const existing = subscriptionsRef.current.get(destination);
      if (existing) {
        existing.unsubscribe();
        subscriptionsRef.current.delete(destination);
      }

      const doSubscribe = () => {
        const sub = client.subscribe(destination, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body) as T;
            callback(parsed);
          } catch {
            // 파싱 실패 무시
          }
        });
        subscriptionsRef.current.set(destination, sub);
      };

      if (client.connected) {
        doSubscribe();
      } else {
        const originalOnConnect = client.onConnect;
        client.onConnect = (frame) => {
          originalOnConnect?.(frame);
          doSubscribe();
        };
      }

      return () => {
        const sub = subscriptionsRef.current.get(destination);
        if (sub) {
          sub.unsubscribe();
          subscriptionsRef.current.delete(destination);
        }
      };
    },
    [],
  );

  return { subscribe, connected };
}
