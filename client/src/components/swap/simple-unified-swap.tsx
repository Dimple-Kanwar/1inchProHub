import { useState } from 'react';
import { ArrowUpDown, Shield, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SimpleUnifiedSwapProps {
  className?: string;
}

export function SimpleUnifiedSwap({ className }: SimpleUnifiedSwapProps) {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(false);

  const chains = [
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'sui', name: 'Sui' },
    { id: 'near', name: 'NEAR' }
  ];

  const tokens = ['ETH', 'USDC', 'WBTC', 'SUI', 'NEAR'];

  const getSwapMode = () => {
    if (fromChain !== toChain) {
      if (fromChain === 'sui' || toChain === 'sui' || fromChain === 'near' || toChain === 'near') {
        return { mode: 'Atomic Cross-Chain', color: 'purple' };
      }
      return { mode: 'Fusion+ Cross-Chain', color: 'green' };
    }
    return { mode: 'Classic Swap', color: 'blue' };
  };

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
    if (!fromAmount) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToAmount((parseFloat(fromAmount) * 1.95).toString());
    } finally {
      setIsLoading(false);
    }
  };

  const swapInfo = getSwapMode();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Security Status Bar */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-white">
                  Wallet Unlocked
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">Live Data</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400">
                Daily: $2,500 / $10,000
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Swap Interface */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center space-x-2">
              <ArrowUpDown className="w-5 h-5" />
              <span>{swapInfo.mode}</span>
            </CardTitle>
            <Badge 
              variant="outline" 
              className={cn(
                "border-gray-600",
                swapInfo.color === 'blue' && "text-blue-400 border-blue-500",
                swapInfo.color === 'green' && "text-green-400 border-green-500",
                swapInfo.color === 'purple' && "text-purple-400 border-purple-500"
              )}
            >
              {swapInfo.mode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-gray-300">From</Label>
              <div className="text-xs text-gray-400">
                Balance: 2.5 {fromToken}
              </div>
            </div>

            <div className="flex space-x-2">
              <Select value={fromChain} onValueChange={setFromChain}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id} className="text-white hover:bg-gray-600">
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
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="absolute right-1 top-1 w-18 h-8 bg-gray-600 border-none text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {tokens.map((token) => (
                      <SelectItem key={token} value={token} className="text-white hover:bg-gray-600">
                        {token}
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
                Balance: 5000 {toToken}
              </div>
            </div>

            <div className="flex space-x-2">
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id} className="text-white hover:bg-gray-600">
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
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="absolute right-1 top-1 w-18 h-8 bg-gray-600 border-none text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {tokens.map((token) => (
                      <SelectItem key={token} value={token} className="text-white hover:bg-gray-600">
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quote Display */}
          {toAmount && (
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rate</span>
                  <span className="text-white">
                    1 {fromToken} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount || '1')).toFixed(6)} {toToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact</span>
                  <span className="text-green-400">0.15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Est. Gas</span>
                  <span className="text-white">0.02 ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleGetQuote}
              disabled={!fromAmount || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Getting Quote...' : 'Get Quote'}
            </Button>

            {toAmount && (
              <Button
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Execute {swapInfo.mode}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}