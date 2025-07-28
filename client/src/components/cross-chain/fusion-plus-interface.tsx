import { useState, useEffect } from "react";
import {
  ArrowUpDown,
  Zap,
  Shield,
  AlertTriangle,
  Clock,
  Network,
  ArrowRight,
  Settings,
  Info,
  Lock,
  Timer,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface FusionPlusInterfaceProps {
  className?: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance?: string;
}

interface Chain {
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
}

interface CrossChainOrder {
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

const SUPPORTED_CHAINS: Record<number, Chain> = {
  // EVM Chains
  1: {
    id: 1,
    name: "Ethereum",
    type: "EVM",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  137: {
    id: 137,
    name: "Polygon",
    type: "EVM",
    nativeCurrency: { symbol: "MATIC", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  42161: {
    id: 42161,
    name: "Arbitrum",
    type: "EVM",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  56: {
    id: 56,
    name: "BSC",
    type: "EVM",
    nativeCurrency: { symbol: "BNB", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  43114: {
    id: 43114,
    name: "Avalanche",
    type: "EVM",
    nativeCurrency: { symbol: "AVAX", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  10: {
    id: 10,
    name: "Optimism",
    type: "EVM",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  250: {
    id: 250,
    name: "Fantom",
    type: "EVM",
    nativeCurrency: { symbol: "FTM", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },

  // Non-EVM Chains with Hashlock/Timelock Support
  101: {
    id: 101,
    name: "Sui",
    type: "non-EVM",
    nativeCurrency: { symbol: "SUI", decimals: 9 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  102: {
    id: 102,
    name: "Aptos",
    type: "non-EVM",
    nativeCurrency: { symbol: "APT", decimals: 8 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  103: {
    id: 103,
    name: "Near",
    type: "non-EVM",
    nativeCurrency: { symbol: "NEAR", decimals: 24 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  104: {
    id: 104,
    name: "Starknet",
    type: "non-EVM",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  195: {
    id: 195,
    name: "Tron",
    type: "non-EVM",
    nativeCurrency: { symbol: "TRX", decimals: 6 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  196: {
    id: 196,
    name: "Ton",
    type: "non-EVM",
    nativeCurrency: { symbol: "TON", decimals: 9 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  197: {
    id: 197,
    name: "Bitcoin",
    type: "non-EVM",
    nativeCurrency: { symbol: "BTC", decimals: 8 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  198: {
    id: 198,
    name: "Cardano",
    type: "non-EVM",
    nativeCurrency: { symbol: "ADA", decimals: 6 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  199: {
    id: 199,
    name: "Stellar",
    type: "non-EVM",
    nativeCurrency: { symbol: "XLM", decimals: 7 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  200: {
    id: 200,
    name: "XRP Ledger",
    type: "non-EVM",
    nativeCurrency: { symbol: "XRP", decimals: 6 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  201: {
    id: 201,
    name: "Polkadot",
    type: "non-EVM",
    nativeCurrency: { symbol: "DOT", decimals: 10 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  202: {
    id: 202,
    name: "Cosmos Hub",
    type: "non-EVM",
    nativeCurrency: { symbol: "ATOM", decimals: 6 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
  203: {
    id: 203,
    name: "Tezos",
    type: "non-EVM",
    nativeCurrency: { symbol: "XTZ", decimals: 6 },
    rpcUrls: [],
    blockExplorerUrls: [],
    hashlockSupport: true,
    timelockSupport: true,
  },
};

const POPULAR_TOKENS: Record<number, Token[]> = {
  1: [
    {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      logoURI: "",
      balance: "2.5",
    },
    {
      address: "0xA0b86a33E6441b6c4e8b36f9ccc5b47e12e6a1D5",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "",
      balance: "1500.0",
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether",
      decimals: 6,
      logoURI: "",
      balance: "0.0",
    },
  ],
  137: [
    {
      address: "0x0000000000000000000000000000000000001010",
      symbol: "MATIC",
      name: "Polygon",
      decimals: 18,
      logoURI: "",
      balance: "1250.0",
    },
    {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "",
      balance: "500.0",
    },
  ],
  101: [
    {
      address: "0x0::sui::SUI",
      symbol: "SUI",
      name: "Sui",
      decimals: 9,
      logoURI: "",
      balance: "1000.0",
    },
    {
      address: "0x0::usdc::USDC",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "",
      balance: "2500.0",
    },
  ],
  102: [
    {
      address: "0x1::aptos_coin::AptosCoin",
      symbol: "APT",
      name: "Aptos",
      decimals: 8,
      logoURI: "",
      balance: "500.0",
    },
    {
      address: "0x1::usdc::USDC",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "",
      balance: "1000.0",
    },
  ],
};

export function FusionPlusInterface({ className }: FusionPlusInterfaceProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"swap" | "bridge">("swap");
  const [fromChain, setFromChain] = useState<number>(1);
  const [toChain, setToChain] = useState<number>(137);
  const [fromToken, setFromToken] = useState<Token | null>(
    POPULAR_TOKENS[1]?.[0] || null,
  );
  const [toToken, setToToken] = useState<Token | null>(
    POPULAR_TOKENS[137]?.[1] || null,
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [enablePartialFills, setEnablePartialFills] = useState(false);
  const [customTimelock, setCustomTimelock] = useState(3600); // 1 hour default
  const [activeOrders, setActiveOrders] = useState<CrossChainOrder[]>([]);

  // Auto-calculate toAmount when fromAmount changes
  useEffect(() => {
    if (fromAmount && fromToken && toToken && parseFloat(fromAmount) > 0) {
      const timer = setTimeout(() => {
        fetchQuote();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fromAmount, fromToken, toToken, fromChain, toChain]);

  const fetchQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/fusion/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromChainId: fromChain,
          toChainId: toChain,
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount: fromAmount,
          enablePartialFills,
        }),
      });

      const data = await response.json();
      if (data.toAmount) {
        setToAmount(data.toAmount);
      }
    } catch (error) {
      console.error("Quote fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCrossChainSwap = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setIsLoading(true);
    try {
      const fromChainInfo = SUPPORTED_CHAINS[fromChain];
      const toChainInfo = SUPPORTED_CHAINS[toChain];

      // Generate hashlock for atomic swap
      const hashlock = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      const timelock = Math.floor(Date.now() / 1000) + customTimelock;

      const orderData = {
        fromChainId: fromChain,
        toChainId: toChain,
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        fromAmount,
        toAmount,
        hashlock:
          fromChainInfo.hashlockSupport && toChainInfo.hashlockSupport
            ? hashlock
            : undefined,
        timelock:
          fromChainInfo.timelockSupport && toChainInfo.timelockSupport
            ? timelock
            : undefined,
        enablePartialFills,
        slippage,
      };

      const response = await fetch("/api/fusion/cross-chain-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        const newOrder: CrossChainOrder = {
          id: result.orderId,
          fromChain,
          toChain,
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          hashlock: orderData.hashlock,
          timelock: orderData.timelock,
          status: "pending",
          createdAt: Date.now(),
          expiresAt: (orderData.timelock || 0) * 1000,
        };

        setActiveOrders((prev) => [newOrder, ...prev]);

        toast({
          title: "Cross-chain Swap Initiated",
          description: `${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`,
        });
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchTokens = () => {
    if (mode === "swap" && fromChain === toChain) {
      setFromToken(toToken);
      setToToken(fromToken);
      setFromAmount(toAmount);
      setToAmount(fromAmount);
    } else {
      // For cross-chain, switch chains and tokens
      const tempChain = fromChain;
      const tempToken = fromToken;

      setFromChain(toChain);
      setToChain(tempChain);
      setFromToken(POPULAR_TOKENS[toChain]?.[0] || null);
      setToToken(POPULAR_TOKENS[tempChain]?.[0] || null);
      setFromAmount("");
      setToAmount("");
    }
  };

  const availableFromTokens = POPULAR_TOKENS[fromChain] || [];
  const availableToTokens = POPULAR_TOKENS[toChain] || [];

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span>1inch Fusion+ Extended</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="text-green-400 border-green-500"
            >
              <Lock className="w-3 h-3 mr-1" />
              Hashlock
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-500">
              <Timer className="w-3 h-3 mr-1" />
              Timelock
            </Badge>
            <Badge
              variant="outline"
              className="text-purple-400 border-purple-500"
            >
              Non-EVM Support
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "swap" | "bridge")}
        >
          <TabsList className="grid w-full grid-cols-1 bg-gray-700">
            <TabsTrigger
              value="swap"
              className="text-gray-300 data-[state=active]:text-white"
            >
              Cross-chain Swap
            </TabsTrigger>
            {/* <TabsTrigger value="bridge" className="text-gray-300 data-[state=active]:text-white">
              Atomic Bridge
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="swap" className="space-y-4">
            {/* From Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-gray-300">From Chain & Token</Label>
                <div className="text-xs text-gray-400">
                  Balance: {fromToken?.balance || "0"} {fromToken?.symbol}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select
                  value={fromChain.toString()}
                  onValueChange={(value) => {
                    const chainId = parseInt(value);
                    setFromChain(chainId);
                    setFromToken(POPULAR_TOKENS[chainId]?.[0] || null);
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {Object.values(SUPPORTED_CHAINS).map((chain) => (
                      <SelectItem
                        key={chain.id}
                        value={chain.id.toString()}
                        className="text-white hover:bg-gray-600"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{chain.name}</span>
                          <Badge
                            variant="outline"
                            size="sm"
                            className={
                              chain.type === "EVM"
                                ? "text-blue-400"
                                : "text-purple-400"
                            }
                          >
                            {chain.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={fromToken?.address || ""}
                  onValueChange={(value) => {
                    const token = availableFromTokens.find(
                      (t) => t.address === value,
                    );
                    setFromToken(token || null);
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {availableFromTokens.map((token) => (
                      <SelectItem
                        key={token.address}
                        value={token.address}
                        className="text-white hover:bg-gray-600"
                      >
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={switchTokens}
                className="rounded-full bg-gray-700 hover:bg-gray-600"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            {/* To Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-gray-300">To Chain & Token</Label>
                <div className="text-xs text-gray-400">
                  Balance: {toToken?.balance || "0"} {toToken?.symbol}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select
                  value={toChain.toString()}
                  onValueChange={(value) => {
                    const chainId = parseInt(value);
                    setToChain(chainId);
                    setToToken(POPULAR_TOKENS[chainId]?.[0] || null);
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {Object.values(SUPPORTED_CHAINS)
                      .filter((chain) => chain.id !== fromChain)
                      .map((chain) => (
                        <SelectItem
                          key={chain.id}
                          value={chain.id.toString()}
                          className="text-white hover:bg-gray-600"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{chain.name}</span>
                            <Badge
                              variant="outline"
                              size="sm"
                              className={
                                chain.type === "EVM"
                                  ? "text-blue-400"
                                  : "text-purple-400"
                              }
                            >
                              {chain.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select
                  value={toToken?.address || ""}
                  onValueChange={(value) => {
                    const token = availableToTokens.find(
                      (t) => t.address === value,
                    );
                    setToToken(token || null);
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {availableToTokens.map((token) => (
                      <SelectItem
                        key={token.address}
                        value={token.address}
                        className="text-white hover:bg-gray-600"
                      >
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder={isLoading ? "Calculating..." : "0.0"}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </TabsContent>

          {/* <TabsContent value="bridge" className="space-y-4">
            <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <Network className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-300 text-sm">
                Atomic cross-chain transfers with hashlock/timelock security
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports both EVM and non-EVM chains
              </p>
            </div>
          </TabsContent> */}
        </Tabs>

        {/* Advanced Options */}
        <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              Advanced Options
            </span>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={enablePartialFills}
                onCheckedChange={setEnablePartialFills}
              />
              <div>
                <span className="text-sm text-gray-300">
                  Enable Partial Fills
                </span>
                <p className="text-xs text-gray-400">
                  Allow order to be partially executed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Timelock Duration (seconds)
              </Label>
              <Input
                type="number"
                value={customTimelock}
                onChange={(e) =>
                  setCustomTimelock(parseInt(e.target.value) || 3600)
                }
                className="bg-gray-600 border-gray-500 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Slippage Tolerance</span>
              <span className="text-sm text-gray-400">{slippage}%</span>
            </div>
            <Slider
              value={[slippage]}
              onValueChange={(value) => setSlippage(value[0])}
              max={5}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Security Features Display */}
        <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">
              Enhanced Security Features
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPORTED_CHAINS[fromChain]?.hashlockSupport &&
              SUPPORTED_CHAINS[toChain]?.hashlockSupport && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <div>
                    <span className="text-sm text-gray-300">
                      Hashlock Protection
                    </span>
                    <p className="text-xs text-gray-400">
                      Cryptographic swap security
                    </p>
                  </div>
                </div>
              )}

            {SUPPORTED_CHAINS[fromChain]?.timelockSupport &&
              SUPPORTED_CHAINS[toChain]?.timelockSupport && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <div>
                    <span className="text-sm text-gray-300">
                      Timelock Protection
                    </span>
                    <p className="text-xs text-gray-400">
                      Automatic refund mechanism
                    </p>
                  </div>
                </div>
              )}

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <div>
                <span className="text-sm text-gray-300">MEV Protection</span>
                <p className="text-xs text-gray-400">Built-in MEV resistance</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <div>
                <span className="text-sm text-gray-300">
                  Bidirectional Swaps
                </span>
                <p className="text-xs text-gray-400">
                  Two-way chain compatibility
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        {fromAmount && toAmount && (
          <div className="p-4 bg-gray-700/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Exchange Rate</span>
              <span className="text-white">
                1 {fromToken?.symbol} ={" "}
                {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}{" "}
                {toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cross-chain Fee</span>
              <span className="text-white">~$5.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estimated Time</span>
              <span className="text-white">
                {SUPPORTED_CHAINS[fromChain]?.type ===
                SUPPORTED_CHAINS[toChain]?.type
                  ? "~2-5 minutes"
                  : "~5-15 minutes"}
              </span>
            </div>
            {SUPPORTED_CHAINS[fromChain]?.hashlockSupport &&
              SUPPORTED_CHAINS[toChain]?.hashlockSupport && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expiry Time</span>
                  <span className="text-white">
                    {Math.floor(customTimelock / 60)} minutes
                  </span>
                </div>
              )}
          </div>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">
              Active Cross-chain Orders
            </h4>
            {activeOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="p-3 bg-gray-700/40 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-white">
                    {order.fromAmount} {order.fromToken.symbol} →{" "}
                    {order.toAmount} {order.toToken.symbol}
                  </div>
                  <Badge
                    variant={
                      order.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {SUPPORTED_CHAINS[order.fromChain]?.name} →{" "}
                  {SUPPORTED_CHAINS[order.toChain]?.name}
                </div>
                {order.status === "pending" && order.timelock && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Time remaining</span>
                      <span>
                        {Math.max(
                          0,
                          Math.floor((order.expiresAt - Date.now()) / 60000),
                        )}{" "}
                        min
                      </span>
                    </div>
                    <Progress
                      value={Math.max(
                        0,
                        (order.expiresAt - Date.now()) / (order.timelock * 10),
                      )}
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={executeCrossChainSwap}
          disabled={!fromAmount || !toAmount || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Execute Fusion+ Cross-chain Swap</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
