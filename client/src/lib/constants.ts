export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ARB',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  BSC: {
    id: 56,
    name: 'BNB Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  AVALANCHE: {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }
  }
} as const;

export const FUSION_PLUS_CHAINS = {
  SUI: {
    id: 'sui',
    name: 'Sui Network',
    symbol: 'SUI',
    status: 'live',
    icon: 'layer-group',
    color: 'from-blue-500 to-purple-500'
  },
  NEAR: {
    id: 'near',
    name: 'Near Protocol',
    symbol: 'NEAR',
    status: 'live',
    icon: 'coins',
    color: 'from-green-500 to-teal-500'
  },
  APTOS: {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    status: 'development',
    icon: 'cube',
    color: 'from-orange-500 to-red-500'
  }
} as const;

export const STRATEGY_TEMPLATES = [
  {
    id: 'dca',
    name: 'DCA Strategy',
    description: 'Dollar Cost Average',
    longDescription: 'Automatically buy tokens at regular intervals to smooth out price volatility.',
    icon: 'chart-line',
    color: 'from-blue-500 to-cyan-500',
    category: 'automated'
  },
  {
    id: 'stop_loss',
    name: 'Stop Loss',
    description: 'Risk Management',
    longDescription: 'Automatically sell positions when they reach a predetermined loss threshold.',
    icon: 'shield-alt',
    color: 'from-green-500 to-cyan-500',
    category: 'risk'
  },
  {
    id: 'take_profit',
    name: 'Take Profit',
    description: 'Profit Securing',
    longDescription: 'Lock in profits when your positions reach target price levels.',
    icon: 'arrow-up',
    color: 'from-yellow-500 to-orange-500',
    category: 'profit'
  },
  {
    id: 'grid_trading',
    name: 'Grid Trading',
    description: 'Market Making',
    longDescription: 'Place multiple buy and sell orders to profit from market volatility.',
    icon: 'exchange-alt',
    color: 'from-purple-500 to-pink-500',
    category: 'advanced'
  }
] as const;

export const TOKEN_ADDRESSES = {
  ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86a33E6441b6c4e8b36f9ccc5b47e12e6a1D5',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
} as const;

export const DEFAULT_SLIPPAGE = 1; // 1%
export const WEBSOCKET_RECONNECT_INTERVAL = 5000;
export const PRICE_UPDATE_INTERVAL = 5000;
export const GAS_UPDATE_INTERVAL = 15000;
