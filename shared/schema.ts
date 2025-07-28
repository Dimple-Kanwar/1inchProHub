import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  // Security features
  walletLocked: boolean("wallet_locked").default(false),
  lockReason: text("lock_reason"), // 'user_lock', 'security_lock', 'limit_exceeded'
  dailyTransactionLimit: decimal("daily_transaction_limit", { precision: 18, scale: 8 }).default('10000'),
  dailyTransactionUsed: decimal("daily_transaction_used", { precision: 18, scale: 8 }).default('0'),
  lastTransactionReset: timestamp("last_transaction_reset").defaultNow(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  securitySettings: jsonb("security_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).notNull(),
  assets: jsonb("assets").notNull(), // Array of asset holdings
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'dca', 'stop_loss', 'take_profit', 'grid_trading'
  status: text("status").notNull().default('active'), // 'active', 'paused', 'completed'
  parameters: jsonb("parameters").notNull(),
  performance: jsonb("performance"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swapTransactions = pgTable("swap_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  fromAmount: decimal("from_amount", { precision: 18, scale: 8 }).notNull(),
  toAmount: decimal("to_amount", { precision: 18, scale: 8 }),
  fromChain: text("from_chain").notNull(),
  toChain: text("to_chain").notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'failed', 'locked', 'claimed'
  swapType: text("swap_type").notNull(), // 'fusion_plus', 'fusion', 'classic', 'limit_order', 'atomic_swap'
  priceImpact: decimal("price_impact", { precision: 5, scale: 4 }),
  networkFee: decimal("network_fee", { precision: 18, scale: 8 }),
  // Atomic swap fields
  hashlock: text("hashlock"),
  timelock: timestamp("timelock"),
  secret: text("secret"),
  partialFills: jsonb("partial_fills").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crossChainBridges = pgTable("cross_chain_bridges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fromChain: text("from_chain").notNull(), // 'ethereum', 'sui', 'near', 'aptos', 'bitcoin', etc.
  toChain: text("to_chain").notNull(),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  fromTxHash: text("from_tx_hash"),
  toTxHash: text("to_tx_hash"),
  hashlock: text("hashlock").notNull(),
  timelock: timestamp("timelock").notNull(),
  secret: text("secret"),
  secretHash: text("secret_hash"),
  status: text("status").notNull().default('initiated'), // 'initiated', 'locked', 'completed', 'refunded', 'claimed'
  bridgeType: text("bridge_type").notNull(), // 'fusion_plus', 'atomic_swap'
  chainData: jsonb("chain_data").default({}), // Chain-specific metadata
  relayerAddress: text("relayer_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).pick({
  userId: true,
  totalValue: true,
  assets: true,
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  userId: true,
  name: true,
  type: true,
  parameters: true,
});

export const insertSwapTransactionSchema = createInsertSchema(swapTransactions).pick({
  userId: true,
  fromToken: true,
  toToken: true,
  fromAmount: true,
  fromChain: true,
  toChain: true,
  swapType: true,
});

export const insertCrossChainBridgeSchema = createInsertSchema(crossChainBridges).pick({
  userId: true,
  fromChain: true,
  toChain: true,
  fromToken: true,
  toToken: true,
  amount: true,
  hashlock: true,
  timelock: true,
  bridgeType: true,
});

// Security audit log table
export const securityAuditLog = pgTable("security_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'wallet_lock', 'wallet_unlock', 'limit_change', 'large_transaction', etc.
  details: jsonb("details").default({}),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertSecurityAuditLogSchema = createInsertSchema(securityAuditLog).pick({
  userId: true,
  action: true,
  details: true,
  severity: true,
  ipAddress: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertSwapTransaction = z.infer<typeof insertSwapTransactionSchema>;
export type SwapTransaction = typeof swapTransactions.$inferSelect;
export type InsertCrossChainBridge = z.infer<typeof insertCrossChainBridgeSchema>;
export type CrossChainBridge = typeof crossChainBridges.$inferSelect;
export type InsertSecurityAuditLog = z.infer<typeof insertSecurityAuditLogSchema>;
export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;

// Chain configuration for cross-chain support
export const SUPPORTED_CHAINS = {
  // EVM Chains
  ethereum: { id: 1, name: 'Ethereum', type: 'evm', rpc: 'https://eth.llamarpc.com' },
  arbitrum: { id: 42161, name: 'Arbitrum', type: 'evm', rpc: 'https://arb1.arbitrum.io/rpc' },
  polygon: { id: 137, name: 'Polygon', type: 'evm', rpc: 'https://polygon-rpc.com' },
  bsc: { id: 56, name: 'BSC', type: 'evm', rpc: 'https://bsc-dataseed.binance.org' },
  avalanche: { id: 43114, name: 'Avalanche', type: 'evm', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  
  // Non-EVM Chains - Target for hackathon prizes
  sui: { id: 'sui-mainnet', name: 'Sui', type: 'non-evm', rpc: 'https://fullnode.mainnet.sui.io:443' },
  near: { id: 'near-mainnet', name: 'Near', type: 'non-evm', rpc: 'https://rpc.mainnet.near.org' },
  aptos: { id: 'aptos-mainnet', name: 'Aptos', type: 'non-evm', rpc: 'https://fullnode.mainnet.aptoslabs.com/v1' },
  bitcoin: { id: 'bitcoin-mainnet', name: 'Bitcoin', type: 'non-evm', rpc: 'https://blockstream.info/api' },
  tron: { id: 'tron-mainnet', name: 'Tron', type: 'non-evm', rpc: 'https://api.trongrid.io' },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;
