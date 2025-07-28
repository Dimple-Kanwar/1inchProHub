import { useState, useEffect } from 'react';
import { ArrowDown, ChevronDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSwapQuote, useCreateSwap, useTokens } from '@/hooks/use-oneinch';
import { useWebSocket } from '@/hooks/use-websocket';
import { TOKEN_ADDRESSES, DEFAULT_SLIPPAGE } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SwapInterfaceProps {
  className?: string;
}

export function SwapInterface({ className }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState(TOKEN_ADDRESSES.ETH);
  const [toToken, setToToken] = useState(TOKEN_ADDRESSES.USDC);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [isFusionEnabled, setIsFusionEnabled] = useState(true);
  const [userAddress] = useState('0x1234567890abcdef1234567890abcdef12345678');

  const { data: tokens } = useTokens(1);
  const { 
    data: quote, 
    isLoading: isQuoteLoading, 
    error: quoteError 
  } = useSwapQuote(1, fromToken, toToken, fromAmount);
  
  const createSwap = useCreateSwap();

  // WebSocket for real-time price updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'price_update') {
        // Handle real-time price updates
        console.log('Price update received:', message.data);
      }
    }
  });

  const handleSwap = async () => {
    if (!quote || !fromAmount || !userAddress) return;

    try {
      await createSwap.mutateAsync({
        fromToken,
        toToken,
        amount: fromAmount,
        fromAddress: userAddress,
        slippage,
        chainId: 1,
        userId: 'demo-user'
      });

      // Show success notification
      (window as any).showNotification?.({
        type: 'success',
        title: 'Swap Initiated',
        message: `Swapping ${fromAmount} ${getTokenSymbol(fromToken)} for ${getTokenSymbol(toToken)}`
      });

      setFromAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      (window as any).showNotification?.({
        type: 'error',
        title: 'Swap Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getTokenSymbol = (address: string) => {
    if (address === TOKEN_ADDRESSES.ETH) return 'ETH';
    if (address === TOKEN_ADDRESSES.USDC) return 'USDC';
    if (address === TOKEN_ADDRESSES.USDT) return 'USDT';
    if (address === TOKEN_ADDRESSES.DAI) return 'DAI';
    if (address === TOKEN_ADDRESSES.WBTC) return 'WBTC';
    return 'TOKEN';
  };

  const getTokenName = (address: string) => {
    if (address === TOKEN_ADDRESSES.ETH) return 'Ethereum';
    if (address === TOKEN_ADDRESSES.USDC) return 'USD Coin';
    if (address === TOKEN_ADDRESSES.USDT) return 'Tether USD';
    if (address === TOKEN_ADDRESSES.DAI) return 'Dai Stablecoin';
    if (address === TOKEN_ADDRESSES.WBTC) return 'Wrapped Bitcoin';
    return 'Token';
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  };

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">Smart Swap Hub</CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400">Powered by 1inch API</span>
            <div className="flex items-center space-x-2">
              <Button
                variant={isFusionEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFusionEnabled(true)}
                className="text-xs"
              >
                Fusion+
              </Button>
              <Button
                variant={!isFusionEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFusionEnabled(false)}
                className="text-xs"
              >
                Classic
              </Button>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center space-x-2 text-xs text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Real-time prices connected</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-sm text-gray-400">Balance: 12.5 ETH</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <div>
                <div className="font-medium">{getTokenSymbol(fromToken)}</div>
                <div className="text-xs text-gray-400">{getTokenName(fromToken)}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-semibold text-white text-right border-none focus:ring-0"
            />
          </div>
        </div>

        {/* Swap Direction */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={switchTokens}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full"
          >
            <ArrowDown className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        {/* To Token */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">To</span>
            <span className="text-sm text-gray-400">Balance: 0 USDC</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              <div>
                <div className="font-medium">{getTokenSymbol(toToken)}</div>
                <div className="text-xs text-gray-400">{getTokenName(toToken)}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="0.0"
              value={quote?.toAmount || ''}
              disabled
              className="flex-1 bg-transparent text-2xl font-semibold text-white text-right border-none"
            />
          </div>
        </div>

        {/* Swap Details */}
        {quote && (
          <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-lg p-4 border border-blue-500/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Rate</span>
                <span className="text-sm text-white">
                  1 {getTokenSymbol(fromToken)} = {quote.rate} {getTokenSymbol(toToken)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Price Impact</span>
                <span className="text-sm text-green-400">{quote.priceImpact}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network Fee</span>
                <span className="text-sm text-white">{quote.networkFee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Min. Received</span>
                <span className="text-sm text-white">{quote.minReceived}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {quoteError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-400">
              Failed to get quote: {quoteError.message}
            </p>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!quote || !fromAmount || createSwap.isPending || isQuoteLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-lg py-4"
        >
          {createSwap.isPending ? 'Swapping...' : 
           isQuoteLoading ? 'Getting Quote...' :
           isFusionEnabled ? 'Swap with Fusion+' : 'Swap'}
        </Button>
      </CardContent>
    </Card>
  );
}
