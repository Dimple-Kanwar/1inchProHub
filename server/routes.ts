import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oneInchAPI } from "./services/oneinch-api";
import { walletSecurityService } from "./services/wallet-security";
import { webSocketService } from "./services/websocket";
import {
  insertUserSchema,
  insertPortfolioSchema,
  insertStrategySchema,
  insertSwapTransactionSchema,
  insertCrossChainBridgeSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Demo user creation for development
  app.get("/api/users/demo-user", async (req, res) => {
    try {
      // Create or get demo user
      let user = await storage.getUserByUsername("demo-user");
      if (!user) {
        user = await storage.createUser({
          username: "demo-user",
          password: "demo",
          walletAddress: "0x1234567890123456789012345678901234567890",
        });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to get demo user", error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...userData,
        walletAddress: userData.walletAddress ?? "",
      });
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: "Login failed", error });
    }
  });

  // 1inch API proxy routes
  app.get("/api/tokens/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const tokens = await oneInchAPI.getTokens(chainId);
      res.json(tokens);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to fetch tokens", error: error.message });
    }
  });

  app.get("/api/quote/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const { src, dst, amount } = req.query as {
        src: string;
        dst: string;
        amount: string;
      };

      if (!src || !dst || !amount) {
        return res
          .status(400)
          .json({ message: "Missing required parameters: src, dst, amount" });
      }

      const quote = await oneInchAPI.getQuote(chainId, src, dst, amount);
      res.json(quote);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to fetch quote", error: error.message });
    }
  });

  app.post("/api/swap/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const { src, dst, amount, from, slippage } = req.body;

      if (!src || !dst || !amount || !from || slippage === undefined) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const swapData = await oneInchAPI.getSwap(
        chainId,
        src,
        dst,
        amount,
        from,
        slippage
      );

      // Store swap transaction
      const userId = req.body.userId;
      if (userId) {
        await storage.createSwapTransaction({
          userId,
          fromToken: src,
          toToken: dst,
          fromAmount: amount,
          fromChain: chainId.toString(),
          toChain: chainId.toString(),
          swapType: "classic",
        });
      }

      res.json(swapData);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to create swap", error: error.message });
    }
  });

  // Fusion+ routes
  app.post("/api/fusion/quote", async (req, res) => {
    try {
      const { fromTokenAddress, toTokenAddress, amount, walletAddress } =
        req.body;

      if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress) {
        return res
          .status(400)
          .json({ message: "Missing required parameters for Fusion+ quote" });
      }

      const quote = await oneInchAPI.getFusionQuote(
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress
      );
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({
        message: "Failed to fetch Fusion+ quote",
        error: error.message,
      });
    }
  });

  app.post("/api/fusion/order", async (req, res) => {
    try {
      const orderData = req.body;
      const result = await oneInchAPI.submitFusionOrder(orderData);

      // Store cross-chain bridge transaction if applicable
      if (orderData.userId && orderData.fromChain !== orderData.toChain) {
        await storage.createCrossChainBridge({
          userId: orderData.userId,
          fromChain: orderData.fromChain,
          toChain: orderData.toChain,
          fromToken: orderData.fromTokenAddress,
          amount: orderData.amount,
          toToken: "",
          hashlock: "",
          timelock: new Date(),
          bridgeType: "",
          status: "pending"
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        message: "Failed to submit Fusion+ order",
        error: error.message,
      });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const portfolio = await storage.getUserPortfolio(userId);

      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      res.json(portfolio);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch portfolio", error });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    try {
      const portfolioData = insertPortfolioSchema.parse(req.body);
      const portfolio = await storage.createPortfolio({
        ...portfolioData,
        tokens: JSON.stringify([]),
        allocation: JSON.stringify({}),
        performance: JSON.stringify({ daily: 0, weekly: 0, monthly: 0 }),
      });
      res.status(201).json(portfolio);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid portfolio data", error });
    }
  });

  app.put("/api/portfolio/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let portfolio = await storage.getUserPortfolio(userId);

      if (!portfolio && userId === "demo-user") {
        // Create demo portfolio if it doesn't exist
        portfolio = await storage.createPortfolio({
          userId: "demo-user",
          totalValue: "0",
          tokens: JSON.stringify([]),
          allocation: JSON.stringify({}),
          performance: JSON.stringify({ daily: 0, weekly: 0, monthly: 0 }),
        });
      }
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      // Send real-time update
      // webSocketService.sendPortfolioUpdate(userId, portfolio);

      res.json(portfolio);
    } catch (error: any) {
      console.error("Portfolio fetch error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch portfolio", error: error.message });
    }
  });

  // Strategy routes
  app.get("/api/strategies/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const strategies = await storage.getUserStrategies(userId);
      res.json(strategies);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch strategies", error });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const strategyData = insertStrategySchema.parse(req.body);
      const strategy = await storage.createStrategy({
        ...strategyData,
        description: "",
        isActive: true,
        actions: [],
        settings: {},
      });

      // Send real-time update
      webSocketService.sendStrategyUpdate(strategyData.userId, strategy);

      res.status(201).json(strategy);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid strategy data", error });
    }
  });

  app.put("/api/strategies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const strategy = await storage.updateStrategy(id, updates);

      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      // Send real-time update
      webSocketService.sendStrategyUpdate(strategy.userId, strategy);

      res.json(strategy);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update strategy", error });
    }
  });

  app.delete("/api/strategies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const strategy = await storage.getStrategy(id);

      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      const deleted = await storage.deleteStrategy(id);

      if (deleted) {
        // Send real-time update
        webSocketService.sendStrategyUpdate(strategy.userId, {
          id,
          deleted: true,
        });
        res.json({ message: "Strategy deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete strategy" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete strategy", error });
    }
  });

  // Limit Order routes
  app.post("/api/limit-orders", async (req, res) => {
    try {
      const orderData = req.body;
      const result = await oneInchAPI.createLimitOrder(orderData);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        message: "Failed to create limit order",
        error: error.message,
      });
    }
  });

  app.get("/api/limit-orders/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { page = 1, limit = 100 } = req.query;
      const orders = await oneInchAPI.getLimitOrders(
        walletAddress,
        Number(page),
        Number(limit)
      );
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({
        message: "Failed to fetch limit orders",
        error: error.message,
      });
    }
  });

  // Gas and prices routes
  app.get("/api/gas-prices/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const gasPrices = await oneInchAPI.getGasPrices(chainId);
      res.json(gasPrices);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to fetch gas prices", error: error.message });
    }
  });

  app.get("/api/spot-prices/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const { addresses } = req.query as { addresses: string };
      console.log(`addresses: ${addresses}`);
      if (!addresses) {
        return res.status(400).json({ message: "Missing addresses parameter" });
      }

      const addressList = addresses.split(",");
      console.log(`addressList: ${addressList}`);
      const prices = await oneInchAPI.getSpotPrices(addressList, chainId);
      console.log(`prices: ${prices}`);
      res.json(prices);
    } catch (error: any) {
      console.log("error occured: ", error);
      res
        .status(500)
        .json({ message: "Failed to fetch spot prices", error: error.message });
    }
  });

  // Transaction history routes
  app.get("/api/history/:address/:chainId", async (req, res) => {
    try {
      const { address, chainId } = req.params;
      const { page = 1 } = req.query;
      const history = await oneInchAPI.getTransactionHistory(
        address,
        Number(chainId),
        Number(page)
      );
      res.json(history);
    } catch (error: any) {
      res.status(500).json({
        message: "Failed to fetch transaction history",
        error: error.message,
      });
    }
  });

  // Wallet security routes
  app.get("/api/wallet/status", async (req, res) => {
    try {
      // For demo, using hardcoded userId - in production would use session
      const userId = "demo-user";
      const status = await walletSecurityService.getWalletStatus(userId);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch wallet status", error });
    }
  });

  app.post("/api/wallet/lock", async (req, res) => {
    try {
      const userId = "demo-user";
      await walletSecurityService.lockWallet(userId, "user_lock");
      res.json({ message: "Wallet locked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to lock wallet", error });
    }
  });

  app.post("/api/wallet/unlock", async (req, res) => {
    try {
      const userId = "demo-user";
      await walletSecurityService.unlockWallet(userId);
      res.json({ message: "Wallet unlocked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to unlock wallet", error });
    }
  });

  app.post("/api/wallet/daily-limit", async (req, res) => {
    try {
      const userId = "demo-user";
      const { limit } = req.body;
      await walletSecurityService.updateDailyLimit(userId, parseFloat(limit));
      res.json({ message: "Daily limit updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update daily limit", error });
    }
  });

  app.post("/api/wallet/monthly-limit", async (req, res) => {
    try {
      const userId = "demo-user";
      const { limit } = req.body;
      await walletSecurityService.updateMonthlyLimit(userId, parseFloat(limit));
      res.json({ message: "Monthly limit updated successfully" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to update monthly limit", error });
    }
  });

  app.post("/api/wallet/smart-lock", async (req, res) => {
    try {
      const userId = "demo-user";
      await walletSecurityService.enableSmartLock(userId);
      res.json({ message: "Smart lock activated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to activate smart lock", error });
    }
  });

  app.post("/api/wallet/lock-account", async (req, res) => {
    try {
      const userId = "demo-user";
      const { accountId } = req.body;
      await walletSecurityService.lockAccount(userId, accountId);
      res.json({ message: "Account locked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to lock account", error });
    }
  });

  app.put("/api/wallet/security-settings", async (req, res) => {
    try {
      const userId = "demo-user";
      const { settings } = req.body;
      await walletSecurityService.updateSecuritySettings(userId, settings);
      res.json({ message: "Security settings updated successfully" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to update security settings", error });
    }
  });

  app.get("/api/wallet/security-logs", async (req, res) => {
    try {
      const userId = "demo-user";
      const logs = await storage.getSecurityAuditLogs(userId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch security logs", error });
    }
  });

  // Security settings routes
  app.get("/api/security/settings", async (req, res) => {
    try {
      const userId = "demo-user";
      // Mock security settings - in production would fetch from database
      const settings = {
        twoFactorEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 30,
        dailyLimit: 10000,
        monthlyLimit: 50000,
        singleTransactionLimit: 5000,
        requireAuthAbove: 1000,
        aiMonitoringEnabled: true,
        suspiciousActivityThreshold: 5,
        autoLockOnSuspicious: true,
        whitelistEnabled: false,
        allowedChains: ["ethereum", "polygon", "arbitrum"],
        vpnRequired: false,
        geoBlocking: false,
        hideBalances: false,
        anonymousMode: false,
        dataRetention: 90,
      };
      res.json(settings);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to fetch security settings", error });
    }
  });

  app.post("/api/security/settings", async (req, res) => {
    try {
      const userId = "demo-user";
      const { settings } = req.body;
      // In production, would save to database
      res.json({ message: "Security settings updated successfully" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to update security settings", error });
    }
  });

  // Cross-chain bridge routes (mock implementation for new chains)
  app.post("/api/cross-chain/initiate", async (req, res) => {
    try {
      const bridgeData = insertCrossChainBridgeSchema.parse(req.body);
      const bridge = await storage.createCrossChainBridge({
        ...bridgeData,
        status: "locked",
      });

      // Generate mock hashlock and timelock for demonstration
      const secretHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      if (!bridge.id) {
        return res.status(500).json({ message: "Bridge ID is missing" });
      }
      const updatedBridge = await storage.updateCrossChainBridge(bridge.id, {
        hashlock: secretHash,
        status: "locked",
      });

      res.status(201).json(updatedBridge);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid bridge data", error });
    }
  });

  app.get("/api/cross-chain/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const bridges = await storage.getUserCrossChainBridges(userId);
      res.json(bridges);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Failed to fetch cross-chain bridges", error });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket service
  webSocketService.initialize(httpServer);

  return httpServer;
}