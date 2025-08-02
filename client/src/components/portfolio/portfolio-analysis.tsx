
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useWebSocketContext } from '@/shared/providers/WebSocketProvider';
interface PortfolioAnalysisProps {
  className?: string;
}

interface AssetAllocation {
  token: string;
  current: number;
  target: number;
  value: string;
  recommendation: 'hold' | 'buy' | 'sell';
}

interface PerformanceMetric {
  name: string;
  value: string;
  change: number;
  period: string;
  benchmark?: string;
}

interface RiskMetric {
  name: string;
  value: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export function PortfolioAnalysis({ className }: PortfolioAnalysisProps) {
  const [timeframe, setTimeframe] = useState('30d');
  const [analysisType, setAnalysisType] = useState('allocation');
  const { sendMessage, subscribe, isConnected } = useWebSocketContext();
  // Mock data - in real app this would come from API
  const [allocations] = useState<AssetAllocation[]>([
    { token: 'ETH', current: 45, target: 40, value: '$4,500', recommendation: 'sell' },
    { token: 'BTC', current: 25, target: 30, value: '$2,500', recommendation: 'buy' },
    { token: 'USDC', current: 20, target: 20, value: '$2,000', recommendation: 'hold' },
    { token: 'LINK', current: 10, target: 10, value: '$1,000', recommendation: 'hold' }
  ]);

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'Total Return', value: '+12.5%', change: 2.3, period: '30d', benchmark: '+8.2%' },
    { name: 'Annualized Return', value: '+24.8%', change: 5.1, period: 'YTD', benchmark: '+15.6%' },
    { name: 'Sharpe Ratio', value: '1.85', change: 0.15, period: '30d', benchmark: '1.42' },
    { name: 'Max Drawdown', value: '-8.3%', change: -1.2, period: '30d', benchmark: '-12.1%' }
  ]);

  const [riskMetrics] = useState<RiskMetric[]>([
    { name: 'Portfolio Volatility', value: 18.5, level: 'medium', description: 'Moderate price swings expected' },
    { name: 'Concentration Risk', value: 45, level: 'high', description: 'Heavy allocation in single asset' },
    { name: 'Correlation Risk', value: 25, level: 'low', description: 'Well diversified assets' },
    { name: 'Liquidity Risk', value: 12, level: 'low', description: 'High liquidity across positions' }
  ]);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'sell': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'hold': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>Portfolio Analysis</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={analysisType} onValueChange={setAnalysisType} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="allocation" className="space-y-4">
            <div className="space-y-4">
              {allocations.map((allocation) => (
                <div key={allocation.token} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-white">{allocation.token}</div>
                      <Badge className={cn("text-xs", getRecommendationColor(allocation.recommendation))}>
                        {allocation.recommendation.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{allocation.value}</div>
                      <div className="text-xs text-gray-400">
                        {allocation.current}% of portfolio
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current vs Target</span>
                      <span className="text-gray-300">
                        {allocation.current}% / {allocation.target}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={allocation.current} className="h-2 bg-gray-700" />
                      <div 
                        className="absolute top-0 h-2 w-0.5 bg-blue-400"
                        style={{ left: `${allocation.target}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      Target allocation: {allocation.target}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.name} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-400">{metric.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {metric.period}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-white">{metric.value}</div>
                    <div className="flex items-center space-x-1">
                      {metric.change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        metric.change > 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                  
                  {metric.benchmark && (
                    <div className="text-xs text-gray-400 mt-2">
                      Benchmark: {metric.benchmark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="space-y-4">
              {riskMetrics.map((risk) => (
                <div key={risk.name} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">{risk.name}</h4>
                    <Badge className={cn("text-xs", getRiskLevelColor(risk.level))}>
                      {risk.level.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl font-bold text-white">{risk.value}%</div>
                    <Progress value={risk.value} className="w-24 h-2" />
                  </div>
                  
                  <p className="text-xs text-gray-400">{risk.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">Rebalancing Recommendation</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Consider reducing ETH allocation by 5% and increasing BTC allocation to match target weights.
                      This could improve risk-adjusted returns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400">Concentration Risk Alert</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Your portfolio is heavily concentrated in ETH (45%). Consider diversifying into other assets
                      to reduce volatility.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-400">Performance Insight</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Your portfolio is outperforming the market benchmark by 4.3% over the last 30 days.
                      Sharpe ratio indicates good risk-adjusted returns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
