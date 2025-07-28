
import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, Smartphone, Key, Clock, DollarSign, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface SecuritySettingsProps {
  className?: string;
}

interface SecurityConfig {
  // Authentication
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  
  // Transaction Limits
  dailyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;
  requireAuthAbove: number;
  
  // Smart Security
  aiMonitoringEnabled: boolean;
  suspiciousActivityThreshold: number;
  autoLockOnSuspicious: boolean;
  whitelistEnabled: boolean;
  
  // Network Security
  allowedChains: string[];
  vpnRequired: boolean;
  geoBlocking: boolean;
  
  // Privacy
  hideBalances: boolean;
  anonymousMode: boolean;
  dataRetention: number;
}

export function SecuritySettings({ className }: SecuritySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<SecurityConfig>({
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30,
    dailyLimit: 10000,
    monthlyLimit: 50000,
    singleTransactionLimit: 5000,
    requireAuthAbove: 1000,
    aiMonitoringEnabled: true,
    suspiciousActivityThreshold: 5,
    autoLockOnSuspicious: true,
    whitelistEnabled: false,
    allowedChains: ['ethereum', 'polygon', 'arbitrum'],
    vpnRequired: false,
    geoBlocking: false,
    hideBalances: false,
    anonymousMode: false,
    dataRetention: 90
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSettings = useMutation({
    mutationFn: (settings: Partial<SecurityConfig>) => 
      apiRequest('/api/security/settings', {
        method: 'POST',
        body: { settings }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast({
        title: "Security Settings Updated",
        description: "Your security preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update security settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleConfigChange = (key: keyof SecurityConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateSettings.mutate({ [key]: value });
  };

  const availableChains = [
    { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
    { id: 'polygon', name: 'Polygon', icon: '⬡' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { id: 'optimism', name: 'Optimism', icon: '🔴' },
    { id: 'bsc', name: 'BSC', icon: '🟡' },
    { id: 'avalanche', name: 'Avalanche', icon: '🔺' }
  ];

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <span>Security Settings</span>
          </div>
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="sm"
            className="border-gray-600"
          >
            {showAdvanced ? 'Basic' : 'Advanced'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="authentication" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="authentication">Auth</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="authentication" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-400">Add an extra layer of security</div>
                  </div>
                </div>
                <Switch
                  checked={config.twoFactorEnabled}
                  onCheckedChange={(checked) => handleConfigChange('twoFactorEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Biometric Authentication</div>
                    <div className="text-xs text-gray-400">Use fingerprint or face recognition</div>
                  </div>
                </div>
                <Switch
                  checked={config.biometricEnabled}
                  onCheckedChange={(checked) => handleConfigChange('biometricEnabled', checked)}
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <Label className="text-sm font-medium text-white">Session Timeout</Label>
                  </div>
                  <span className="text-sm text-gray-400">{config.sessionTimeout} minutes</span>
                </div>
                <Slider
                  value={[config.sessionTimeout]}
                  onValueChange={([value]) => handleConfigChange('sessionTimeout', value)}
                  max={120}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5 min</span>
                  <span>120 min</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="limits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <Label className="text-sm font-medium text-white flex items-center space-x-2 mb-3">
                  <DollarSign className="w-4 h-4" />
                  <span>Daily Limit ($)</span>
                </Label>
                <Input
                  type="number"
                  value={config.dailyLimit}
                  onChange={(e) => handleConfigChange('dailyLimit', Number(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <Label className="text-sm font-medium text-white flex items-center space-x-2 mb-3">
                  <DollarSign className="w-4 h-4" />
                  <span>Monthly Limit ($)</span>
                </Label>
                <Input
                  type="number"
                  value={config.monthlyLimit}
                  onChange={(e) => handleConfigChange('monthlyLimit', Number(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <Label className="text-sm font-medium text-white flex items-center space-x-2 mb-3">
                  <Lock className="w-4 h-4" />
                  <span>Single Transaction Limit ($)</span>
                </Label>
                <Input
                  type="number"
                  value={config.singleTransactionLimit}
                  onChange={(e) => handleConfigChange('singleTransactionLimit', Number(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <Label className="text-sm font-medium text-white flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Require Auth Above ($)</span>
                </Label>
                <Input
                  type="number"
                  value={config.requireAuthAbove}
                  onChange={(e) => handleConfigChange('requireAuthAbove', Number(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-sm font-medium text-white">AI Monitoring</div>
                    <div className="text-xs text-gray-400">Detect suspicious patterns automatically</div>
                  </div>
                </div>
                <Switch
                  checked={config.aiMonitoringEnabled}
                  onCheckedChange={(checked) => handleConfigChange('aiMonitoringEnabled', checked)}
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-white">Suspicious Activity Threshold</Label>
                  <span className="text-sm text-gray-400">{config.suspiciousActivityThreshold} events</span>
                </div>
                <Slider
                  value={[config.suspiciousActivityThreshold]}
                  onValueChange={([value]) => handleConfigChange('suspiciousActivityThreshold', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Auto-lock on Suspicious Activity</div>
                    <div className="text-xs text-gray-400">Automatically lock wallet when threats detected</div>
                  </div>
                </div>
                <Switch
                  checked={config.autoLockOnSuspicious}
                  onCheckedChange={(checked) => handleConfigChange('autoLockOnSuspicious', checked)}
                />
              </div>

              {showAdvanced && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <Label className="text-sm font-medium text-white mb-3 block">Allowed Chains</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableChains.map((chain) => (
                        <div
                          key={chain.id}
                          onClick={() => {
                            const newChains = config.allowedChains.includes(chain.id)
                              ? config.allowedChains.filter(c => c !== chain.id)
                              : [...config.allowedChains, chain.id];
                            handleConfigChange('allowedChains', newChains);
                          }}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            config.allowedChains.includes(chain.id)
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                          )}
                        >
                          <span className="text-lg">{chain.icon}</span>
                          <span className="text-sm">{chain.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <EyeOff className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Hide Balances</div>
                    <div className="text-xs text-gray-400">Hide portfolio values in interface</div>
                  </div>
                </div>
                <Switch
                  checked={config.hideBalances}
                  onCheckedChange={(checked) => handleConfigChange('hideBalances', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Anonymous Mode</div>
                    <div className="text-xs text-gray-400">Minimize data collection and tracking</div>
                  </div>
                </div>
                <Switch
                  checked={config.anonymousMode}
                  onCheckedChange={(checked) => handleConfigChange('anonymousMode', checked)}
                />
              </div>

              {showAdvanced && (
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-white">Data Retention (days)</Label>
                    <span className="text-sm text-gray-400">{config.dataRetention} days</span>
                  </div>
                  <Slider
                    value={[config.dataRetention]}
                    onValueChange={([value]) => handleConfigChange('dataRetention', value)}
                    max={365}
                    min={30}
                    step={30}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>30 days</span>
                    <span>1 year</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-400">Security Score: 85/100</h4>
              <p className="text-sm text-gray-300 mt-1">
                Your security configuration is strong. Consider enabling 2FA for maximum protection.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
