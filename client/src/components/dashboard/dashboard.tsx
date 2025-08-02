"use client"; 

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Shield,
  Zap,
  Network,
  RefreshCw} from "lucide-react";

import { FusionPlusInterface } from "@/components/cross-chain/fusion-plus-interface";
import { SecurityControls } from "@/components/security/security-controls";
import { StrategyBuilder } from "@/components/strategies/strategy-builder";
import { ActiveStrategies } from "@/components/strategies/active-strategies";
import { PortfolioAnalytics } from "@/components/portfolio/portfolio-analytics";
import { PortfolioAnalysis } from "@/components/portfolio/portfolio-analysis";
import { RiskAssessment } from "@/components/portfolio/risk-assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocketContext } from "@/shared/providers/WebSocketProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { SUPPORTED_NETWORKS } from "@/config/blockchains";

interface ConnectionStatus {
  isOnline: boolean;
  wsConnected: boolean;
  lastSync: string;
}

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: true,
    wsConnected: false,
    lastSync: new Date().toLocaleTimeString(),
  });

  const { wallet, isOnline, connect, disconnect } = useWallet();
  const { isConnected: wsConnected, sendMessage, subscribe, unsubscribe } = useWebSocketContext();
  const isMobile = useIsMobile();

  // Update connection status
  useEffect(() => {
    setConnectionStatus(prev => ({
      ...prev,
      isOnline,
      wsConnected,
      lastSync: new Date().toLocaleTimeString()
    }));
  }, [isOnline, wsConnected]);

  // WebSocket subscription management
  useEffect(() => {
    if (wsConnected) {
      console.log("Subscribing to portfolio updates");
      subscribe({ 
        type: 'portfolio', 
        data: { userId: wallet?.id } 
      });
      subscribe({ 
        type: 'risk', 
        data: { walletAddress: wallet?.address } 
      });
      subscribe({ 
        type: 'gas', 
        data: { chainId: wallet?.chainId } 
      });
    }

    return () => {
      if (wsConnected) {
        unsubscribe({ type: 'portfolio' });
        unsubscribe({ type: 'risk' });
        unsubscribe({ type: 'gas' });
      }
    };
  }, [wsConnected, wallet?.id, wallet?.address, wallet?.chainId, subscribe, unsubscribe]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnlineStatus = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        lastSync: new Date().toLocaleTimeString()
      }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const navigateToSection = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  const currentNetwork = useMemo(
    () => SUPPORTED_NETWORKS[wallet?.chainId as keyof typeof SUPPORTED_NETWORKS],
    [wallet?.chainId]
  );

  const refreshData = useCallback(() => {
    setConnectionStatus(prev => ({
      ...prev,
      lastSync: new Date().toLocaleTimeString()
    }));
    
    // Send refresh command to backend
    if (wsConnected) {
      sendMessage('refresh_data', { 
        timestamp: Date.now(),
        userId: wallet?.id});
    }
  }, [wsConnected, wallet?.id, sendMessage]);

  const connectionBadgeVariant = useMemo(() => {
    if (!connectionStatus.isOnline) return "destructive";
    if (!connectionStatus.wsConnected) return "outline";
    return "secondary";
  }, [connectionStatus]);

  const connectionBadgeText = useMemo(() => {
    if (!connectionStatus.isOnline) return "Offline";
    if (!connectionStatus.wsConnected) return "Connecting...";
    return "Live";
  }, [connectionStatus]);

  return (
    <div className="space-y-8">
      <main className="flex-1 overflow-hidden">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header with Connection Status */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                DeFi Trading Hub
              </h1>
              <p className="text-gray-400">
                Advanced trading with 1inch Fusion+ integration
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Badge
                variant={connectionBadgeVariant}
                className="flex items-center space-x-2"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    connectionStatus.isOnline && connectionStatus.wsConnected 
                      ? "bg-green-500" 
                      : connectionStatus.isOnline 
                        ? "bg-yellow-500" 
                        : "bg-red-500"
                  )}
                />
                <span>{connectionBadgeText}</span>
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="text-xs"
                disabled={!connectionStatus.isOnline || !wsConnected}
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", wsConnected && "animate-spin")} />
                Refresh
              </Button>

              <Badge variant="secondary" className="text-xs">
                Last sync: {connectionStatus.lastSync}
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Portfolio Value</p>
                    <p className="text-2xl font-bold text-white">$42,350</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Strategies</p>
                    <p className="text-2xl font-bold text-white">7</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Security Score</p>
                    <p className="text-2xl font-bold text-white">98%</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Network</p>
                    <p className="text-lg font-bold text-white">
                      {currentNetwork?.name || "Disconnected"}
                    </p>
                  </div>
                  <Network className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Primary Trading Interface - Single Fusion+ Swap */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <section id="swap" className="scroll-mt-20">
                <FusionPlusInterface />
              </section>
            </div>

            <div className="space-y-6">
              <section id="risk" className="scroll-mt-20">
                <RiskAssessment />
              </section>
            </div>
          </div>

          {/* Strategy Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section id="strategy-builder" className="scroll-mt-20">
              <StrategyBuilder />
            </section>
            <section id="strategies" className="scroll-mt-20">
              <ActiveStrategies />
            </section>
          </div>

          {/* Portfolio Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section id="portfolio" className="scroll-mt-20">
              <PortfolioAnalytics />
            </section>
            <section id="analysis" className="scroll-mt-20">
              <PortfolioAnalysis />
            </section>
          </div>

          {/* Security Settings - Only show when wallet is connected */}
          {wallet?.connected && (
            <section id="security" className="scroll-mt-20">
              <SecurityControls />
            </section>
          )}

          {/* Connection Status Panel - Mobile */}
          {isMobile && (
            <Card className="bg-gray-800 border-gray-700 lg:hidden">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-white">Connection Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Internet</span>
                  <Badge variant={connectionStatus.isOnline ? "secondary" : "destructive"}>
                    {connectionStatus.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">WebSocket</span>
                  <Badge variant={wsConnected ? "secondary" : "outline"}>
                    {wsConnected ? "Connected" : "Connecting..."}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400">
                  Last sync: {connectionStatus.lastSync}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;