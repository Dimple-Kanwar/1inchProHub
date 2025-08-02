"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

const WebSocketContext = createContext<ReturnType<typeof useWebSocket> | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useWebSocket({
    onConnect: () => console.log("🟢 WS Connected"),
    onDisconnect: () => console.log("🔴 WS Disconnected"),
    onError: (e) => console.error("🚨 WS Error", e),
    onMessage: (msg) => console.log("📩 WS Message:", msg),
  });

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}