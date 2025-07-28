
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  arbitrum,
  bsc,
  avalanche,
  optimism,
  base,
  fantom,
} from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: '1inch Pro Hub',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [
    mainnet,
    polygon,
    arbitrum,
    bsc,
    avalanche,
    optimism,
    base,
    fantom,
  ],
  ssr: false,
});

export const SUPPORTED_NETWORKS = {
  1: { name: 'Ethereum', color: 'bg-blue-500', icon: '⟡' },
  137: { name: 'Polygon', color: 'bg-purple-500', icon: '⬟' },
  42161: { name: 'Arbitrum', color: 'bg-blue-400', icon: '◆' },
  56: { name: 'BSC', color: 'bg-yellow-500', icon: '◉' },
  43114: { name: 'Avalanche', color: 'bg-red-500', icon: '△' },
  10: { name: 'Optimism', color: 'bg-red-400', icon: '◯' },
  8453: { name: 'Base', color: 'bg-blue-600', icon: '⬢' },
  250: { name: 'Fantom', color: 'bg-blue-300', icon: '◊' },
};
