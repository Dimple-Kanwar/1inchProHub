import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Wallet,
  Settings,
  TrendingUp,
  Shield,
  Zap,
  Wifi,
  WifiOff,
  ChevronDown,
  Network,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWebSocket } from "@/hooks/use-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { SUPPORTED_NETWORKS } from "@/config/blockchains";

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: true,
    lastSync: new Date().toLocaleTimeString(),
  });

  const { wallet, isOnline } = useWallet();
  const { isConnected: wsConnected } = useWebSocket();
  const isMobile = useIsMobile();

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
        lastSync: new Date().toLocaleTimeString(),
      }));
    }, 30000);

    const handleOnlineStatus = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
      }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      clearInterval(interval);
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
                  variant="outline"
                  className={cn(
                    "flex items-center space-x-2",
                    wsConnected && isOnline ? "border-green-500" : "border-red-500",
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      wsConnected && isOnline ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <span>
                    {wsConnected && isOnline ? "Live" : isOnline ? "Connecting..." : "Offline"}
                  </span>
                </Badge>

                <Badge variant="secondary" className="text-xs">
                  Last sync: {connectionStatus.lastSync}
                </Badge>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
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
              <Card className="bg-gray-800 border-gray-700">
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
              <Card className="bg-gray-800 border-gray-700">
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
              <Card className="bg-gray-800 border-gray-700">
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
                <section id="swap">
                  <FusionPlusInterface />
                </section>
              </div>

              <div className="space-y-6">
                <section id="risk">
                  <RiskAssessment />
                </section>
              </div>
            </div>

            {/* Strategy Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section id="strategy-builder">
                <StrategyBuilder />
              </section>
              <section id="strategies">
                <ActiveStrategies />
              </section>
            </div>

            {/* Portfolio Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section id="portfolio">
                <PortfolioAnalytics />
              </section>
              <section id="analysis">
                <PortfolioAnalysis />
              </section>
            </div>

            {/* Security Settings - Only show when wallet is connected */}
            {wallet?.connected && (
              <section id="security">
                <SecurityControls />
              </section>
            )}
          </div>
        </main>
    </div>
  );
}