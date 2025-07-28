
import { useState } from 'react';
import { ChevronDown, BarChart3, Menu, Wifi, WifiOff } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/use-wallet';
import { SUPPORTED_NETWORKS } from '@/lib/wagmi-config';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { wallet, isOnline } = useWallet();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const currentNetwork = wallet?.chainId ? SUPPORTED_NETWORKS[wallet.chainId as keyof typeof SUPPORTED_NETWORKS] : null;

  return (
    <header className={cn("sticky top-0 z-50 glass-effect border-b border-gray-700", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                1inch Pro Hub
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Network Display */}
            {wallet?.connected && currentNetwork && (
              <div className="hidden md:flex items-center space-x-3 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                <div className={cn("w-2 h-2 rounded-full", currentNetwork.color)}></div>
                <span className="text-sm text-gray-300">{currentNetwork.name}</span>
                <span className="text-xs text-gray-500">{currentNetwork.icon}</span>
              </div>
            )}
            
            {/* Wallet Connection */}
            <div className="wallet-connect-wrapper">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated');

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg border border-blue-500 transition-colors text-sm font-medium text-white"
                              disabled={!isOnline}
                            >
                              {isOnline ? 'Connect Wallet' : 'Offline'}
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg border border-red-500 transition-colors text-sm font-medium text-white"
                            >
                              Unsupported Network
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={openChainModal}
                              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-700 transition-colors text-sm"
                              type="button"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 12,
                                    height: 12,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                    marginRight: 4,
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 12, height: 12 }}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="text-gray-300">{chain.name}</span>
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-700 transition-colors text-sm font-medium text-gray-300"
                            >
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ''}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
            
            <button 
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status:</span>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Offline</span>
                    </>
                  )}
                </div>
              </div>
              
              {wallet?.connected && currentNetwork && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Network:</span>
                  <div className="flex items-center space-x-2">
                    <div className={cn("w-2 h-2 rounded-full", currentNetwork.color)}></div>
                    <span className="text-sm text-gray-300">{currentNetwork.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
