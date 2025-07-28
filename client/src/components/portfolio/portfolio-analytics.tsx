import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserPortfolio, useSpotPrices } from '@/hooks/use-oneinch';
import { useWebSocket } from '@/hooks/use-websocket';
import { TOKEN_ADDRESSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PortfolioAnalyticsProps {
  className?: string;
}

interface AssetData {
  symbol: string;
  name: string;
  value: string;
  change: number;
  allocation: number;
  color: string;
}

export function PortfolioAnalytics({ className }: PortfolioAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('24H');
  const [chartData, setChartData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userId = 'demo-user';

  const { data: portfolio, isLoading: portfolioLoading } = useUserPortfolio(userId);
  const { data: prices } = useSpotPrices([
    TOKEN_ADDRESSES.ETH,
    TOKEN_ADDRESSES.WBTC,
    TOKEN_ADDRESSES.USDC
  ]);

  // WebSocket for real-time portfolio updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'portfolio_update') {
        console.log('Portfolio update received:', message.data);
        // In a real implementation, this would update the portfolio data
      }
    }
  });

  // Mock portfolio data for demonstration (would be replaced with real data from portfolio API)
  const mockAssets: AssetData[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      value: '$45,250',
      change: 12.5,
      allocation: 42,
      color: 'from-blue-500 to-purple-500'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      value: '$62,100',
      change: -2.1,
      allocation: 35,
      color: 'from-orange-500 to-red-500'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      value: '$20,082',
      change: 0.1,
      allocation: 23,
      color: 'from-blue-400 to-blue-600'
    }
  ];

  // Generate mock chart data
  useEffect(() => {
    const generateChartData = () => {
      const points = 30;
      const data = [];
      let value = 100000;
      
      for (let i = 0; i < points; i++) {
        value += (Math.random() - 0.5) * 5000;
        data.push(Math.max(value, 80000));
      }
      
      setChartData(data);
    };

    generateChartData();
  }, [timeframe]);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate min/max for scaling
    const minValue = Math.min(...chartData);
    const maxValue = Math.max(...chartData);
    const range = maxValue - minValue;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;

    chartData.forEach((value, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [chartData]);

  const totalValue = mockAssets.reduce((sum, asset) => {
    return sum + parseFloat(asset.value.replace('$', '').replace(',', ''));
  }, 0);

  const totalChange = 8.7; // Would be calculated from real data
  const isPositive = totalChange >= 0;

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">Portfolio Analytics</CardTitle>
          <div className="flex items-center space-x-2">
            {['24H', '7D', '30D', '1Y'].map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(period)}
                className="text-xs"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${totalValue.toLocaleString()}
            </div>
            <div className={cn(
              "text-sm flex items-center space-x-1",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{totalChange}%</span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">24h Change</span>
            </div>
            <div className="text-2xl font-bold text-green-400">+$2,456</div>
            <div className="text-sm text-gray-400">+2.1%</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Best Performer</span>
            </div>
            <div className="text-lg font-bold text-white">ETH</div>
            <div className="text-sm text-green-400">+12.5%</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Portfolio Chart */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full h-64 bg-gray-900 rounded-lg border border-gray-700"
          />
          {isConnected && (
            <div className="absolute top-2 right-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          )}
        </div>

        {/* Asset Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
          <div className="grid grid-cols-3 gap-4">
            {mockAssets.map((asset) => (
              <div key={asset.symbol} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full bg-gradient-to-r",
                    asset.color
                  )}></div>
                  <div>
                    <div className="font-medium text-sm text-white">{asset.symbol}</div>
                    <div className="text-xs text-gray-400">{asset.name}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-white">{asset.value}</div>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium",
                      asset.change >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {asset.change >= 0 ? '+' : ''}{asset.change}%
                    </span>
                    <span className="text-sm text-gray-400">{asset.allocation}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={cn("h-2 rounded-full bg-gradient-to-r", asset.color)}
                      style={{ width: `${asset.allocation}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
            <div className="text-sm text-gray-400 mb-1">Total Trades</div>
            <div className="text-xl font-bold text-white">247</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
            <div className="text-sm text-gray-400 mb-1">Win Rate</div>
            <div className="text-xl font-bold text-green-400">68%</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
            <div className="text-sm text-gray-400 mb-1">Avg. Return</div>
            <div className="text-xl font-bold text-blue-400">4.2%</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center">
            <div className="text-sm text-gray-400 mb-1">Max Drawdown</div>
            <div className="text-xl font-bold text-red-400">-12%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
