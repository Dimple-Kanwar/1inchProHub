// Core blockchain types and interfaces

export enum ChainType {
  EVM = 'evm',
  MOVE = 'move',
  WASM = 'wasm',
  UTXO = 'utxo',
  STELLAR = 'stellar',
  SOLANA = 'solana',
  COSMOS = 'cosmos',
}
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance?: string;
}
export interface CrossChainOrder {
  id: string;
  fromChain: number;
  toChain: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  hashlock?: string;
  timelock?: number;
  status: "pending" | "locked" | "completed" | "refunded";
  createdAt: number;
  expiresAt: number;
}

export interface ChainConfig {
  id: string;
  name: string;
  chainId: string | number;
  symbol: string;
  type: ChainType;
  rpcUrl: string;
  explorerUrl: string;
  iconUrl?: string;
  testnet?: boolean;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: string;
  balance?: string;
  price?: number;
  color?: string;
}

export interface Chain {
  id: number;
  name: string;
  type: "EVM" | "non-EVM";
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  hashlockSupport: boolean;
  timelockSupport: boolean;
  color?: string; // Optional color for UI representation
}


export interface SwapQuote {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  route: SwapRoute[];
  gasEstimate: string;
  priceImpact: number;
  slippage: number;
  executionTime: number;
  fee: string;
}

export interface SwapRoute {
  protocol: string;
  fromChain: string;
  toChain: string;
  percentage: number;
  gasEstimate: string;
}

export interface Transaction {
  hash: string;
  chainId: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  data: string;
  nonce: number;
  status: TransactionStatus;
  timestamp: number;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface WalletConnection {
  address: string;
  chainId: string;
  connected: boolean;
  walletType: string;
  balance?: string;
}

export interface ChainAdapter {
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  getBalance(address: string, tokenAddress?: string): Promise<string>;
  estimateGas(transaction: Partial<Transaction>): Promise<string>;
  sendTransaction(transaction: Transaction): Promise<string>;
  signMessage(message: string): Promise<string>;
  getTokenList(): Promise<TokenInfo[]>;
  buildSwapTransaction(quote: SwapQuote): Promise<Transaction>;
}

export interface CrossChainSwapParams {
  fromChain: string;
  toChain: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  amount: string;
  slippage: number;
  recipient?: string;
  mevProtection?: boolean;
  partialFills?: boolean;
}

export interface AtomicSwapConfig {
  hashlock: string;
  timelock: number;
  secret?: string;
  refundAddress: string;
}

export interface ChainSignatureRequest {
  chainId: string;
  derivationPath: string;
  payload: string;
  signature?: string;
}

// Sui-specific types
export interface SuiObjectRef {
  objectId: string;
  version: string;
  digest: string;
}

export interface SuiTransactionBlock {
  transactions: any[];
  inputs: any[];
  gasPayment?: SuiObjectRef[];
}

// Near-specific types
export interface NearTransaction {
  signerId: string;
  receiverId: string;
  actions: NearAction[];
}

export interface NearAction {
  type: 'FunctionCall' | 'Transfer' | 'CreateAccount';
  params: any;
}

// Bitcoin-specific types
export interface UtxoInput {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
}

export interface UtxoOutput {
  value: number;
  address: string;
}

// Stellar-specific types
export interface StellarOperation {
  type: string;
  source?: string;
  destination?: string;
  asset?: any;
  amount?: string;
}

// Error types
export interface ChainError {
  code: string;
  message: string;
  details?: any;
}

export interface SwapError extends ChainError {
  step: 'quote' | 'approval' | 'execution' | 'confirmation';
  recoverable: boolean;
}