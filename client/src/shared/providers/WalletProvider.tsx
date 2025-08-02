
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';

// Network types
export type NetworkType = 'EVM' | 'Bitcoin' | 'Cosmos' | 'Substrate' | 'Move' | 'Other';

export interface Network {
  id: string | number;
  name: string;
  type: NetworkType;
  symbol: string;
  decimals: number;
  rpcUrl?: string;
  blockExplorer?: string;
  icon: string;
  color: string;
  walletSupport: string[];
}

// Comprehensive network configurations
export const SUPPORTED_NETWORKS: Record<string, Network> = {
  // EVM Chains
  ethereum: {
    id: 1,
    name: 'Ethereum',
    type: 'EVM',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    icon: '⟡',
    color: 'bg-blue-500',
    walletSupport: ['MetaMask', 'WalletConnect', 'Coinbase', 'Rainbow']
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    type: 'EVM',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    icon: '⬟',
    color: 'bg-purple-500',
    walletSupport: ['MetaMask', 'WalletConnect', 'Coinbase', 'Rainbow']
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    type: 'EVM',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    icon: '◆',
    color: 'bg-blue-400',
    walletSupport: ['MetaMask', 'WalletConnect', 'Coinbase', 'Rainbow']
  },
  bsc: {
    id: 56,
    name: 'BNB Chain',
    type: 'EVM',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    icon: '◉',
    color: 'bg-yellow-500',
    walletSupport: ['MetaMask', 'Trust Wallet', 'WalletConnect', 'Binance Wallet']
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    type: 'EVM',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    icon: '△',
    color: 'bg-red-500',
    walletSupport: ['MetaMask', 'Avalanche Wallet', 'WalletConnect']
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    type: 'EVM',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    icon: '◯',
    color: 'bg-red-400',
    walletSupport: ['MetaMask', 'WalletConnect', 'Coinbase', 'Rainbow']
  },
  base: {
    id: 8453,
    name: 'Base',
    type: 'EVM',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    icon: '⬢',
    color: 'bg-blue-600',
    walletSupport: ['MetaMask', 'Coinbase Wallet', 'WalletConnect', 'Rainbow']
  },
  fantom: {
    id: 250,
    name: 'Fantom',
    type: 'EVM',
    symbol: 'FTM',
    decimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    blockExplorer: 'https://ftmscan.com',
    icon: '◊',
    color: 'bg-blue-300',
    walletSupport: ['MetaMask', 'WalletConnect', 'Fantom Wallet']
  },

  // Move-based chains
  sui: {
    id: 'sui-mainnet',
    name: 'Sui',
    type: 'Move',
    symbol: 'SUI',
    decimals: 9,
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    blockExplorer: 'https://explorer.sui.io',
    icon: '🌊',
    color: 'bg-cyan-500',
    walletSupport: ['Sui Wallet', 'Suiet', 'Ethos Wallet', 'Martian Wallet']
  },
  aptos: {
    id: 'aptos-mainnet',
    name: 'Aptos',
    type: 'Move',
    symbol: 'APT',
    decimals: 8,
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    blockExplorer: 'https://explorer.aptoslabs.com',
    icon: '🔺',
    color: 'bg-green-500',
    walletSupport: ['Petra Wallet', 'Martian Wallet', 'Pontem Wallet', 'Fewcha']
  },

  // Bitcoin-based chains
  bitcoin: {
    id: 'bitcoin-mainnet',
    name: 'Bitcoin',
    type: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    blockExplorer: 'https://blockstream.info',
    icon: '₿',
    color: 'bg-orange-500',
    walletSupport: ['Xverse', 'Leather', 'UniSat', 'OKX Wallet', 'Phantom']
  },
  bitcoinCash: {
    id: 'bitcoin-cash',
    name: 'Bitcoin Cash',
    type: 'Bitcoin',
    symbol: 'BCH',
    decimals: 8,
    blockExplorer: 'https://blockchair.com/bitcoin-cash',
    icon: '💰',
    color: 'bg-green-600',
    walletSupport: ['Bitcoin.com Wallet', 'Electron Cash', 'Exodus']
  },
  dogecoin: {
    id: 'dogecoin',
    name: 'Dogecoin',
    type: 'Bitcoin',
    symbol: 'DOGE',
    decimals: 8,
    blockExplorer: 'https://dogechain.info',
    icon: '🐕',
    color: 'bg-yellow-600',
    walletSupport: ['Dogecoin Core', 'MultiDoge', 'Exodus']
  },
  litecoin: {
    id: 'litecoin',
    name: 'Litecoin',
    type: 'Bitcoin',
    symbol: 'LTC',
    decimals: 8,
    blockExplorer: 'https://blockchair.com/litecoin',
    icon: 'Ł',
    color: 'bg-gray-400',
    walletSupport: ['Litecoin Core', 'Exodus', 'Trust Wallet']
  },

  // Other notable chains
  tron: {
    id: 'tron-mainnet',
    name: 'Tron',
    type: 'Other',
    symbol: 'TRX',
    decimals: 6,
    rpcUrl: 'https://api.trongrid.io',
    blockExplorer: 'https://tronscan.org',
    icon: '🔴',
    color: 'bg-red-600',
    walletSupport: ['TronLink', 'Klever', 'Trust Wallet', 'Ledger']
  },
  ton: {
    id: 'ton-mainnet',
    name: 'TON',
    type: 'Other',
    symbol: 'TON',
    decimals: 9,
    blockExplorer: 'https://tonscan.org',
    icon: '💎',
    color: 'bg-blue-800',
    walletSupport: ['Tonkeeper', 'TON Wallet', 'MyTonWallet', 'OpenMask']
  },
  near: {
    id: 'near-mainnet',
    name: 'NEAR',
    type: 'Other',
    symbol: 'NEAR',
    decimals: 24,
    rpcUrl: 'https://rpc.mainnet.near.org',
    blockExplorer: 'https://explorer.near.org',
    icon: '🌐',
    color: 'bg-emerald-500',
    walletSupport: ['NEAR Wallet', 'MyNearWallet', 'Meteor Wallet', 'Sender Wallet']
  },
  starknet: {
    id: 'starknet-mainnet',
    name: 'Starknet',
    type: 'Other',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    blockExplorer: 'https://starkscan.co',
    icon: '🔷',
    color: 'bg-indigo-600',
    walletSupport: ['ArgentX', 'Braavos', 'Bitget Wallet']
  },
  cardano: {
    id: 'cardano-mainnet',
    name: 'Cardano',
    type: 'Other',
    symbol: 'ADA',
    decimals: 6,
    blockExplorer: 'https://cardanoscan.io',
    icon: '🔹',
    color: 'bg-blue-700',
    walletSupport: ['Yoroi', 'Daedalus', 'Nami', 'Eternl', 'Flint']
  },
  stellar: {
    id: 'stellar-mainnet',
    name: 'Stellar',
    type: 'Other',
    symbol: 'XLM',
    decimals: 7,
    rpcUrl: 'https://horizon.stellar.org',
    blockExplorer: 'https://stellarchain.io',
    icon: '⭐',
    color: 'bg-purple-600',
    walletSupport: ['Freighter', 'LOBSTR', 'StellarTerm', 'Rabet']
  },
  xrp: {
    id: 'xrp-mainnet',
    name: 'XRP Ledger',
    type: 'Other',
    symbol: 'XRP',
    decimals: 6,
    rpcUrl: 'https://xrplcluster.com',
    blockExplorer: 'https://livenet.xrpl.org',
    icon: '💧',
    color: 'bg-gray-700',
    walletSupport: ['Xumm', 'Gem Wallet', 'Crossmark', 'D\'CENT']
  },
  icp: {
    id: 'icp-mainnet',
    name: 'Internet Computer',
    type: 'Other',
    symbol: 'ICP',
    decimals: 8,
    blockExplorer: 'https://dashboard.internetcomputer.org',
    icon: '♾️',
    color: 'bg-purple-800',
    walletSupport: ['Internet Identity', 'Plug Wallet', 'Stoic Wallet', 'AstroX ME']
  },
  tezos: {
    id: 'tezos-mainnet',
    name: 'Tezos',
    type: 'Other',
    symbol: 'XTZ',
    decimals: 6,
    rpcUrl: 'https://mainnet.api.tez.ie',
    blockExplorer: 'https://tzstats.com',
    icon: '🔺',
    color: 'bg-indigo-500',
    walletSupport: ['Temple', 'Kukai', 'Galleon', 'AirGap']
  },
  polkadot: {
    id: 'polkadot-mainnet',
    name: 'Polkadot',
    type: 'Substrate',
    symbol: 'DOT',
    decimals: 10,
    rpcUrl: 'https://rpc.polkadot.io',
    blockExplorer: 'https://polkadot.subscan.io',
    icon: '🔴',
    color: 'bg-pink-600',
    walletSupport: ['Polkadot.js', 'Talisman', 'SubWallet', 'Nova Wallet']
  },
  eos: {
    id: 'eos-mainnet',
    name: 'EOS',
    type: 'Other',
    symbol: 'EOS',
    decimals: 4,
    blockExplorer: 'https://bloks.io',
    icon: '🌟',
    color: 'bg-gray-600',
    walletSupport: ['Anchor', 'Scatter', 'SimplEOS', 'EOS Lynx']
  },
  cosmos: {
    id: 'cosmos-mainnet',
    name: 'Cosmos Hub',
    type: 'Cosmos',
    symbol: 'ATOM',
    decimals: 6,
    rpcUrl: 'https://cosmos-rpc.polkachu.com',
    blockExplorer: 'https://www.mintscan.io/cosmos',
    icon: '⚛️',
    color: 'bg-purple-700',
    walletSupport: ['Keplr', 'Cosmostation', 'Leap Wallet', 'Ping Wallet']
  },
  monad: {
    id: 'monad-testnet',
    name: 'Monad',
    type: 'EVM',
    symbol: 'MON',
    decimals: 18,
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    blockExplorer: 'https://testnet-explorer.monad.xyz',
    icon: '🟣',
    color: 'bg-violet-600',
    walletSupport: ['MetaMask', 'WalletConnect', 'Coinbase Wallet']
  }
};

