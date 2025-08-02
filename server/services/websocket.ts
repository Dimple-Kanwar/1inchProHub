import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { oneInchAPI } from "./oneinch-api";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface SubscriptionData {
  userId?: string;
  walletAddress?: string;
  tokens?: string[];
  pairs?: string[];
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, SubscriptionData & { lastPing?: number }> =
    new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private gasUpdateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      clientTracking: true,
      perMessageDeflate: false,
    });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket client connected");
      this.clients.set(ws, {});

      ws.on("message", (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
          this.sendError(ws, "Invalid message format");
        }
      });

      ws.on("close", (event) => {
        console.log("❌ WebSocket client disconnected:", { event });
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("❌ WebSocket client error:", {
          message: error.message,
          stack: error.stack,
          readyState: ws.readyState,
        });
        this.clients.delete(ws);
      });

      // Send initial connection success message
      this.sendMessage(ws, "connection", { status: "connected" });
    });

    // Start background services
    this.startPriceUpdates();
    this.startGasUpdates();
    this.startHeartbeat();
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, data } = message;

    switch (type) {
      case "subscribe":
        this.handleSubscription(ws, data);
        break;
      case "unsubscribe":
        this.handleUnsubscription(ws, data);
        break;
      case "ping":
        const clientData = this.clients.get(ws);
        if (clientData) {
          clientData.lastPing = Date.now();
          this.clients.set(ws, clientData);
        }
        this.sendMessage(ws, "pong", { timestamp: Date.now() });
        break;
      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  private handleSubscription(ws: WebSocket, data: SubscriptionData) {
    const clientData = this.clients.get(ws) || {};
    this.clients.set(ws, { ...clientData, ...data });

    this.sendMessage(ws, "subscription_confirmed", {
      subscriptions: data,
      timestamp: Date.now(),
    });

    // Send initial data if available
    if (data.tokens && data.tokens.length > 0) {
      this.sendTokenPrices(ws, data.tokens);
    }
  }

  private handleUnsubscription(ws: WebSocket, data: any) {
    const clientData = this.clients.get(ws);
    if (clientData) {
      // Remove specific subscriptions
      if (data.tokens) {
        clientData.tokens = clientData.tokens?.filter(
          (token) => !data.tokens.includes(token)
        );
      }
      if (data.pairs) {
        clientData.pairs = clientData.pairs?.filter(
          (pair) => !data.pairs.includes(pair)
        );
      }

      this.clients.set(ws, clientData);
    }

    this.sendMessage(ws, "unsubscription_confirmed", data);
  }

  private sendMessage(ws: WebSocket, type: string, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, "error", { message: error });
  }

  private broadcast(
    type: string,
    data: any,
    filter?: (clientData: SubscriptionData) => boolean
  ) {
    this.clients.forEach((clientData, ws) => {
      if (!filter || filter(clientData)) {
        this.sendMessage(ws, type, data);
      }
    });
  }

  private async startPriceUpdates() {
    this.priceUpdateInterval = setInterval(async () => {
      try {
        // Get all unique tokens from subscriptions
        const allTokens = new Set<string>();
        this.clients.forEach((clientData) => {
          clientData.tokens?.forEach((token) => allTokens.add(token));
        });

        if (allTokens.size > 0) {
          const tokens = Array.from(allTokens);
          // Limit to maximum 10 tokens per request to avoid API limits
          const tokenBatches = [];
          for (let i = 0; i < tokens.length; i += 10) {
            tokenBatches.push(tokens.slice(i, i + 10));
          }

          for (const tokenBatch of tokenBatches) {
            try {
              const prices = await oneInchAPI.getSpotPrices(tokenBatch);

              this.broadcast(
                "price_update",
                {
                  prices,
                  tokens: tokenBatch,
                  timestamp: Date.now(),
                },
                (clientData) =>
                  Boolean(
                    clientData.tokens?.some((token) =>
                      tokenBatch.includes(token)
                    )
                  )
              );
            } catch (batchError) {
              console.error(
                "Error fetching price updates for batch:",
                batchError
              );
            }
          }
        }
      } catch (error) {
        console.error("Error in price update interval:", error);
      }
    }, 10000); // Update every 10 seconds (reduced frequency for stability)
  }

  private async startGasUpdates() {
    this.gasUpdateInterval = setInterval(async () => {
      try {
        const gasPrices = await oneInchAPI.getGasPrices(1); // Ethereum mainnet

        this.broadcast("gas_update", {
          gasPrices,
          chainId: 1,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Error fetching gas updates:", error);
      }
    }, 15000); // Update every 15 seconds
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleConnections: WebSocket[] = [];

      this.clients.forEach((clientData, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Send heartbeat ping
          this.sendMessage(ws, "heartbeat", { timestamp: now });

          // Check for stale connections (no ping response in 60 seconds)
          if (clientData.lastPing && now - clientData.lastPing > 60000) {
            staleConnections.push(ws);
          }
        } else {
          staleConnections.push(ws);
        }
      });

      // Clean up stale connections
      staleConnections.forEach((ws) => {
        console.log("Cleaning up stale WebSocket connection");
        this.clients.delete(ws);
        if (ws.readyState === WebSocket.OPEN) {
          ws.terminate();
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private async sendTokenPrices(ws: WebSocket, tokens: string[]) {
    try {
      const prices = await oneInchAPI.getSpotPrices(tokens);
      this.sendMessage(ws, "initial_prices", {
        prices,
        tokens,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error fetching initial token prices:", error);
      this.sendError(ws, "Failed to fetch initial token prices");
    }
  }

  // Public methods for sending specific updates
  async sendSwapUpdate(userId: string, swapData: any) {
    this.broadcast(
      "swap_update",
      swapData,
      (clientData) => clientData.userId === userId
    );
  }

  async sendStrategyUpdate(userId: string, strategyData: any) {
    this.broadcast(
      "strategy_update",
      strategyData,
      (clientData) => clientData.userId === userId
    );
  }

  async sendPortfolioUpdate(userId: string, portfolioData: any) {
    this.broadcast(
      "portfolio_update",
      portfolioData,
      (clientData) => clientData.userId === userId
    );
  }

  async sendNotification(userId: string, notification: any) {
    this.broadcast(
      "notification",
      notification,
      (clientData) => clientData.userId === userId
    );
  }

  cleanup() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    if (this.gasUpdateInterval) {
      clearInterval(this.gasUpdateInterval);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    this.clients.clear();
  }
}

export const webSocketService = new WebSocketService();
