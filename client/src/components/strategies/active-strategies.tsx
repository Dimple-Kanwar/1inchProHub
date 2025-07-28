import { useState, useEffect } from 'react';
import { Play, Pause, OctagonMinus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserStrategies } from '@/hooks/use-oneinch';
import { useWebSocket } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';

interface ActiveStrategiesProps {
  className?: string;
}

// Mock strategies for demonstration
const mockStrategies = [
  {
    id: '1',
    name: 'ETH DCA Strategy',
    type: 'dca',
    status: 'active' as const,
    frequency: 'Weekly',
    amount: '$500',
    return: '+8.5%',
    period: '7d',
    progress: 65,
    icon: 'chart-line',
    color: 'blue'
  },
  {
    id: '2',
    name: 'BTC OctagonMinus Loss',
    type: 'stop_loss',
    status: 'active' as const,
    triggerPrice: '$40,000',
    currentPrice: '$43,256',
    return: 'Monitoring',
    period: 'Price',
    progress: 85,
    icon: 'shield-alt',
    color: 'green'
  },
  {
    id: '3',
    name: 'USDC Grid Trading',
    type: 'grid_trading',
    status: 'paused' as const,
    range: '$0.99-$1.01',
    trades: '12 trades',
    return: '+2.1%',
    period: '24h',
    progress: 45,
    icon: 'exchange-alt',
    color: 'purple'
  }
];

export function ActiveStrategies({ className }: ActiveStrategiesProps) {
  const [strategies, setStrategies] = useState(mockStrategies);
  const userId = 'demo-user'; // This would come from auth context

  // WebSocket for real-time strategy updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'strategy_update') {
        console.log('Strategy update received:', message.data);
        // Update strategy state in real implementation
      }
    }
  });

  const toggleStrategy = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, status: strategy.status === 'active' ? 'paused' : 'active' }
        : strategy
    ));

    const strategy = strategies.find(s => s.id === strategyId);
    (window as any).showNotification?.({
      type: 'info',
      title: 'Strategy Updated',
      message: `${strategy?.name} has been ${strategy?.status === 'active' ? 'paused' : 'resumed'}`
    });
  };

  const stopStrategy = (strategyId: string) => {
    setStrategies(prev => prev.filter(s => s.id !== strategyId));
    
    const strategy = strategies.find(s => s.id === strategyId);
    (window as any).showNotification?.({
      type: 'warning',
      title: 'Strategy Stopped',
      message: `${strategy?.name} has been stopped and removed`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'paused':
        return 'text-yellow-400';
      case 'completed':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getProgressColor = (type: string) => {
    switch (type) {
      case 'dca':
        return 'bg-blue-500';
      case 'stop_loss':
        return 'bg-green-500';
      case 'grid_trading':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">Active Strategies</CardTitle>
          <div className="flex items-center space-x-2">
            {isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
            <span className="text-sm text-gray-400">{strategies.length} Running</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {strategies.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Active Strategies</h3>
            <p className="text-gray-400 text-sm">Create your first strategy to start automated trading</p>
          </div>
        ) : (
          strategies.map((strategy) => (
            <div key={strategy.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    `bg-${strategy.color}-500/20`
                  )}>
                    <i className={cn(
                      `fas fa-${strategy.icon} text-sm`,
                      `text-${strategy.color}-400`
                    )}></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-white">{strategy.name}</h4>
                    <p className="text-xs text-gray-400">
                      {strategy.frequency || strategy.triggerPrice || strategy.range}
                      {strategy.amount && ` • ${strategy.amount}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className={cn(
                      "text-sm font-medium",
                      strategy.return.includes('+') ? 'text-green-400' : 
                      strategy.return.includes('-') ? 'text-red-400' : 'text-gray-300'
                    )}>
                      {strategy.return}
                    </div>
                    <div className="text-xs text-gray-400">{strategy.period}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStrategy(strategy.id)}
                      className="w-6 h-6"
                    >
                      {strategy.status === 'active' ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => stopStrategy(strategy.id)}
                      className="w-6 h-6 text-red-400 hover:text-red-300"
                    >
                      <OctagonMinus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress 
                    value={strategy.progress} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-gray-400">{strategy.progress}%</span>
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={getStatusColor(strategy.status)}>
                  {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                </span>
                <span className="text-gray-400">
                  {strategy.trades || 'Next execution in 2h'}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
