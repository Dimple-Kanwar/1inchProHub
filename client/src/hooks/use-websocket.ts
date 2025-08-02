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

let globalWsRef: WebSocket | null = null;

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

  const connect = useCallback(() => {
    // Skip if already connecting/connected globally
    if (globalWsRef) {
      if (globalWsRef.readyState === WebSocket.CONNECTING) return;
      if (globalWsRef.readyState === WebSocket.OPEN) return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port =
        window.location.port ||
        (window.location.protocol === "https:" ? "443" : "80");
      const wsUrl = `${protocol}//${host}:${port}/ws`;

      console.log("🔌 Connecting to:", wsUrl);
      setConnectionStatus("connecting");

      const ws = new WebSocket(wsUrl);
      globalWsRef = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket opened");
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = (event) => {
        console.log("❌ WebSocket closed:", { code: event.code, reason: event.reason, wasClean: event.wasClean });
        globalWsRef = null;
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = WEBSOCKET_RECONNECT_INTERVAL * Math.pow(2, Math.min(reconnectAttempts.current, 5));
          console.log(`🔁 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
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
  }, [onMessage, onError, onConnect, onDisconnect, reconnect]);

  const disconnect = useCallback(() => {
    console.log("🛑 Manual disconnect called");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (globalWsRef) {
      globalWsRef.close();
      globalWsRef = null;
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      // Only disconnect if you want manual control
      // Otherwise, let it reconnect automatically
      // disconnect();
    };
  }, [connect]);

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
    sendMessage: useCallback((type: string, data: any) => {
      if (globalWsRef?.readyState === WebSocket.OPEN) {
        globalWsRef.send(JSON.stringify({ type, data, timestamp: Date.now() }));
        return true;
      }
      return false;
    }, []),
    subscribe(type: string, data: any) {
      return this.sendMessage("subscribe", { type, data });
    },
    unsubscribe(type: string, data: any) {
      return this.sendMessage("unsubscribe", { type, data });
    },
  };
}