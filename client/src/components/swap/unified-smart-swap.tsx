import { useState, useEffect } from 'react';
import { ArrowUpDown, Shield, Lock, Unlock, Settings, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { SUPPORTED_CHAINS, type ChainId } from '@shared/schema';
import { cn } from '@/lib/utils';

interface UnifiedSmartSwapProps {
  className?: string;
}

interface Token {
  symbol: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  balance?: string;
}

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  gasEstimate: string;
  priceImpact: number;
  route: any[];
  estimatedGas: string;
}

interface SecurityStatus {
  walletLocked: boolean;
  dailyLimit: string;
  dailyUsed: string;
  requiresAuth: boolean;
}

export function UnifiedSmartSwap({ className }: UnifiedSmartSwapProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [swapMode, setSwapMode] = useState<'regular' | 'fusion_plus' | 'atomic'>('regular');
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromChain, setFromChain] = useState<ChainId>('ethereum');
  const [toChain, setToChain] = useState<ChainId>('ethereum');
  const [slippage, setSlippage] = useState('0.5');
  const [gasPrice, setGasPrice] = useState('standard');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    walletLocked: false,
    dailyLimit: '10000',
    dailyUsed: '0',
    requiresAuth: false
  });
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [enablePartialFills, setEnablePartialFills] = useState(false);
  const [timelockHours, setTimelockHours] = useState('24');

  // WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'price_update') {
        // Update token prices
        console.log('Price update:', message.data);
      } else if (message.type === 'gas_update') {
        // Update gas prices
        console.log('Gas update:', message.data);
      } else if (message.type === 'security_alert') {
        toast({
          title: "Security Alert",
          description: message.data.message,
          variant: "destructive"
        });
      }
    }
  });

  // Mock tokens for demonstration
  const tokens: Token[] = [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, chainId: 1, balance: '2.5' },
    { symbol: 'USDC', address: '0xa0b86a33e6cb1d506f08b0a7c8f0b0b8e0b0b0b0', decimals: 6, chainId: 1, balance: '5000' },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8, chainId: 1, balance: '0.1' },
    { symbol: 'SUI', address: '0x0000000000000000000000000000000000000000', decimals: 9, chainId: 'sui-mainnet' as any, balance: '1000' },
    { symbol: 'NEAR', address: '0x0000000000000000000000000000000000000000', decimals: 24, chainId: 'near-mainnet' as any, balance: '500' },
  ];

  // Check if cross-chain swap
  const isCrossChain = fromChain !== toChain;
  const isNonEVMInvolved = 
    SUPPORTED_CHAINS[fromChain]?.type === 'non-evm' || 
    SUPPORTED_CHAINS[toChain]?.type === 'non-evm';

  // Auto-select swap mode based on chains
  useEffect(() => {
    if (isCrossChain) {
      if (isNonEVMInvolved) {
        setSwapMode('atomic');
      } else {
        setSwapMode('fusion_plus');
      }
    } else {
      setSwapMode('regular');
    }
  }, [fromChain, toChain, isCrossChain, isNonEVMInvolved]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    const tempChain = fromChain;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setFromChain(toChain);
    setToChain(tempChain);
  };

  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockQuote: SwapQuote = {
        fromAmount,
        toAmount: (parseFloat(fromAmount) * 1.95).toString(), // Mock exchange rate
        gasEstimate: '0.02',
        priceImpact: 0.15,
        route: [fromToken, toToken],
        estimatedGas: '21000'
      };
      
      setQuote(mockQuote);
      setToAmount(mockQuote.toAmount);
      
      toast({
        title: "Quote Updated",
        description: `Best rate found: 1 ${fromToken.symbol} ≈ ${(parseFloat(mockQuote.toAmount) / parseFloat(fromAmount)).toFixed(4)} ${toToken.symbol}`
      });
    } catch (error) {
      toast({
        title: "Quote Failed",
        description: "Unable to fetch quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!quote || !fromToken || !toToken) return;

    // Security validation
    if (securityStatus.walletLocked) {
      toast({
        title: "Wallet Locked",
        description: "Please unlock your wallet to continue.",
        variant: "destructive"
      });
      return;
    }

    const dailyUsed = parseFloat(securityStatus.dailyUsed);
    const dailyLimit = parseFloat(securityStatus.dailyLimit);
    const transactionAmount = parseFloat(fromAmount);

    if (dailyUsed + transactionAmount > dailyLimit) {
      toast({
        title: "Daily Limit Exceeded",
        description: `Transaction would exceed daily limit of $${dailyLimit}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (swapMode === 'atomic') {
        await executeAtomicSwap();
      } else if (swapMode === 'fusion_plus') {
        await executeFusionPlusSwap();
      } else {
        await executeRegularSwap();
      }
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "Transaction could not be completed.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeRegularSwap = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: "Swap Successful",
      description: `Swapped ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`,
    });
  };

  const executeFusionPlusSwap = async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast({
      title: "Cross-Chain Swap Successful",
      description: `Fusion+ swap completed across ${SUPPORTED_CHAINS[fromChain]?.name} → ${SUPPORTED_CHAINS[toChain]?.name}`,
    });
  };

  const executeAtomicSwap = async () => {
    await new Promise(resolve => setTimeout(resolve, 4000));
    toast({
      title: "Atomic Swap Initiated",
      description: `Hashlock created. Swap will complete when counterparty claims within ${timelockHours} hours.`,
    });
  };

  const toggleWalletLock = () => {
    setSecurityStatus(prev => ({
      ...prev,
      walletLocked: !prev.walletLocked
    }));
    
    toast({
      title: securityStatus.walletLocked ? "Wallet Unlocked" : "Wallet Locked",
      description: securityStatus.walletLocked ? "Transactions are now enabled" : "All transactions are now blocked",
    });
  };

  const getSwapModeInfo = () => {
    switch (swapMode) {
      case 'regular':
        return {
          title: 'Classic Swap',
          description: 'Standard token swap on the same chain',
          icon: <ArrowUpDown className="w-4 h-4" />,
          color: 'blue'
        };
      case 'fusion_plus':
        return {
          title: 'Fusion+ Cross-Chain',
          description: 'Cross-chain swap between EVM networks',
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'green'
        };
      case 'atomic':
        return {
          title: 'Atomic Cross-Chain',
          description: 'Trustless swap with hashlock/timelock for non-EVM chains',
          icon: <Clock className="w-4 h-4" />,
          color: 'purple'
        };
      default:
        return {
          title: 'Smart Swap',
          description: 'Intelligent routing',
          icon: <ArrowUpDown className="w-4 h-4" />,
          color: 'blue'
        };
    }
  };

  const modeInfo = getSwapModeInfo();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Security Status Bar */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {securityStatus.walletLocked ? (
                  <Lock className="w-5 h-5 text-red-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-green-400" />
                )}
                <span className="text-sm font-medium text-white">
                  Wallet {securityStatus.walletLocked ? 'Locked' : 'Unlocked'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  wsConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                )} />
                <span className="text-xs text-gray-400">
                  {wsConnected ? 'Live Data' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400">
                Daily: ${securityStatus.dailyUsed} / ${securityStatus.dailyLimit}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleWalletLock}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {securityStatus.walletLocked ? 'Unlock' : 'Lock'}
              </Button>
              
              <Dialog open={showSecuritySettings} onOpenChange={setShowSecuritySettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Security Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Daily Transaction Limit ($)</Label>
                      <Input 
                        value={securityStatus.dailyLimit}
                        onChange={(e) => setSecurityStatus(prev => ({ ...prev, dailyLimit: e.target.value }))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Require Auth for Large Transactions</Label>
                      <Switch checked={securityStatus.requiresAuth} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Swap Interface */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center space-x-2">
              {modeInfo.icon}
              <span>{modeInfo.title}</span>
            </CardTitle>
            <Badge 
              variant="outline" 
              className={cn(
                "border-gray-600",
                modeInfo.color === 'blue' && "text-blue-400 border-blue-500",
                modeInfo.color === 'green' && "text-green-400 border-green-500",
                modeInfo.color === 'purple' && "text-purple-400 border-purple-500"
              )}
            >
              {modeInfo.description}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="swap" className="text-gray-300 data-[state=active]:text-white">
                Swap
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swap" className="space-y-4">
              {/* From Token */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300">From</Label>
                  <div className="text-xs text-gray-400">
                    Balance: {fromToken?.balance || '0'} {fromToken?.symbol}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Select value={fromChain} onValueChange={(value: ChainId) => setFromChain(value)}>
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-gray-600">
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.0"
                      className="bg-gray-700 border-gray-600 text-white pr-20"
                    />
                    <Select value={fromToken?.symbol} onValueChange={(symbol) => {
                      const token = tokens.find(t => t.symbol === symbol);
                      setFromToken(token || null);
                    }}>
                      <SelectTrigger className="absolute right-1 top-1 w-18 h-8 bg-gray-600 border-none text-white">
                        <SelectValue placeholder="Token" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {tokens.filter(t => t.chainId === 1 || SUPPORTED_CHAINS[fromChain]?.type === 'non-evm').map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-gray-600">
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Swap Direction */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapTokens}
                  className="rounded-full bg-gray-700 hover:bg-gray-600 p-2"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-300" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300">To</Label>
                  <div className="text-xs text-gray-400">
                    Balance: {toToken?.balance || '0'} {toToken?.symbol}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Select value={toChain} onValueChange={(value: ChainId) => setToChain(value)}>
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-gray-600">
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      value={toAmount}
                      readOnly
                      placeholder="0.0"
                      className="bg-gray-700 border-gray-600 text-white pr-20"
                    />
                    <Select value={toToken?.symbol} onValueChange={(symbol) => {
                      const token = tokens.find(t => t.symbol === symbol);
                      setToToken(token || null);
                    }}>
                      <SelectTrigger className="absolute right-1 top-1 w-18 h-8 bg-gray-600 border-none text-white">
                        <SelectValue placeholder="Token" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {tokens.filter(t => t.chainId === 1 || SUPPORTED_CHAINS[toChain]?.type === 'non-evm').map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-gray-600">
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Atomic Swap Specific Settings */}
              {swapMode === 'atomic' && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-purple-400">Atomic Swap Settings</h4>
                        <p className="text-xs text-gray-400">
                          Cross-chain atomic swap with hashlock/timelock mechanism
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 text-xs">Timelock (hours)</Label>
                          <Input
                            value={timelockHours}
                            onChange={(e) => setTimelockHours(e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white h-8"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={enablePartialFills} 
                            onCheckedChange={setEnablePartialFills}
                          />
                          <Label className="text-gray-300 text-xs">Partial Fills</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Display */}
              {quote && (
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Rate</span>
                      <span className="text-white">
                        1 {fromToken?.symbol} ≈ {(parseFloat(quote.toAmount) / parseFloat(quote.fromAmount)).toFixed(6)} {toToken?.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price Impact</span>
                      <span className={cn(
                        quote.priceImpact > 1 ? "text-red-400" : "text-green-400"
                      )}>
                        {quote.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Est. Gas</span>
                      <span className="text-white">{quote.gasEstimate} ETH</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleGetQuote}
                  disabled={!fromToken || !toToken || !fromAmount || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Getting Quote...' : 'Get Quote'}
                </Button>
                
                {quote && (
                  <Button
                    onClick={handleExecuteSwap}
                    disabled={isLoading || securityStatus.walletLocked}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? 'Executing...' : `Execute ${modeInfo.title}`}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Slippage Tolerance (%)</Label>
                  <div className="flex space-x-2 mt-1">
                    {['0.1', '0.5', '1.0'].map((val) => (
                      <Button
                        key={val}
                        variant={slippage === val ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSlippage(val)}
                        className="flex-1"
                      >
                        {val}%
                      </Button>
                    ))}
                    <Input
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="w-20 bg-gray-700 border-gray-600 text-white"
                      placeholder="Custom"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Gas Price</Label>
                  <Select value={gasPrice} onValueChange={setGasPrice}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="slow" className="text-white hover:bg-gray-600">Slow (Cheap)</SelectItem>
                      <SelectItem value="standard" className="text-white hover:bg-gray-600">Standard</SelectItem>
                      <SelectItem value="fast" className="text-white hover:bg-gray-600">Fast</SelectItem>
                      <SelectItem value="instant" className="text-white hover:bg-gray-600">Instant (Expensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}