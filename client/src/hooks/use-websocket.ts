import { useEffect, useRef, useState, useCallback } from "react";
import type { WebSocketMessage } from "@/types/trading";
import { WEBSOCKET_RECONNECT_INTERVAL } from "@/lib/constants";

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnect?: boolean;
}

let globalWs: WebSocket | null = null;
let globalWsCleanup: (() => void) | null = null;

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnect = true,
  } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        onMessage?.(message);
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    },
    [onMessage]
  );
  // Connect function
  const connect = useCallback(() => {
    if (globalWs) {
      if (globalWs.readyState === WebSocket.OPEN) return;
      if (globalWs.readyState === WebSocket.CONNECTING) return;
    }
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      console.log("🔌 Connecting to:", wsUrl);
      setConnectionStatus("connecting");
      const ws = new WebSocket(wsUrl);
      globalWs = ws;
      ws.onopen = () => {
        console.log("✅ WebSocket opened");
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        onConnect?.();
      };
      ws.onmessage = handleMessage;
      ws.onclose = (event) => {
        console.log("❌ WebSocket closed:", {
          code: event.code,
          reason: event.reason,
        });
        globalWs = null;
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();
        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay =
            WEBSOCKET_RECONNECT_INTERVAL *
            Math.pow(2, Math.min(reconnectAttempts.current, 5));
          console.log(
            `🔁 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
          );
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
      ws.onerror = (error) => {
        console.error("🚨 WebSocket error:", error);
        setConnectionStatus("error");
        onError?.(error);
      };
    } catch (err) {
      console.error("❌ Failed to create WebSocket", err);
      setConnectionStatus("error");
    }
  }, [handleMessage, onConnect, onDisconnect, onError, reconnect]);

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log("🛑 Global WebSocket disconnect");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (globalWs) {
      globalWs.close();
      globalWs = null;
    }
  }, []);

  // Only connect once
  useEffect(() => {
    if (!globalWsCleanup) {
      connect();
      globalWsCleanup = () => {
        disconnect();
      };
    }
    return () => {
      // Do NOT disconnect on unmount
      // Let the singleton live
    };
  }, [connect]);
  // Cleanup only once
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((type: string, data: any) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type, data, timestamp: Date.now() }));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    handleMessage,
    disconnect,
    sendMessage,
    subscribe: (data: any) => sendMessage("subscribe", data),
    unsubscribe: (data: any) => sendMessage("unsubscribe", data),
  };
}