// Wallet connection interface
export interface WalletConnection {
  address: string;
  networkId: string | number;
  networkName: string;
  balance: string;
  connected: boolean;
  walletType: string;
}

// Wallet context interface
export interface WalletContextType {
  connection: WalletConnection | null;
  supportedNetworks: Record<string, Network>;
  isConnecting: boolean;
  isOnline: boolean;
  connect: (networkId: string, walletType?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (networkId: string) => Promise<void>;
  getNetworkById: (id: string | number) => Network | undefined;
  error: string | null;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Custom hook to use wallet context
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Wallet provider props
interface WalletProviderProps {
  children: ReactNode;
}

// Main wallet provider component
export function WalletProvider({ children }: WalletProviderProps) {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get network by ID
  const getNetworkById = (id: string | number): Network | undefined => {
    return Object.values(SUPPORTED_NETWORKS).find(network => 
      network.id === id || network.id.toString() === id.toString()
    );
  };

  // Connect wallet function
  const connect = async (networkId: string, walletType?: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!isOnline) {
        throw new Error('No internet connection');
      }

      const network = SUPPORTED_NETWORKS[networkId];
      if (!network) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      // For EVM chains, use existing wagmi integration
      if (network.type === 'EVM') {
        // This will be handled by RainbowKit/wagmi
        console.log(`Connecting to EVM network: ${network.name}`);
        return;
      }

      // For non-EVM chains, implement custom connection logic
      // This is a placeholder - each chain would need specific implementation
      console.log(`Connecting to ${network.name} via ${walletType || 'default wallet'}`);
      
      // Simulate connection for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnection({
        address: `${network.symbol.toLowerCase()}_address_placeholder`,
        networkId: network.id,
        networkName: network.name,
        balance: '0.0000',
        connected: true,
        walletType: walletType || 'Generic Wallet'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = async () => {
    try {
      setConnection(null);
      setError(null);
      console.log('Wallet disconnected');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // Switch network function
  const switchNetwork = async (networkId: string) => {
    if (!connection) {
      throw new Error('No wallet connected');
    }

    try {
      const network = SUPPORTED_NETWORKS[networkId];
      if (!network) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      setConnection(prev => prev ? {
        ...prev,
        networkId: network.id,
        networkName: network.name
      } : null);

      console.log(`Switched to network: ${network.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network switch failed';
      setError(errorMessage);
      throw err;
    }
  };

  const contextValue: WalletContextType = {
    connection,
    supportedNetworks: SUPPORTED_NETWORKS,
    isConnecting,
    isOnline,
    connect,
    disconnect,
    switchNetwork,
    getNetworkById,
    error
  };

  return (
    <WalletContext.Provider value={contextValue}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </WalletContext.Provider>
  );
}

// Export network utilities
export const getEvmNetworks = () => 
  Object.values(SUPPORTED_NETWORKS).filter(network => network.type === 'EVM');

export const getNonEvmNetworks = () => 
  Object.values(SUPPORTED_NETWORKS).filter(network => network.type !== 'EVM');

export const getNetworksByType = (type: NetworkType) => 
  Object.values(SUPPORTED_NETWORKS).filter(network => network.type === type);
