import { useState } from 'react';
import { Plus, Trash2, Copy, Play, Pause, Settings, Zap, TrendingUp, Clock, DollarSign, BarChart3, Shield, Target, Repeat, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StrategyBuilderProps {
  className?: string;
}

interface StrategyCondition {
  id: string;
  type: 'price' | 'time' | 'volume' | 'rsi' | 'macd' | 'bollinger' | 'custom';
  operator: 'above' | 'below' | 'equals' | 'between' | 'crosses_above' | 'crosses_below';
  value: string;
  value2?: string;
  timeframe?: string;
}

interface StrategyAction {
  id: string;
  type: 'buy' | 'sell' | 'rebalance' | 'limit_order' | 'stop_loss' | 'take_profit' | 'trailing_stop' | 'grid_order' | 'iceberg_order';
  amount: string;
  token: string;
  conditions: StrategyCondition[];
  advanced?: {
    partialFill?: boolean;
    icebergSize?: string;
    gridLevels?: number;
    gridSpacing?: string;
    trailingDistance?: string;
  };
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'recurring_swap' | 'limit_order' | 'portfolio_rebalancer' | 'dca' | 'grid_trading' | 'iceberg_order' | 'momentum_trading' | 'mean_reversion' | 'arbitrage' | 'custom';
  isActive: boolean;
  actions: StrategyAction[];
  settings: {
    frequency?: string;
    maxGasPrice?: number;
    slippage?: number;
    stopLoss?: number;
    takeProfit?: number;
    riskManagement?: {
      maxDrawdown?: number;
      positionSize?: number;
      leverageLimit?: number;
    };
  };
}

const STRATEGY_TEMPLATES = {
  recurring_swap: {
    name: 'Recurring Swap (DCA)',
    description: 'Dollar-cost averaging with automated recurring purchases',
    icon: <Clock className="w-4 h-4" />,
    defaultSettings: { frequency: 'daily', slippage: 0.5 }
  },
  limit_order: {
    name: 'Advanced Limit Order',
    description: 'Execute trades at specific price levels with conditions',
    icon: <Target className="w-4 h-4" />,
    defaultSettings: { slippage: 0.3 }
  },
  portfolio_rebalancer: {
    name: 'Portfolio Rebalancer',
    description: 'Maintain target allocation ratios automatically',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultSettings: { frequency: 'weekly', slippage: 1.0 }
  },
  grid_trading: {
    name: 'Grid Trading',
    description: 'Place multiple buy/sell orders in a price range',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultSettings: { slippage: 0.5 }
  },
  iceberg_order: {
    name: 'Iceberg Order',
    description: 'Split large orders into smaller chunks to minimize market impact',
    icon: <TrendingDown className="w-4 h-4" />,
    defaultSettings: { slippage: 0.3 }
  },
  momentum_trading: {
    name: 'Momentum Trading',
    description: 'Follow trends using technical indicators',
    icon: <TrendingUp className="w-4 h-4" />,
    defaultSettings: { slippage: 0.7 }
  },
  mean_reversion: {
    name: 'Mean Reversion',
    description: 'Buy dips and sell peaks based on historical averages',
    icon: <Repeat className="w-4 h-4" />,
    defaultSettings: { slippage: 0.5 }
  },
  arbitrage: {
    name: 'Cross-Chain Arbitrage',
    description: 'Exploit price differences across different chains',
    icon: <Zap className="w-4 h-4" />,
    defaultSettings: { slippage: 1.5 }
  },
  custom: {
    name: 'Custom Strategy',
    description: 'Build your own advanced trading logic',
    icon: <Settings className="w-4 h-4" />,
    defaultSettings: { slippage: 1.0 }
  }
};

export function StrategyBuilder({ className }: StrategyBuilderProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<keyof typeof STRATEGY_TEMPLATES>('limit_order');
  const [strategy, setStrategy] = useState<Partial<Strategy>>({
    name: '',
    description: '',
    type: 'limit_order',
    actions: [],
    settings: STRATEGY_TEMPLATES.limit_order.defaultSettings,
    riskManagement: {
      stopLoss: 5,
      takeProfit: 10,
      maxPositionSize: 50
    }
  });
  const [conditions, setConditions] = useState<StrategyCondition[]>([]);
  const [draggedStrategy, setDraggedStrategy] = useState<string | null>(null);

  const addCondition = () => {
    const newCondition: StrategyCondition = {
      id: Date.now().toString(),
      type: 'price',
      operator: 'above',
      value: '',
      timeframe: '1h'
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, field: keyof StrategyCondition, value: string) => {
    setConditions(conditions.map(condition => 
      condition.id === id ? { ...condition, [field]: value } : condition
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(condition => condition.id !== id));
  };

  const createStrategy = async () => {
    if (!strategy.name?.trim()) {
      toast({
        title: "Strategy Name Required",
        description: "Please enter a name for your strategy.",
        variant: "destructive"
      });
      return;
    }

    if (strategy.name.length < 3) {
      toast({
        title: "Strategy Name Too Short",
        description: "Strategy name must be at least 3 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Show loading state
    toast({
      title: "Creating Strategy",
      description: "Please wait while we create your strategy...",
    });

    try {
      const newStrategy: Strategy = {
        id: Date.now().toString(),
        name: strategy.name.trim(),
        description: strategy.description?.trim() || '',
        type: selectedType,
        isActive: false,
        actions: strategy.actions || [],
        settings: {
          ...strategy.settings,
          riskManagement: {
            maxDrawdown: strategy.settings?.riskManagement?.maxDrawdown || 10,
            positionSize: strategy.settings?.riskManagement?.positionSize || 25,
            leverageLimit: 1
          }
        }
      };

      // Submit to backend
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy)
      });

      if (response.ok) {
        toast({
          title: "✅ Strategy Created Successfully",
          description: `${newStrategy.name} is ready to use.`,
        });

        // Reset form
        setStrategy({
          name: '',
          description: '',
          type: selectedType,
          actions: [],
          settings: STRATEGY_TEMPLATES[selectedType].defaultSettings,
          riskManagement: {
            stopLoss: 5,
            takeProfit: 10,
            maxPositionSize: 50
          }
        });
        setConditions([]);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Creation Failed",
          description: errorData.message || "Failed to create strategy. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Strategy creation error:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const handleStrategyTypeChange = (type: keyof typeof STRATEGY_TEMPLATES) => {
    setSelectedType(type);
    setStrategy(prev => ({
      ...prev,
      type,
      settings: STRATEGY_TEMPLATES[type].defaultSettings
    }));
  };

  const handleDragStart = (strategyType: string) => {
    setDraggedStrategy(strategyType);
  };

  const handleDragEnd = () => {
    setDraggedStrategy(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedStrategy) {
      handleStrategyTypeChange(draggedStrategy as keyof typeof STRATEGY_TEMPLATES);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Zap className="w-5 h-5 text-blue-400" />
          <span>Advanced Strategy Builder</span>
          <Badge variant="outline" className="text-green-400 border-green-500">1inch Limit Orders</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="templates" className="text-gray-300 data-[state=active]:text-white">
              Strategy Templates
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-gray-300 data-[state=active]:text-white">
              Advanced Builder
            </TabsTrigger>
            <TabsTrigger value="backtest" className="text-gray-300 data-[state=active]:text-white">
              Backtest & Deploy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                <Card
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(key)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "cursor-pointer transition-all border hover:border-blue-500",
                    selectedType === key 
                      ? "bg-blue-900/30 border-blue-500" 
                      : "bg-gray-700 border-gray-600"
                  )}
                  onClick={() => handleStrategyTypeChange(key as keyof typeof STRATEGY_TEMPLATES)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-400 mt-1">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                        {selectedType === key && (
                          <Badge variant="outline" className="text-blue-400 border-blue-500 mt-2">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <p className="text-gray-400 mb-2">
                Drag and drop strategy templates here to combine them
              </p>
              <p className="text-xs text-gray-500">
                Or build custom logic using conditions below
              </p>
            </div>

            {/* Advanced Conditions Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Trading Conditions</Label>
                <Button onClick={addCondition} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Condition
                </Button>
              </div>

              {conditions.map((condition) => (
                <div key={condition.id} className="flex items-center space-x-2 p-3 bg-gray-700 rounded">
                  <Select 
                    value={condition.type} 
                    onValueChange={(value) => updateCondition(condition.id, 'type', value)}
                  >
                    <SelectTrigger className="w-32 bg-gray-600 border-gray-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-600 border-gray-500">
                      <SelectItem value="price" className="text-white">Price</SelectItem>
                      <SelectItem value="volume" className="text-white">Volume</SelectItem>
                      <SelectItem value="rsi" className="text-white">RSI</SelectItem>
                      <SelectItem value="macd" className="text-white">MACD</SelectItem>
                      <SelectItem value="bollinger" className="text-white">Bollinger</SelectItem>
                      <SelectItem value="time" className="text-white">Time</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={condition.operator} 
                    onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                  >
                    <SelectTrigger className="w-32 bg-gray-600 border-gray-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-600 border-gray-500">
                      <SelectItem value="above" className="text-white">Above</SelectItem>
                      <SelectItem value="below" className="text-white">Below</SelectItem>
                      <SelectItem value="crosses_above" className="text-white">Crosses Above</SelectItem>
                      <SelectItem value="crosses_below" className="text-white">Crosses Below</SelectItem>
                      <SelectItem value="between" className="text-white">Between</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-gray-600 border-gray-500 text-white"
                  />

                  {condition.type !== 'time' && (
                    <Select 
                      value={condition.timeframe || '1h'} 
                      onValueChange={(value) => updateCondition(condition.id, 'timeframe', value)}
                    >
                      <SelectTrigger className="w-20 bg-gray-600 border-gray-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-600 border-gray-500">
                        <SelectItem value="1m" className="text-white">1m</SelectItem>
                        <SelectItem value="5m" className="text-white">5m</SelectItem>
                        <SelectItem value="15m" className="text-white">15m</SelectItem>
                        <SelectItem value="1h" className="text-white">1h</SelectItem>
                        <SelectItem value="4h" className="text-white">4h</SelectItem>
                        <SelectItem value="1d" className="text-white">1d</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    onClick={() => removeCondition(condition.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="backtest" className="space-y-4">
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <h4 className="text-white font-medium mb-3">Strategy Backtesting</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Backtest Period</Label>
                  <Select defaultValue="30d">
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="7d" className="text-white">7 days</SelectItem>
                      <SelectItem value="30d" className="text-white">30 days</SelectItem>
                      <SelectItem value="90d" className="text-white">90 days</SelectItem>
                      <SelectItem value="1y" className="text-white">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Initial Capital</Label>
                  <Input placeholder="10000 USDC" className="bg-gray-700 border-gray-600 text-white" />
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Run Backtest
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Strategy Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Strategy Name</Label>
            <Input
              value={strategy.name}
              onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., ETH DCA Weekly Strategy"
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              maxLength={50}
            />
            {strategy.name && strategy.name.length < 3 && (
              <p className="text-xs text-yellow-400">Strategy name should be at least 3 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Description</Label>
            <div className="space-y-1">
              <Textarea
                value={strategy.description}
                onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your strategy goals and approach (optional)"
                className="bg-gray-700 border-gray-600 text-white resize-none placeholder:text-gray-500"
                rows={3}
                maxLength={200}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Optional but recommended</span>
                <span>{strategy.description?.length || 0}/200</span>
              </div>
            </div>
          </div>

          {/* Strategy-specific advanced settings */}
          {selectedType === 'iceberg_order' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Total Order Size</Label>
                <Input placeholder="10 ETH" className="bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Iceberg Size</Label>
                <Input placeholder="0.5 ETH" className="bg-gray-700 border-gray-600 text-white" />
              </div>
            </div>
          )}

          {selectedType === 'grid_trading' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-300">Grid Levels</Label>
                    <span className="text-sm text-blue-400 font-medium">10</span>
                  </div>
                  <Slider defaultValue={[10]} min={3} max={50} step={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Price Range Low</Label>
                  <Input placeholder="1800 USDC" className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Price Range High</Label>
                  <Input placeholder="2200 USDC" className="bg-gray-700 border-gray-600 text-white" />
                </div>
              </div>
            </div>
          )}

          {selectedType === 'arbitrage' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Source Chain</Label>
                  <Select defaultValue="ethereum">
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="ethereum" className="text-white">Ethereum</SelectItem>
                      <SelectItem value="polygon" className="text-white">Polygon</SelectItem>
                      <SelectItem value="arbitrum" className="text-white">Arbitrum</SelectItem>
                      <SelectItem value="sui" className="text-white">Sui</SelectItem>
                      <SelectItem value="near" className="text-white">Near</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Target Chain</Label>
                  <Select defaultValue="polygon">
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="polygon" className="text-white">Polygon</SelectItem>
                      <SelectItem value="arbitrum" className="text-white">Arbitrum</SelectItem>
                      <SelectItem value="bsc" className="text-white">BSC</SelectItem>
                      <SelectItem value="tron" className="text-white">Tron</SelectItem>
                      <SelectItem value="cardano" className="text-white">Cardano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300">Minimum Profit Threshold (%)</Label>
                  <span className="text-sm text-blue-400 font-medium">0.5%</span>
                </div>
                <Slider defaultValue={[0.5]} min={0.1} max={5} step={0.1} />
              </div>
            </div>
          )}

          {/* Risk Management */}
          <div className="p-4 bg-gray-700/20 rounded-lg space-y-4">
            <h4 className="text-white font-medium">Risk Management</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300">Max Drawdown (%)</Label>
                  <span className="text-sm text-blue-400 font-medium">
                    {strategy.settings?.riskManagement?.maxDrawdown || 10}%
                  </span>
                </div>
                <Slider 
                  value={[strategy.settings?.riskManagement?.maxDrawdown || 10]}
                  min={1} 
                  max={50} 
                  step={1}
                  onValueChange={(value) => setStrategy(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      riskManagement: {
                        ...prev.settings?.riskManagement,
                        maxDrawdown: value[0]
                      }
                    }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300">Position Size (%)</Label>
                  <span className="text-sm text-blue-400 font-medium">
                    {strategy.settings?.riskManagement?.positionSize || 25}%
                  </span>
                </div>
                <Slider 
                  value={[strategy.settings?.riskManagement?.positionSize || 25]}
                  min={1} 
                  max={100} 
                  step={1}
                  onValueChange={(value) => setStrategy(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      riskManagement: {
                        ...prev.settings?.riskManagement,
                        positionSize: value[0]
                      }
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300">
                  Stop Loss
                </label>
                <span className="text-sm text-blue-400 font-medium">
                  {strategy.riskManagement.stopLoss}%
                </span>
              </div>
              <Slider
                value={[strategy.riskManagement.stopLoss]}
                onValueChange={(value) =>
                  setStrategy(prev => ({
                    ...prev,
                    riskManagement: {
                      ...prev.riskManagement,
                      stopLoss: value[0]
                    }
                  }))
                }
                max={20}
                step={0.5}
                className="mt-2"
                disabled={!navigator.onLine}
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300">
                  Take Profit
                </label>
                <span className="text-sm text-green-400 font-medium">
                  {strategy.riskManagement.takeProfit}%
                </span>
              </div>
              <Slider
                value={[strategy.riskManagement.takeProfit]}
                onValueChange={(value) =>
                  setStrategy(prev => ({
                    ...prev,
                    riskManagement: {
                      ...prev.riskManagement,
                      takeProfit: value[0]
                    }
                  }))
                }
                max={50}
                step={1}
                className="mt-2"
                disabled={!navigator.onLine}
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300">
                  Max Position Size
                </label>
                <span className="text-sm text-yellow-400 font-medium">
                  {strategy.riskManagement.maxPositionSize}%
                </span>
              </div>
              <Slider
                value={[strategy.riskManagement.maxPositionSize]}
                onValueChange={(value) =>
                  setStrategy(prev => ({
                    ...prev,
                    riskManagement: {
                      ...prev.riskManagement,
                      maxPositionSize: value[0]
                    }
                  }))
                }
                max={100}
                step={5}
                className="mt-2"
                disabled={!navigator.onLine}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Slippage Tolerance (%)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[strategy.settings?.slippage || 0.5]}
                onValueChange={(value) => setStrategy(prev => ({
                  ...prev,
                  settings: { ...prev.settings, slippage: value[0] }
                }))}
                max={5}
                min={0.1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-gray-400 w-12">
                {strategy.settings?.slippage || 0.5}%
              </span>
            </div>
          </div>
        </div>

        <Button onClick={createStrategy} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!navigator.onLine}>
          <Plus className="w-4 h-4 mr-2" />
          Create Advanced Strategy
        </Button>
      </CardContent>
    </Card>
  );
}