interface User {
  id: string;
  username: string;
  email: string;
  walletAddress: string;
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

class InMemoryStorage {
  private users: Map<string, User> = new Map();
  private strategies: Map<string, Strategy> = new Map();
  private securitySettings: Map<string, SecuritySettings> = new Map();
  private crossChainOrders: Map<string, CrossChainOrder> = new Map();

  // User methods
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByWallet(walletAddress: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async saveUser(user: User): Promise<boolean> {
    this.users.set(user.id, user);
    return true;
  }

  // Strategy methods
  async getStrategy(id: string): Promise<Strategy | null> {
    return this.strategies.get(id) || null;
  }

  async getUserStrategies(userId: string): Promise<Strategy[]> {
    const strategies: Strategy[] = [];
    for (const strategy of this.strategies.values()) {
      if (strategy.userId === userId) {
        strategies.push(strategy);
      }
    }
    return strategies;
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

  // Security settings methods
  async getSecuritySettings(walletAddress: string): Promise<SecuritySettings | null> {
    return this.securitySettings.get(walletAddress.toLowerCase()) || null;
  }

  async saveSecuritySettings(walletAddress: string, settings: SecuritySettings): Promise<boolean> {
    settings.updatedAt = Date.now();
    this.securitySettings.set(walletAddress.toLowerCase(), settings);
    return true;
  }

  // Cross-chain order methods
  async getCrossChainOrder(orderId: string): Promise<CrossChainOrder | null> {
    return this.crossChainOrders.get(orderId) || null;
  }

  async getCrossChainOrders(walletAddress: string): Promise<CrossChainOrder[]> {
    const orders: CrossChainOrder[] = [];
    for (const order of this.crossChainOrders.values()) {
      if (order.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        orders.push(order);
      }
    }
    return orders.sort((a, b) => b.createdAt - a.createdAt);
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

  // Analytics methods
  async getActiveStrategiesCount(): Promise<number> {
    let count = 0;
    for (const strategy of this.strategies.values()) {
      if (strategy.isActive) count++;
    }
    return count;
  }

  async getTotalSwapVolume(): Promise<number> {
    // In a real implementation, this would calculate from transaction history
    return Math.floor(Math.random() * 1000000) + 500000;
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  // Demo data initialization
  async initializeDemoData(): Promise<void> {
    // Create demo user
    const demoUser: User = {
      id: 'demo-user',
      username: 'demo',
      email: 'demo@1inch.pro',
      walletAddress: '0x742d35Cc6354C3B1e9dCF68e2c6F9cE7d8e2Be4F',
      createdAt: Date.now()
    };
    await this.saveUser(demoUser);

    // Create demo strategies
    const demoStrategies: Strategy[] = [
      {
        id: 'strategy_1',
        userId: 'demo-user',
        name: 'ETH DCA Strategy',
        description: 'Dollar-cost averaging into ETH weekly',
        type: 'recurring_swap',
        isActive: true,
        actions: [],
        settings: { frequency: 'weekly', amount: '100', slippage: 0.5 },
        createdAt: Date.now() - 86400000
      },
      {
        id: 'strategy_2',
        userId: 'demo-user',
        name: 'BTC Limit Order',
        description: 'Buy BTC when price drops below $40,000',
        type: 'limit_order',
        isActive: true,
        actions: [],
        settings: { triggerPrice: '40000', amount: '0.1', slippage: 0.3 },
        createdAt: Date.now() - 172800000
      }
    ];

    for (const strategy of demoStrategies) {
      await this.saveStrategy(strategy);
    }

    // Create demo security settings
    const demoSecuritySettings: SecuritySettings = {
      walletAddress: demoUser.walletAddress,
      dailyLimit: 1000,
      monthlyLimit: 10000,
      maxTransactionAmount: 5000,
      whitelistedAddresses: [],
      twoFactorEnabled: false,
      smartLockEnabled: true,
      updatedAt: Date.now()
    };
    await this.saveSecuritySettings(demoUser.walletAddress, demoSecuritySettings);

    console.log('Demo data initialized');
  }
}

export const storage = new InMemoryStorage();

// Initialize demo data
storage.initializeDemoData().catch(console.error);