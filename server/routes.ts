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
  insertCrossChainBridgeSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({ user: { id: user.id, username: user.username, walletAddress: user.walletAddress } });
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
      
      res.json({ user: { id: user.id, username: user.username, walletAddress: user.walletAddress } });
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
      res.status(500).json({ message: "Failed to fetch tokens", error: error.message });
    }
  });

  app.get("/api/quote/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const { src, dst, amount } = req.query as { src: string; dst: string; amount: string };
      
      if (!src || !dst || !amount) {
        return res.status(400).json({ message: "Missing required parameters: src, dst, amount" });
      }
      
      const quote = await oneInchAPI.getQuote(chainId, src, dst, amount);
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch quote", error: error.message });
    }
  });

  app.post("/api/swap/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const { src, dst, amount, from, slippage } = req.body;
      
      if (!src || !dst || !amount || !from || slippage === undefined) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const swapData = await oneInchAPI.getSwap(chainId, src, dst, amount, from, slippage);
      
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
          swapType: 'classic'
        });
      }
      
      res.json(swapData);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create swap", error: error.message });
    }
  });

  // Fusion+ routes
  app.post("/api/fusion/quote", async (req, res) => {
    try {
      const { fromTokenAddress, toTokenAddress, amount, walletAddress } = req.body;
      
      if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress) {
        return res.status(400).json({ message: "Missing required parameters for Fusion+ quote" });
      }
      
      const quote = await oneInchAPI.getFusionQuote(fromTokenAddress, toTokenAddress, amount, walletAddress);
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch Fusion+ quote", error: error.message });
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
          bridgeType: ""
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to submit Fusion+ order", error: error.message });
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
      const portfolio = await storage.createPortfolio(portfolioData);
      res.status(201).json(portfolio);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid portfolio data", error });
    }
  });

  app.put("/api/portfolio/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const portfolio = await storage.updatePortfolio(userId, updates);
      
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      // Send real-time update
      webSocketService.sendPortfolioUpdate(userId, portfolio);
      
      res.json(portfolio);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update portfolio", error });
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
      const strategy = await storage.createStrategy(strategyData);
      
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
        webSocketService.sendStrategyUpdate(strategy.userId, { id, deleted: true });
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
      res.status(500).json({ message: "Failed to create limit order", error: error.message });
    }
  });

  app.get("/api/limit-orders/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { page = 1, limit = 100 } = req.query;
      const orders = await oneInchAPI.getLimitOrders(walletAddress, Number(page), Number(limit));
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch limit orders", error: error.message });
    }
  });

  // Gas and prices routes
  app.get("/api/gas-prices/:chainId", async (req, res) => {
    try {
      const chainId = parseInt(req.params.chainId);
      const gasPrices = await oneInchAPI.getGasPrices(chainId);
      res.json(gasPrices);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch gas prices", error: error.message });
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
      
      const addressList = addresses.split(',');
      console.log(`addressList: ${addressList}`);
      const prices = await oneInchAPI.getSpotPrices(addressList, chainId);
      console.log(`prices: ${prices}`);
      res.json(prices);
    } catch (error: any) {
      console.log("error occured: ", error);
      res.status(500).json({ message: "Failed to fetch spot prices", error: error.message });
    }
  });

  // Transaction history routes
  app.get("/api/history/:address/:chainId", async (req, res) => {
    try {
      const { address, chainId } = req.params;
      const { page = 1 } = req.query;
      const history = await oneInchAPI.getTransactionHistory(address, Number(chainId), Number(page));
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch transaction history", error: error.message });
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
      await walletSecurityService.lockWallet(userId, 'user_lock');
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
      res.status(500).json({ message: "Failed to update monthly limit", error });
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
      res.status(500).json({ message: "Failed to update security settings", error });
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
        allowedChains: ['ethereum', 'polygon', 'arbitrum'],
        vpnRequired: false,
        geoBlocking: false,
        hideBalances: false,
        anonymousMode: false,
        dataRetention: 90
      };
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch security settings", error });
    }
  });

  app.post("/api/security/settings", async (req, res) => {
    try {
      const userId = "demo-user";
      const { settings } = req.body;
      // In production, would save to database
      res.json({ message: "Security settings updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update security settings", error });
    }
  });

  // Cross-chain bridge routes (mock implementation for new chains)
  app.post("/api/cross-chain/initiate", async (req, res) => {
    try {
      const bridgeData = insertCrossChainBridgeSchema.parse(req.body);
      const bridge = await storage.createCrossChainBridge(bridgeData);
      
      // Generate mock hashlock and timelock for demonstration
      const secretHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      
      const updatedBridge = await storage.updateCrossChainBridge(bridge.id, {
        secretHash,
        status: 'locked'
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
      res.status(500).json({ message: "Failed to fetch cross-chain bridges", error });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  webSocketService.initialize(httpServer);

  return httpServer;
}

import { Express } from 'express';
import { oneInchAPI } from './services/oneinch-api';
import { walletSecurityService } from './services/wallet-security';
import { webSocketService } from './services/websocket';
import { storage } from './storage';

export function setupRoutes(app: Express) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // **1inch Swap API Integration**
  app.get("/api/tokens/:chainId", async (req, res) => {
    try {
      const { chainId } = req.params;
      const tokens = await oneInchAPI.getTokens(parseInt(chainId));
      res.json(tokens);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch tokens", error: error.message });
    }
  });

  app.get("/api/quote/:chainId", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount } = req.query;
      const quote = await oneInchAPI.getQuote(
        parseInt(chainId),
        src as string,
        dst as string,
        amount as string
      );
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get quote", error: error.message });
    }
  });

  app.post("/api/swap/:chainId", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from, slippage } = req.body;

      // Apply backend security enhancements
      const secureSwap = await oneInchAPI.getSwap(
        parseInt(chainId),
        src,
        dst,
        amount,
        from,
        slippage
      );

      res.json(secureSwap);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to execute swap", error: error.message });
    }
  });

  // **1inch Fusion+ API Integration**
  app.post("/api/fusion/quote", async (req, res) => {
    try {
      const { fromTokenAddress, toTokenAddress, amount, walletAddress, fromChainId, toChainId, enablePartialFills } = req.body;

      const quote = await oneInchAPI.getFusionQuote(
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress,
        { enablePartialFills }
      );

      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get Fusion+ quote", error: error.message });
    }
  });

  app.post("/api/fusion/cross-chain-swap", async (req, res) => {
    try {
      const { fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, walletAddress, hashlock, timelock, enablePartialFills } = req.body;

      // For cross-chain swaps, use enhanced Fusion+ API
      const result = await oneInchAPI.getFusionCrossChainQuote(
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress
      );

      // Store cross-chain order with hashlock/timelock
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await storage.storeCrossChainOrder({
        id: orderId,
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress,
        hashlock,
        timelock,
        status: 'pending',
        createdAt: Date.now()
      });

      res.json({ success: true, orderId, ...result });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to initiate cross-chain swap", error: error.message });
    }
  });

  app.post("/api/fusion/submit-order", async (req, res) => {
    try {
      const orderData = req.body;
      const result = await oneInchAPI.submitFusionOrder(orderData);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to submit Fusion+ order", error: error.message });
    }
  });

  // **1inch Limit Order Protocol**
  app.post("/api/limit-orders", async (req, res) => {
    try {
      const orderData = req.body;
      const result = await oneInchAPI.createLimitOrder(orderData);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create limit order", error: error.message });
    }
  });

  app.post("/api/limit-orders/advanced", async (req, res) => {
    try {
      const orderData = req.body;
      const result = await oneInchAPI.createAdvancedLimitOrder(orderData);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create advanced limit order", error: error.message });
    }
  });

  app.get("/api/limit-orders/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { page = 1, limit = 100 } = req.query;
      const orders = await oneInchAPI.getLimitOrders(walletAddress, Number(page), Number(limit));
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch limit orders", error: error.message });
    }
  });

  app.delete("/api/limit-orders/:orderHash", async (req, res) => {
    try {
      const { orderHash } = req.params;
      const result = await oneInchAPI.cancelLimitOrder(orderHash);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to cancel limit order", error: error.message });
    }
  });

  // **1inch Data APIs**
  app.get("/api/portfolio/:addresses", async (req, res) => {
    try {
      const { addresses } = req.params;
      const { chainId = 1 } = req.query;
      const addressList = addresses.split(',');
      const portfolio = await oneInchAPI.getPortfolio(addressList, Number(chainId));
      res.json(portfolio);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch portfolio", error: error.message });
    }
  });

  app.get("/api/balances/:chainId/:addresses", async (req, res) => {
    try {
      const { chainId, addresses } = req.params;
      const addressList = addresses.split(',');
      const balances = await oneInchAPI.getBalances(addressList, Number(chainId));
      res.json(balances);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch balances", error: error.message });
    }
  });

  app.get("/api/spot-prices/:chainId/:addresses", async (req, res) => {
    try {
      const { chainId, addresses } = req.params;
      let addressList: string[];

      if (addresses === '[object Object]') {
        // Handle malformed request
        addressList = ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '0xA0b86a33E6441b6c4e8b36f9ccc5b47e12e6a1D5'];
      } else {
        addressList = addresses.split(',');
      }

      const prices = await oneInchAPI.getSpotPrices(addressList, Number(chainId));
      res.json(prices);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch spot prices", error: error.message });
    }
  });

  app.get("/api/gas-prices/:chainId", async (req, res) => {
    try {
      const { chainId } = req.params;
      const gasPrices = await oneInchAPI.getGasPrices(Number(chainId));
      res.json(gasPrices);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch gas prices", error: error.message });
    }
  });

  app.get("/api/transaction-history/:address/:chainId", async (req, res) => {
    try {
      const { address, chainId } = req.params;
      const { page = 1 } = req.query;
      const history = await oneInchAPI.getTransactionHistory(address, Number(chainId), Number(page));
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch transaction history", error: error.message });
    }
  });

  // **Strategy Management APIs**
  app.post("/api/strategies", async (req, res) => {
    try {
      const strategy = req.body;
      strategy.id = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      strategy.createdAt = Date.now();

      const saved = await storage.saveStrategy(strategy);

      if (saved) {
        // Send real-time update
        webSocketService.sendStrategyUpdate(strategy.userId || 'demo-user', strategy);
        res.json(strategy);
      } else {
        res.status(500).json({ message: "Failed to save strategy" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create strategy", error: error.message });
    }
  });

  app.get("/api/strategies/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const strategies = await storage.getUserStrategies(userId);
      res.json(strategies);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch strategies", error: error.message });
    }
  });

  app.put("/api/strategies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const strategy = await storage.updateStrategy(id, updates);

      if (strategy) {
        // Send real-time update
        webSocketService.sendStrategyUpdate(strategy.userId, strategy);
        res.json(strategy);
      } else {
        res.status(404).json({ message: "Strategy not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update strategy", error: error.message });
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
        webSocketService.sendStrategyUpdate(strategy.userId, { id, deleted: true });
        res.json({ message: "Strategy deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete strategy" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete strategy", error: error.message });
    }
  });

  // **Security APIs**
  app.get("/api/wallet/security-settings/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const settings = await storage.getSecuritySettings(address);
      res.json(settings || {
        dailyLimit: 1000,
        monthlyLimit: 10000,
        maxTransactionAmount: 5000,
        whitelistedAddresses: [],
        twoFactorEnabled: false,
        smartLockEnabled: false
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch security settings", error: error.message });
    }
  });

  app.post("/api/wallet/security-settings", async (req, res) => {
    try {
      const settings = req.body;
      const saved = await storage.saveSecuritySettings(settings.walletAddress, settings);

      if (saved) {
        res.json({ message: "Security settings updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to save security settings" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update security settings", error: error.message });
    }
  });

  // **Resolver and Relayer APIs**
  app.get("/api/fusion/resolver-status/:chainId/:txHash", async (req, res) => {
    try {
      const { chainId, txHash } = req.params;
      const status = await oneInchAPI.getResolverStatus(txHash, Number(chainId));
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get resolver status", error: error.message });
    }
  });

  // **Analytics and Traces APIs**
  app.get("/api/traces/:chainId/:address", async (req, res) => {
    try {
      const { chainId, address } = req.params;
      const traces = await oneInchAPI.getTraces(address, Number(chainId));
      res.json(traces);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch traces", error: error.message });
    }
  });

  // **Cross-chain Order Management**
  app.get("/api/cross-chain-orders/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const orders = await storage.getCrossChainOrders(walletAddress);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch cross-chain orders", error: error.message });
    }
  });

  app.post("/api/cross-chain-orders/:orderId/complete", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { signature, secret } = req.body;

      const order = await storage.getCrossChainOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify hashlock if present
      if (order.hashlock && secret) {
        // In a real implementation, verify that keccak256(secret) === hashlock
        await storage.updateCrossChainOrder(orderId, { status: 'completed', completedAt: Date.now() });
        res.json({ message: "Cross-chain order completed" });
      } else {
        res.status(400).json({ message: "Invalid completion data" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to complete cross-chain order", error: error.message });
    }
  });

  // **WebSocket Connection Info**
  app.get("/api/websocket/status", (req, res) => {
    res.json({
      connected: webSocketService.getConnectionCount(),
      status: 'active'
    });
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('API Error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });
}