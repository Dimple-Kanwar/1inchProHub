import { useState, useEffect } from "react";
import { Zap, ArrowUpDown, Lock, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_NETWORKS, POPULAR_TOKENS} from "@/config/blockchains";
import { cn } from "@/lib/utils";
import { FusionChainTokenSelector } from "./FusionChainTokenSelector";
import { FusionAdvancedOptions } from "./FusionAdvancedOptions";
import { FusionSecurityFeatures } from "./FusionSecurityFeatures";
import { FusionTransactionSummary } from "./FusionTransactionSummary";
import { FusionActiveOrders } from "./FusionActiveOrders";
import { CrossChainOrder, Token } from "@/types/blockchain";

interface FusionPlusInterfaceProps {
  className?: string;
}

export function FusionPlusInterface({ className }: FusionPlusInterfaceProps) {
  const { toast } = useToast();
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
      const fromChainInfo = SUPPORTED_NETWORKS[fromChain];
      const toChainInfo = SUPPORTED_NETWORKS[toChain];

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
    const tempChain = fromChain;
    const tempToken = fromToken;

    setFromChain(toChain);
    setToChain(tempChain);
    setFromToken(POPULAR_TOKENS[toChain]?.[0] || null);
    setToToken(POPULAR_TOKENS[tempChain]?.[0] || null);
    setFromAmount("");
    setToAmount("");
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
            <Badge variant="outline" className="text-green-400 border-green-500">
              <Lock className="w-3 h-3 mr-1" />
              Hashlock
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-500">
              <Timer className="w-3 h-3 mr-1" />
              Timelock
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-500">
              Non-EVM Support
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FusionChainTokenSelector
          label="From Chain & Token"
          chain={fromChain}
          setChain={setFromChain}
          token={fromToken}
          setToken={setFromToken}
          availableTokens={availableFromTokens}
          amount={fromAmount}
          setAmount={setFromAmount}
          balance={fromToken?.balance}
        />
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
        <FusionChainTokenSelector
          label="To Chain & Token"
          chain={toChain}
          setChain={setToChain}
          token={toToken}
          setToken={setToToken}
          availableTokens={availableToTokens}
          amount={toAmount}
          readOnlyAmount
          isLoading={isLoading}
          balance={toToken?.balance}
        />
        <FusionAdvancedOptions
          enablePartialFills={enablePartialFills}
          setEnablePartialFills={setEnablePartialFills}
          customTimelock={customTimelock}
          setCustomTimelock={setCustomTimelock}
          slippage={slippage}
          setSlippage={setSlippage}
        />
        <FusionSecurityFeatures fromChain={fromChain} toChain={toChain} />
        <FusionTransactionSummary
          fromAmount={fromAmount}
          toAmount={toAmount}
          fromToken={fromToken}
          toToken={toToken}
          fromChain={fromChain}
          toChain={toChain}
          customTimelock={customTimelock}
        />
        <FusionActiveOrders activeOrders={activeOrders} />
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
