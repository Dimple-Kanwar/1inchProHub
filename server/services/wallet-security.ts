import { storage } from '../storage';
import type { User, SecurityAuditLog } from '@shared/schema';

interface WalletSecurityStatus {
  walletLocked: boolean;
  lockReason: string | null;
  dailyTransactionLimit: string;
  dailyTransactionUsed: string;
  lastTransactionReset: string;
  twoFactorEnabled: boolean;
  securitySettings: SecuritySettings;
}

interface SecuritySettings {
  requireAuthForLargeTransactions: boolean;
  largeTransactionThreshold: string;
  autoLockEnabled: boolean;
  autoLockInactivityMinutes: number;
  allowedChains: number[];
  blockedTokens: string[];
  maxSlippage: number;
}

class WalletSecurityService {
  private userSessions = new Map<string, { lastActivity: Date }>();

  async getWalletStatus(userId: string): Promise<WalletSecurityStatus> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const defaultSecuritySettings: SecuritySettings = {
      requireAuthForLargeTransactions: false,
      largeTransactionThreshold: '1000',
      autoLockEnabled: false,
      autoLockInactivityMinutes: 30,
      allowedChains: [1, 137, 42161, 56, 43114],
      blockedTokens: [],
      maxSlippage: 3
    };

    return {
      walletLocked: user.walletLocked || false,
      lockReason: user.lockReason || null,
      dailyTransactionLimit: user.dailyTransactionLimit || '10000',
      dailyTransactionUsed: user.dailyTransactionUsed || '0',
      lastTransactionReset: user.lastTransactionReset || new Date().toISOString(),
      twoFactorEnabled: user.twoFactorEnabled || false,
      securitySettings: user.securitySettings ? JSON.parse(user.securitySettings) : defaultSecuritySettings
    };
  }

  async lockWallet(userId: string, reason: string): Promise<void> {
    await storage.updateUser(userId, {
      walletLocked: true,
      lockReason: reason
    });

    await this.logSecurityEvent(userId, 'wallet_locked', {
      reason,
      timestamp: new Date().toISOString()
    }, 'medium');
  }

  async unlockWallet(userId: string): Promise<void> {
    await storage.updateUser(userId, {
      walletLocked: false,
      lockReason: null
    });

    await this.logSecurityEvent(userId, 'wallet_unlocked', {
      timestamp: new Date().toISOString()
    }, 'low');
  }

  async updateDailyLimit(userId: string, newLimit: number): Promise<void> {
    await storage.updateUser(userId, {
      dailyTransactionLimit: newLimit.toString()
    });

    await this.logSecurityEvent(userId, 'daily_limit_updated', {
      oldLimit: 'previous_limit', // In a real implementation, you'd fetch the old value
      newLimit: newLimit.toString(),
      timestamp: new Date().toISOString()
    }, 'low');
  }

  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<void> {
    const currentStatus = await this.getWalletStatus(userId);
    const updatedSettings = { ...currentStatus.securitySettings, ...settings };

    await storage.updateUser(userId, {
      securitySettings: JSON.stringify(updatedSettings)
    });

    await this.logSecurityEvent(userId, 'security_settings_updated', {
      updatedFields: Object.keys(settings),
      timestamp: new Date().toISOString()
    }, 'low');
  }

  async updateMonthlyLimit(userId: string, newLimit: number): Promise<void> {
    await storage.updateUser(userId, {
      monthlyTransactionLimit: newLimit.toString()
    });

    await this.logSecurityEvent(userId, 'monthly_limit_updated', {
      newLimit: newLimit.toString(),
      timestamp: new Date().toISOString()
    }, 'low');
  }

  async enableSmartLock(userId: string): Promise<void> {
    const currentStatus = await this.getWalletStatus(userId);
    const updatedSettings = { ...currentStatus.securitySettings, smartLockEnabled: true };

    await storage.updateUser(userId, {
      securitySettings: JSON.stringify(updatedSettings)
    });

    await this.logSecurityEvent(userId, 'smart_lock_enabled', {
      timestamp: new Date().toISOString()
    }, 'medium');
  }

  async lockAccount(userId: string, accountId: string): Promise<void> {
    await this.logSecurityEvent(userId, 'account_locked', {
      accountId,
      timestamp: new Date().toISOString()
    }, 'medium');
  }

  async validateTransaction(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getWalletStatus(userId);

    if (status.walletLocked) {
      return { allowed: false, reason: 'Wallet is locked' };
    }

    const dailyUsed = parseFloat(status.dailyTransactionUsed);
    const dailyLimit = parseFloat(status.dailyTransactionLimit);

    if (dailyUsed + amount > dailyLimit) {
      return { allowed: false, reason: 'Daily transaction limit exceeded' };
    }

    const settings = status.securitySettings;
    if (settings.requireAuthForLargeTransactions && amount > parseFloat(settings.largeTransactionThreshold)) {
      return { allowed: false, reason: 'Large transaction requires additional authentication' };
    }

    return { allowed: true };
  }

  async recordTransaction(userId: string, amount: number): Promise<void> {
    const status = await this.getWalletStatus(userId);
    const newUsed = parseFloat(status.dailyTransactionUsed) + amount;

    await storage.updateUser(userId, {
      dailyTransactionUsed: newUsed.toString()
    });

    // Check if this transaction brings them close to their daily limit
    const dailyLimit = parseFloat(status.dailyTransactionLimit);
    if (newUsed / dailyLimit > 0.8) {
      await this.logSecurityEvent(userId, 'daily_limit_warning', {
        used: newUsed.toString(),
        limit: dailyLimit.toString(),
        percentage: Math.round((newUsed / dailyLimit) * 100),
        timestamp: new Date().toISOString()
      }, 'medium');
    }
  }

  async checkAutoLock(userId: string): Promise<void> {
    const status = await this.getWalletStatus(userId);
    
    if (!status.securitySettings.autoLockEnabled) return;

    const session = this.userSessions.get(userId);
    if (!session) return;

    const inactiveMinutes = (Date.now() - session.lastActivity.getTime()) / (1000 * 60);
    
    if (inactiveMinutes > status.securitySettings.autoLockInactivityMinutes) {
      await this.lockWallet(userId, 'auto_lock_inactivity');
    }
  }

  async updateActivity(userId: string): Promise<void> {
    this.userSessions.set(userId, { lastActivity: new Date() });
  }

  private async logSecurityEvent(
    userId: string, 
    action: string, 
    details: any, 
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await storage.createSecurityAuditLog({
      userId,
      action,
      details,
      severity
    });
  }

  async detectSuspiciousActivity(userId: string, transactionData: any): Promise<boolean> {
    // Simple suspicious activity detection
    const recentLogs = await storage.getSecurityAuditLogs(userId, 10);
    
    // Check for rapid consecutive transactions
    const recentTransactions = recentLogs.filter(log => 
      log.action === 'transaction_executed' && 
      Date.now() - new Date(log.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentTransactions.length > 5) {
      await this.logSecurityEvent(userId, 'suspicious_activity_detected', {
        type: 'rapid_transactions',
        count: recentTransactions.length,
        timeframe: '5_minutes',
        timestamp: new Date().toISOString()
      }, 'high');
      
      // Auto-lock wallet for security
      await this.lockWallet(userId, 'security_lock');
      return true;
    }

    return false;
  }

  async resetDailyLimits(): Promise<void> {
    // This would typically be called by a daily cron job
    const allUsers = []; // In a real implementation, you'd get all users
    
    for (const user of allUsers) {
      await storage.updateUser(user.id, {
        dailyTransactionUsed: '0',
        lastTransactionReset: new Date().toISOString()
      });
    }
  }
}

export const walletSecurityService = new WalletSecurityService();