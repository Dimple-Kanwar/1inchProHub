interface User {
  id: string;
  username: string;
  email?: string;
  password: string; // Only for demo — never store plaintext in prod
  walletAddress: string;
  createdAt: number;
}

interface Portfolio {
  id?: string;
  userId: string;
  totalValue: string;
  tokens: string; // JSON stringified array/object
  allocation: string; // JSON stringified
  performance: string; // JSON stringified { daily, weekly, monthly }
  updatedAt?: number;
  createdAt: number;
}

interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  actions: any[];
  settings: any;
  createdAt: number;
  updatedAt?: number;
}

interface SwapTransaction {
  id?: string;
  userId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount?: string;
  fromChain: string;
  toChain: string;
  swapType: 'classic' | 'cross_chain' | 'fusion';
  hash?: string;
  timestamp: number;
}

interface CrossChainBridge {
  id?: string;
  userId: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken?: string;
  amount: string;
  hashlock?: string;
  timelock?: number | Date;
  status: 'pending' | 'locked' | 'completed' | 'refunded';
  bridgeType: string;
  createdAt: number;
  completedAt?: number;
}

interface SecuritySettings {
  walletAddress: string;
  dailyLimit: number;
  monthlyLimit: number;
  maxTransactionAmount: number;
  whitelistedAddresses: string[];
  twoFactorEnabled: boolean;
  smartLockEnabled: boolean;
  updatedAt: number;
}

interface CrossChainOrder {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  hashlock?: string;
  timelock?: number;
  status: 'pending' | 'locked' | 'completed' | 'refunded';
  createdAt: number;
  completedAt?: number;
}

interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
}

class InMemoryStorage {
  private users: Map<string, User> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();
  private strategies: Map<string, Strategy> = new Map();
  private swapTransactions: Map<string, SwapTransaction> = new Map();
  private crossChainBridges: Map<string, CrossChainBridge> = new Map();
  private securitySettings: Map<string, SecuritySettings> = new Map();
  private securityAuditLogs: Map<string, SecurityAuditLog> = new Map();
  private crossChainOrders: Map<string, CrossChainOrder> = new Map();

  // === USER METHODS ===
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async getUserByWallet(walletAddress: string): Promise<User | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: Date.now(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // === PORTFOLIO METHODS ===
  async getUserPortfolio(userId: string): Promise<Portfolio | null> {
    for (const portfolio of Array.from(this.portfolios.values())) {
      if (portfolio.userId === userId) {
        return portfolio;
      }
    }
    return null;
  }

  async createPortfolio(data: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: `portfolio_${Date.now()}`,
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.portfolios.set(portfolio.id!, portfolio);
    return portfolio;
  }

  async updatePortfolio(id: string, updates: Partial<Omit<Portfolio, 'id' | 'userId'>>): Promise<Portfolio | null> {
    const portfolio = this.portfolios.get(id);
    if (portfolio) {
      const updated = { ...portfolio, ...updates, updatedAt: Date.now() };
      this.portfolios.set(id, updated);
      return updated;
    }
    return null;
  }

  // === STRATEGY METHODS ===
  async getStrategy(id: string): Promise<Strategy | null> {
    return this.strategies.get(id) || null;
  }

  async getUserStrategies(userId: string): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(s => s.userId === userId);
  }

  async createStrategy(data: Omit<Strategy, 'id' | 'createdAt'>): Promise<Strategy> {
    const strategy: Strategy = {
      id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      ...data,
    };
    this.strategies.set(strategy.id, strategy);
    return strategy;
  }

