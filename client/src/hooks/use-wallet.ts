
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain, useChainId } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useToast } from './use-toast';
import { useEffect } from 'react';

export interface WalletConnection {
  address: string;
  chainId: number;
  balance: string;
  connected: boolean;
}

export interface UseWalletReturn {
  wallet: WalletConnection | null;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  isOnline: boolean;
}

export function useWallet(): UseWalletReturn {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();

  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  // Check online status
  const isOnline = navigator.onLine;

  useEffect(() => {
    const handleOnline = () => {
      toast({
        title: "Connection Restored",
        description: "You're back online",
      });
    };

    const handleOffline = () => {
      toast({
        title: "Connection Lost",
        description: "You're currently offline",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const wallet: WalletConnection | null = isConnected && address ? {
    address,
    chainId,
    balance: balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000',
    connected: true
  } : null;

  const handleConnect = () => {
    if (!isOnline) {
      toast({
        title: "Connection Error",
        description: "Please check your internet connection",
        variant: "destructive"
      });
      return;
    }
    
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleSwitchChain = async (targetChainId: number) => {
    if (!isOnline) {
      toast({
        title: "Network Error",
        description: "Please check your internet connection",
        variant: "destructive"
      });
      return;
    }

    try {
      await switchChain({ chainId: targetChainId });
      toast({
        title: "Network Switched",
        description: `Successfully switched to chain ${targetChainId}`,
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch network. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    wallet,
    isConnecting: isPending,
    connect: handleConnect,
    disconnect,
    switchChain: handleSwitchChain,
    isOnline
  };
}
