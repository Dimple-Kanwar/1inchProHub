export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  price?: string;
  priceChange24h?: number;
}

export interface SwapQuote {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  protocols: any[];
  estimatedGas: string;
  priceImpact: string;
  rate: string;
  networkFee: string;
  minReceived: string;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  slippage: number;
  chainId: number;
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  type: 'dca' | 'stop_loss' | 'take_profit' | 'grid_trading';
  status: 'active' | 'paused' | 'completed';
  parameters: {
    tokenIn?: string;
    tokenOut?: string;
    amount?: string;
    frequency?: string;
    triggerPrice?: string;
    targetPrice?: string;
    gridLevels?: number;
    [key: string]: any;
  };
  performance?: {
    totalReturn: number;
    totalTrades: number;
    successRate: number;
    lastExecuted?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioAsset {
  token: TokenInfo;
  amount: string;
  value: string;
  allocation: number;
  change24h: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  totalValue: string;
  assets: PortfolioAsset[];
  change24h: number;
  lastUpdated: Date;
}

export interface CrossChainBridge {
  id: string;
  userId: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  status: 'initiated' | 'locked' | 'completed' | 'refunded';
  hashlock?: string;
  timelock?: Date;
  estimatedTime?: string;
  bridgeFee?: string;
  createdAt: Date;
}

export interface GasPrices {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
}

export interface MarketData {
  tokenPairs: {
    [key: string]: {
      price: string;
      change24h: number;
      volume24h: string;
    };
  };
  gasPrices: GasPrices;
  lastUpdated: Date;
}

export interface WebSocketMessage {
  type: 'price_update' | 'gas_update' | 'swap_update' | 'strategy_update' | 'portfolio_update' | 'notification' | 'error';
  data: any;
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
}