  async saveStrategy(strategy: Strategy): Promise<boolean> {
    this.strategies.set(strategy.id, strategy);
    return true;
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy | null> {
    const strategy = this.strategies.get(id);
    if (strategy) {
      const updated = { ...strategy, ...updates, updatedAt: Date.now() };
      this.strategies.set(id, updated);
      return updated;
    }
    return null;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    return this.strategies.delete(id);
  }

  // === SWAP TRANSACTION METHODS ===
  async createSwapTransaction(data: Omit<SwapTransaction, 'id' | 'timestamp'>): Promise<SwapTransaction> {
    const tx: SwapTransaction = {
      id: `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...data,
    };
    this.swapTransactions.set(tx.id!, tx);
    return tx;
  }

  async getUserSwapTransactions(userId: string): Promise<SwapTransaction[]> {
    return Array.from(this.swapTransactions.values()).filter(t => t.userId === userId);
  }

  // === CROSS-CHAIN BRIDGE METHODS ===
  async createCrossChainBridge(data: Omit<CrossChainBridge, 'id' | 'createdAt'>): Promise<CrossChainBridge> {
    const bridge: CrossChainBridge = {
      id: `bridge_${Date.now()}`,
      createdAt: Date.now(),
      ...data,
    };
    this.crossChainBridges.set(bridge.id!, bridge);
    return bridge;
  }

  async updateCrossChainBridge(id: string, updates: Partial<CrossChainBridge>): Promise<CrossChainBridge | null> {
    const bridge = this.crossChainBridges.get(id);
    if (bridge) {
      const updated = { ...bridge, ...updates };
      this.crossChainBridges.set(id, updated);
      return updated;
    }
    return null;
  }

  async getUserCrossChainBridges(userId: string): Promise<CrossChainBridge[]> {
    return Array.from(this.crossChainBridges.values())
      .filter(b => b.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // === SECURITY SETTINGS ===
  async getSecuritySettings(walletAddress: string): Promise<SecuritySettings | null> {
    return this.securitySettings.get(walletAddress.toLowerCase()) || null;
  }

  async saveSecuritySettings(walletAddress: string, settings: SecuritySettings): Promise<boolean> {
    settings.updatedAt = Date.now();
    this.securitySettings.set(walletAddress.toLowerCase(), settings);
    return true;
  }

  async getSecurityAuditLogs(userId: string): Promise<SecurityAuditLog[]> {
    return Array.from(this.securityAuditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async logSecurityEvent(userId: string, action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') {
    const log: SecurityAuditLog = {
      id: `log_${Date.now()}`,
      userId,
      action,
      details,
      timestamp: Date.now(),
      severity,
    };
    this.securityAuditLogs.set(log.id, log);
  }

  // === CROSS-CHAIN ORDER METHODS ===
  async getCrossChainOrder(orderId: string): Promise<CrossChainOrder | null> {
    return this.crossChainOrders.get(orderId) || null;
  }

  async getCrossChainOrders(walletAddress: string): Promise<CrossChainOrder[]> {
    return Array.from(this.crossChainOrders.values())
      .filter(o => o.walletAddress.toLowerCase() === walletAddress.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async storeCrossChainOrder(order: CrossChainOrder): Promise<boolean> {
    this.crossChainOrders.set(order.id, order);
    return true;
  }

  async updateCrossChainOrder(orderId: string, updates: Partial<CrossChainOrder>): Promise<CrossChainOrder | null> {
    const order = this.crossChainOrders.get(orderId);
    if (order) {
      const updated = { ...order, ...updates };
      this.crossChainOrders.set(orderId, updated);
      return updated;
    }
    return null;
  }

  // === ANALYTICS ===
  async getActiveStrategiesCount(): Promise<number> {
    return Array.from(this.strategies.values()).filter(s => s.isActive).length;
  }

  async getTotalSwapVolume(): Promise<number> {
    return Math.floor(Math.random() * 1000000) + 500000; // Mock
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  // === DEMO DATA ===
  async initializeDemoData(): Promise<void> {
    // Create demo user
    const demoUser: User = {
      id: 'demo-user',
      username: 'demo-user',
      password: 'demo',
      email: 'demo@1inch.pro',
      walletAddress: '0x1234567890123456789012345678901234567890',
      createdAt: Date.now(),
    };
    this.users.set(demoUser.id, demoUser);

    // Portfolio
    const demoPortfolio: Portfolio = {
      id: 'portfolio-demo',
      userId: 'demo-user',
      totalValue: '50000',
      tokens: JSON.stringify([
        { address: '0x...', symbol: 'ETH', balance: '2.5', value: '45000' },
        { address: '0x...', symbol: 'USDC', balance: '5000', value: '5000' },
      ]),
      allocation: JSON.stringify({ ETH: 90, USDC: 10 }),
      performance: JSON.stringify({ daily: 2.5, weekly: 5.1, monthly: 12.3 }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.portfolios.set(demoPortfolio.id!, demoPortfolio);

    // Security settings
    const demoSecuritySettings: SecuritySettings = {
      walletAddress: demoUser.walletAddress,
      dailyLimit: 1000,
      monthlyLimit: 10000,
      maxTransactionAmount: 5000,
      whitelistedAddresses: [],
      twoFactorEnabled: false,
      smartLockEnabled: true,
      updatedAt: Date.now(),
    };
    this.securitySettings.set(demoUser.walletAddress.toLowerCase(), demoSecuritySettings);

    console.log('✅ InMemoryStorage: Demo data initialized');
  }
}

export const storage = new InMemoryStorage();

// Initialize demo data
storage.initializeDemoData().catch(console.error);