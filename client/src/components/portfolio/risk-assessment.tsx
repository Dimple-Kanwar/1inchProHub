import { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, AlertTriangle, TrendingUp, Lightbulb, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWebSocketContext } from '@/shared/providers/WebSocketProvider';
interface RiskAssessmentProps { className?: string; }
interface RiskMetric {
  label: string;
  value: number;
  max: number;
  status: 'low' | 'medium' | 'high';
  color: string;
}
interface AIInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'opportunity';
  title: string;
  message: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export function RiskAssessment({ className }: RiskAssessmentProps) {
  const [riskScore, setRiskScore] = useState(65);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  // ✅ Get WebSocket connection and methods from context
  const { isConnected, subscribe, unsubscribe } = useWebSocketContext()

  // ✅ Define handler before using it
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'risk_update') {
        setRiskScore(message.data.riskScore);
      }
    };

    // You need a way to listen to messages
    // Best: enhance WebSocketProvider to support listeners
  }, []);
  
  // ✅ Subscribe to risk updates
  useEffect(() => {
    if (isConnected) {
      subscribe({ type: 'risk' });
    }

    return () => {
      unsubscribe({ type: 'risk' });
    };
  }, [isConnected, subscribe, unsubscribe]);
  // ✅ Mock risk metrics
  const riskMetrics: RiskMetric[] = useMemo(() => [
    { label: 'Portfolio Volatility', value: 35, max: 100, status: 'medium', color: 'yellow', },
    { label: 'Concentration Risk', value: 25, max: 100, status: 'low', color: 'green', },
    { label: 'Correlation Risk', value: 45, max: 100, status: 'medium', color: 'yellow', },
    { label: 'Liquidity Risk', value: 20, max: 100, status: 'low', color: 'green', },
  ], []);
  // ✅ Initialize AI insights
  useEffect(() => {
    const mockInsights: AIInsight[] = [
      {
        id: '1', type: 'suggestion',
        title: 'Rebalancing Opportunity',
        message: 'Consider rebalancing your ETH position as it\'s showing strong momentum and exceeding target allocation.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        icon: 'lightbulb',
        color: 'blue',
      },
      {
        id: '2',
        type: 'warning',
        title: 'High Correlation Alert',
        message: 'Your portfolio shows increased correlation risk. Consider diversifying into uncorrelated assets.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        icon: 'alert-triangle',
        color: 'yellow',
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Gas Optimization',
        message: 'Current gas prices are low. This is a good time to execute pending transactions or rebalance.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        icon: 'trending-up',
        color: 'green',
      },
    ];
    setInsights(mockInsights);
  }, []);

  // ✅ Get risk level and color
  const getRiskLevel = useCallback((score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-400', bgColor: 'bg-green-400' };
    if (score < 70) return { level: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-400' };
    return { level: 'High', color: 'text-red-400', bgColor: 'bg-red-400' };
  }, []);
  const getMetricColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  const getInsightIcon = (icon: string) => {
    switch (icon) {
      case 'lightbulb': return <Lightbulb className="w-4 h-4" />;
      case 'alert-triangle': return <AlertTriangle className="w-4 h-4" />;
      case 'trending-up': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };
  const getInsightColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'yellow': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'green': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };
  const riskLevel = useMemo(() => getRiskLevel(riskScore), [getRiskLevel, riskScore]);

  // ✅ Attach message handler once on mount 
  useEffect(() => {
    const handleRiskUpdate = (message: any) => {
      if (message.type === 'risk_update') {
        setRiskScore(message.data.riskScore);
      }
    };

    subscribe({ type: 'risk' });

    return () => {
      // removeMessageListener is not available, so only unsubscribe
      unsubscribe({ type: 'risk' });
    };
  }, [ subscribe, unsubscribe]);

  return (<div className={cn('space-y-6', className)}> {/* Market Insights Panel */}
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Market Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
            <div>
              <div className="font-medium text-sm text-white">ETH/USDC</div>
              <div className="text-xs text-gray-400">$2,456.78</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-400">+2.5%</div>
            <div className="text-xs text-gray-400">24h</div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <div>
              <div className="font-medium text-sm text-white">BTC/USDT</div>
              <div className="text-xs text-gray-400">$43,256.12</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-red-400">-1.2%</div>
            <div className="text-xs text-gray-400">24h</div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <div>
              <div className="font-medium text-sm text-white">BTC/USDT</div>
              <div className="text-xs text-gray-400">$43,256.12</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-red-400">-1.2%</div>
            <div className="text-xs text-gray-400">24h</div>
          </div>
        </div>
      </CardContent>
    </Card> {/* Gas Tracker */}
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Gas Tracker</CardTitle>
        {isConnected && (<div className="flex items-center space-x-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse">
          </div>
          <span>Real-time</span>
        </div>)}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Standard</span>
          <span className="text-sm text-white">25 gwei</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Fast</span>
          <span className="text-sm text-yellow-400">35 gwei</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Instant</span>
          <span className="text-sm text-red-400">45 gwei</span>
        </div>
      </CardContent>
    </Card>
    {/* Risk Assessment */}
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center space-x-2">
          <Shield className="w-5 h-5" /> <span>Risk Assessment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Overall Risk Score</div>
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-700" stroke="currentColor" strokeWidth="3" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={riskLevel.color} stroke="currentColor" strokeWidth="3" strokeDasharray={`${riskScore}, 100`} strokeLinecap="round" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{riskScore}</span>
            </div>
          </div>
          <div className={cn('text-sm font-medium', riskLevel.color)}>
            {riskLevel.level} Risk
          </div>
        </div>
        <div className="space-y-3">
          {riskMetrics.map((metric, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">{metric.label}</span>
                <span className="text-sm text-white">{metric.value}%</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-sm text-gray-400">Diversification</span>
          <span className="text-sm text-white">8/10</span>
        </div>
      </CardContent>
    </Card>
    {/* AI Insights */}
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center space-x-2">
          <Lightbulb className="w-5 h-5" /> <span>AI Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className={cn('p-3 rounded-lg border', getInsightColor(insight.color))}>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getInsightIcon(insight.icon)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-300">{insight.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">
                  {formatTimeAgo(insight.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>);
}