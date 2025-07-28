import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from '@/types/trading';
import { WEBSOCKET_RECONNECT_INTERVAL } from '@/lib/constants';
import { console } from 'inspector';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    console.log('Attempting to connect to WebSocket...');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        // Only call onConnect callback, don't show alert here
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();

        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WEBSOCKET_RECONNECT_INTERVAL * Math.pow(2, Math.min(reconnectAttempts.current, 5)));
        }
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [onMessage, onError, onConnect, onDisconnect, reconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((data: any) => {
    return sendMessage('subscribe', data);
  }, [sendMessage]);

  const unsubscribe = useCallback((data: any) => {
    return sendMessage('unsubscribe', data);
  }, [sendMessage]);

  useEffect(() => {
    console.log('WebSocket hook initialized, connecting...');
    connect();
    console.log('WebSocket hook connected');
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe
  };
}
