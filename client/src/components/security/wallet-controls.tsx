
import { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, Settings, Eye, EyeOff, Clock, DollarSign, Brain, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface WalletControlsProps {
  className?: string;
}

interface SecuritySettings {
  requireAuthForLargeTransactions: boolean;
  largeTransactionThreshold: string;
  autoLockEnabled: boolean;
  autoLockInactivityMinutes: number;
  allowedChains: number[];
  blockedTokens: string[];
  maxSlippage: number;
  smartLockEnabled: boolean;
  suspiciousActivityThreshold: number;
  whitelistedAddresses: string[];
  blacklistedAddresses: string[];
  limitPeriod: 'daily' | 'monthly';
}

interface WalletStatus {
  walletLocked: boolean;
  smartLockActive: boolean;
  lockReason: string | null;
  dailyTransactionLimit: string;
  monthlyTransactionLimit: string;
  dailyTransactionUsed: string;
  monthlyTransactionUsed: string;
  lastTransactionReset: string;
  twoFactorEnabled: boolean;
  securitySettings: SecuritySettings;
  connectedNetworks: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityLog {
  id: string;
  action: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

export function WalletControls({ className }: WalletControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newDailyLimit, setNewDailyLimit] = useState('');
  const [newMonthlyLimit, setNewMonthlyLimit] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('main');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    requireAuthForLargeTransactions: false,
    largeTransactionThreshold: '1000',
    autoLockEnabled: false,
    autoLockInactivityMinutes: 30,
    allowedChains: [1, 137, 42161, 56, 43114],
    blockedTokens: [],
    maxSlippage: 3,
    smartLockEnabled: true,
    suspiciousActivityThreshold: 5,
    whitelistedAddresses: [],
    blacklistedAddresses: [],
    limitPeriod: 'daily'
  });

  // Fetch wallet status with enhanced security data
  const { data: walletStatus, isLoading } = useQuery<WalletStatus>({
    queryKey: ['wallet-status'],
    queryFn: () => apiRequest('/api/wallet/status'),
    refetchInterval: 3000 // More frequent updates for real-time security
  });

  // Fetch security logs with real-time updates
  const { data: securityLogs = [] } = useQuery<SecurityLog[]>({
    queryKey: ['security-logs'],
    queryFn: () => apiRequest('/api/wallet/security-logs'),
    enabled: showSecurityLogs,
    refetchInterval: 5000
  });

  // Smart lock wallet mutation
  const smartLockMutation = useMutation({
    mutationFn: () => apiRequest('/api/wallet/smart-lock', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-status'] });
      toast({
        title: "Smart Lock Activated",
        description: "AI-powered security monitoring is now active.",
      });
    }
  });

  // Account-specific lock mutation
  const lockAccountMutation = useMutation({
    mutationFn: (accountId: string) => apiRequest('/api/wallet/lock-account', { 
      method: 'POST',
      body: { accountId }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-status'] });
      toast({
        title: "Account Locked",
        description: `Account ${selectedAccount} has been secured.`,
      });
    }
  });

  // Update daily limit mutation
  const updateDailyLimitMutation = useMutation({
    mutationFn: (limit: string) => apiRequest('/api/wallet/daily-limit', {
      method: 'POST',
      body: { limit }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-status'] });
      toast({
        title: "Daily Limit Updated",
        description: "Daily transaction limit has been updated.",
      });
      setNewDailyLimit('');
    }
  });

  // Update monthly limit mutation
  const updateMonthlyLimitMutation = useMutation({
    mutationFn: (limit: string) => apiRequest('/api/wallet/monthly-limit', {
      method: 'POST',
      body: { limit }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-status'] });
      toast({
        title: "Monthly Limit Updated",
        description: "Monthly transaction limit has been updated.",
      });
      setNewMonthlyLimit('');
    }
  });

  // Enhanced security settings mutation
  const updateSecurityMutation = useMutation({
    mutationFn: (settings: Partial<SecuritySettings>) => apiRequest('/api/wallet/security-settings', {
      method: 'POST',
      body: { settings }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-status'] });
      toast({
        title: "Security Settings Updated",
        description: "Enhanced security settings have been saved.",
      });
    }
  });

  // Update local settings when wallet status changes
  useEffect(() => {
    if (walletStatus?.securitySettings) {
      setSecuritySettings(walletStatus.securitySettings);
    }
  }, [walletStatus]);

  const getUsagePercentage = (used: string, limit: string) => {
    return (parseFloat(used) / parseFloat(limit)) * 100;
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-gray-800 border-gray-700", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Security Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Smart Security Center</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={cn("text-xs", getThreatLevelColor(walletStatus?.threatLevel || 'low'))}>
                Threat: {walletStatus?.threatLevel || 'Low'}
              </Badge>
              {walletStatus?.smartLockActive && (
                <Badge className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                  AI Active
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multi-Account Lock Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-300">Account Selection</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {walletStatus?.walletLocked ? (
                    <Lock className="w-6 h-6 text-red-400" />
                  ) : (
                    <Unlock className="w-6 h-6 text-green-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {walletStatus?.walletLocked ? 'Secured' : 'Active'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Account: {selectedAccount}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => lockAccountMutation.mutate(selectedAccount)}
                  size="sm"
                  variant={walletStatus?.walletLocked ? "destructive" : "default"}
                >
                  {walletStatus?.walletLocked ? 'Unlock' : 'Lock'}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-300 flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>Smart Lock</span>
                </Label>
                <Switch
                  checked={walletStatus?.smartLockActive || false}
                  onCheckedChange={() => smartLockMutation.mutate()}
                />
              </div>
              <div className="text-xs text-gray-400">
                AI monitors for suspicious patterns and auto-locks when threats are detected
              </div>
            </div>
          </div>

          {/* Enhanced Transaction Limits */}
          <Tabs defaultValue={securitySettings.limitPeriod} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900">
              <TabsTrigger value="daily" onClick={() => setSecuritySettings(prev => ({ ...prev, limitPeriod: 'daily' }))}>
                Daily Limits
              </TabsTrigger>
              <TabsTrigger value="monthly" onClick={() => setSecuritySettings(prev => ({ ...prev, limitPeriod: 'monthly' }))}>
                Monthly Limits
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Daily Transaction Limit</span>
                </Label>
                <Badge variant="outline" className="text-green-400 border-green-500">
                  ${walletStatus?.dailyTransactionUsed || '0'} / ${walletStatus?.dailyTransactionLimit || '0'}
                </Badge>
              </div>
              <Progress value={getUsagePercentage(walletStatus?.dailyTransactionUsed || '0', walletStatus?.dailyTransactionLimit || '1')} className="h-3" />
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="New daily limit"
                  value={newDailyLimit}
                  onChange={(e) => setNewDailyLimit(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button 
                  onClick={() => newDailyLimit && updateDailyLimitMutation.mutate(newDailyLimit)}
                  size="sm" 
                  disabled={!newDailyLimit || updateDailyLimitMutation.isPending}
                >
                  Update
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Monthly Transaction Limit</span>
                </Label>
                <Badge variant="outline" className="text-blue-400 border-blue-500">
                  ${walletStatus?.monthlyTransactionUsed || '0'} / ${walletStatus?.monthlyTransactionLimit || '0'}
                </Badge>
              </div>
              <Progress value={getUsagePercentage(walletStatus?.monthlyTransactionUsed || '0', walletStatus?.monthlyTransactionLimit || '1')} className="h-3" />
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="New monthly limit"
                  value={newMonthlyLimit}
                  onChange={(e) => setNewMonthlyLimit(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button 
                  onClick={() => newMonthlyLimit && updateMonthlyLimitMutation.mutate(newMonthlyLimit)}
                  size="sm" 
                  disabled={!newMonthlyLimit || updateMonthlyLimitMutation.isPending}
                >
                  Update
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Connected Networks Status */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-gray-300 flex items-center space-x-2">
                <Wifi className="w-4 h-4" />
                <span>Connected Networks</span>
              </Label>
              <span className="text-xs text-gray-400">
                {walletStatus?.connectedNetworks?.length || 0} networks
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {walletStatus?.connectedNetworks?.map((network) => (
                <Badge key={network} variant="outline" className="text-xs">
                  {network}
                </Badge>
              ))}
            </div>
          </div>

          {/* Enhanced Security Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Advanced Security Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Large Transaction Auth</Label>
                        <Switch 
                          checked={securitySettings.requireAuthForLargeTransactions}
                          onCheckedChange={(checked) => 
                            setSecuritySettings(prev => ({ ...prev, requireAuthForLargeTransactions: checked }))
                          }
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Threshold ($)</Label>
                        <Input 
                          type="number"
                          value={securitySettings.largeTransactionThreshold}
                          onChange={(e) => 
                            setSecuritySettings(prev => ({ ...prev, largeTransactionThreshold: e.target.value }))
                          }
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Auto-lock on Inactivity</Label>
                        <Switch 
                          checked={securitySettings.autoLockEnabled}
                          onCheckedChange={(checked) => 
                            setSecuritySettings(prev => ({ ...prev, autoLockEnabled: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Suspicious Activity Threshold</Label>
                        <Input 
                          type="number"
                          value={securitySettings.suspiciousActivityThreshold}
                          onChange={(e) => 
                            setSecuritySettings(prev => ({ ...prev, suspiciousActivityThreshold: parseInt(e.target.value) }))
                          }
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Max Slippage (%)</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={securitySettings.maxSlippage}
                          onChange={(e) => 
                            setSecuritySettings(prev => ({ ...prev, maxSlippage: parseFloat(e.target.value) }))
                          }
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Smart Lock AI</Label>
                        <Switch 
                          checked={securitySettings.smartLockEnabled}
                          onCheckedChange={(checked) => 
                            setSecuritySettings(prev => ({ ...prev, smartLockEnabled: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => updateSecurityMutation.mutate(securitySettings)}
                    disabled={updateSecurityMutation.isPending}
                    className="w-full"
                  >
                    Save Advanced Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showSecurityLogs} onOpenChange={setShowSecurityLogs}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Eye className="w-4 h-4 mr-2" />
                  Security Logs
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Security Activity Monitor</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {securityLogs.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No security events recorded
                    </div>
                  ) : (
                    securityLogs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          getThreatLevelColor(log.severity)
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {log.action.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                            {log.details && (
                              <div className="text-xs text-gray-300 mt-2 p-2 bg-gray-900/50 rounded">
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {log.severity}
                            </Badge>
                            {log.resolved && (
                              <Badge className="text-xs bg-green-500/10 text-green-400">
                                Resolved
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Real-time Security Alerts */}
          {walletStatus?.threatLevel === 'critical' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-400">Critical Security Alert</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Multiple suspicious activities detected. Smart Lock has been automatically activated.
                    Please review your recent transactions immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
