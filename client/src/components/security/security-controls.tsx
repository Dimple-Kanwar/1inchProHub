import { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, Settings, Eye, EyeOff, Clock, DollarSign, Brain, Zap, Users, Globe, Ban } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface SecurityControlsProps {
  className?: string;
}

interface SecurityProfile {
  id: string;
  name: string;
  description: string;
  settings: UserSecuritySettings;
  isActive: boolean;
}

interface UserSecuritySettings {
  // Transaction Limits
  dailyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;

  // Auto-lock Settings
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  smartLockEnabled: boolean;

  // Authorization Requirements
  requireAuthForLargeTransactions: boolean;
  largeTransactionThreshold: number;
  require2FA: boolean;

  // Network & Chain Security
  allowedChains: number[];
  restrictToWhitelistedTokens: boolean;
  whitelistedTokens: string[];
  blacklistedTokens: string[];

  // Advanced Security
  antiPhishingCode: string;
  allowedSlippage: number;
  suspiciousActivityThreshold: number;

  // Address Management
  whitelistedAddresses: string[];
  blacklistedAddresses: string[];
  requireApprovalForNewAddresses: boolean;

  // Time-based Controls
  tradingTimeRestrictions: boolean;
  allowedTradingHours: {
    start: string;
    end: string;
  };

  // Backup & Recovery
  recoveryPhraseBackedUp: boolean;
  lastSecurityAudit: string;
}

const DEFAULT_SECURITY_SETTINGS: UserSecuritySettings = {
  dailyLimit: 5000,
  monthlyLimit: 50000,
  singleTransactionLimit: 10000,
  autoLockEnabled: true,
  autoLockTimeout: 30,
  smartLockEnabled: true,
  requireAuthForLargeTransactions: true,
  largeTransactionThreshold: 1000,
  require2FA: false,
  allowedChains: [1, 137, 42161, 56, 43114],
  restrictToWhitelistedTokens: false,
  whitelistedTokens: [],
  blacklistedTokens: [],
  antiPhishingCode: '',
  allowedSlippage: 3,
  suspiciousActivityThreshold: 5,
  whitelistedAddresses: [],
  blacklistedAddresses: [],
  requireApprovalForNewAddresses: true,
  tradingTimeRestrictions: false,
  allowedTradingHours: {
    start: '09:00',
    end: '17:00'
  },
  recoveryPhraseBackedUp: false,
  lastSecurityAudit: ''
};

const SECURITY_PROFILES: SecurityProfile[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Maximum security with strict limits',
    settings: {
      ...DEFAULT_SECURITY_SETTINGS,
      dailyLimit: 1000,
      monthlyLimit: 10000,
      singleTransactionLimit: 500,
      autoLockTimeout: 15,
      largeTransactionThreshold: 100,
      require2FA: true,
      allowedSlippage: 1,
      suspiciousActivityThreshold: 3
    },
    isActive: false
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good security with reasonable limits',
    settings: DEFAULT_SECURITY_SETTINGS,
    isActive: true
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Higher limits for active traders',
    settings: {
      ...DEFAULT_SECURITY_SETTINGS,
      dailyLimit: 25000,
      monthlyLimit: 250000,
      singleTransactionLimit: 50000,
      autoLockTimeout: 60,
      largeTransactionThreshold: 5000,
      allowedSlippage: 5,
      suspiciousActivityThreshold: 10
    },
    isActive: false
  }
];

export function SecurityControls({ className }: SecurityControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<UserSecuritySettings>(DEFAULT_SECURITY_SETTINGS);
  const [activeProfile, setActiveProfile] = useState<string>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newWhitelistAddress, setNewWhitelistAddress] = useState('');
  const [newBlacklistAddress, setNewBlacklistAddress] = useState('');

  // Fetch current security settings
  const { data: securityStatus, isLoading } = useQuery({
    queryKey: ['security-settings'],
    queryFn: () => apiRequest('/api/wallet/security-settings'),
    refetchInterval: 10000
  });

  // Update security settings
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<UserSecuritySettings>) =>
      apiRequest('/api/wallet/security-settings', {
        method: 'PUT',
        body: { settings: { ...settings, ...newSettings } }
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
        description: "Failed to update security settings.",
        variant: "destructive"
      });
    }
  });

  // Apply security profile
  const applyProfile = (profileId: string) => {
    const profile = SECURITY_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setSettings(profile.settings);
      setActiveProfile(profileId);
      updateSettingsMutation.mutate(profile.settings);
    }
  };

  // Add address to whitelist
  const addToWhitelist = () => {
    if (newWhitelistAddress && !settings.whitelistedAddresses.includes(newWhitelistAddress)) {
      const updatedAddresses = [...settings.whitelistedAddresses, newWhitelistAddress];
      setSettings(prev => ({ ...prev, whitelistedAddresses: updatedAddresses }));
      updateSettingsMutation.mutate({ whitelistedAddresses: updatedAddresses });
      setNewWhitelistAddress('');
    }
  };

  // Add address to blacklist
  const addToBlacklist = () => {
    if (newBlacklistAddress && !settings.blacklistedAddresses.includes(newBlacklistAddress)) {
      const updatedAddresses = [...settings.blacklistedAddresses, newBlacklistAddress];
      setSettings(prev => ({ ...prev, blacklistedAddresses: updatedAddresses }));
      updateSettingsMutation.mutate({ blacklistedAddresses: updatedAddresses });
      setNewBlacklistAddress('');
    }
  };

  // Calculate security score
  const calculateSecurityScore = () => {
    let score = 0;
    if (settings.require2FA) score += 20;
    if (settings.autoLockEnabled) score += 15;
    if (settings.smartLockEnabled) score += 15;
    if (settings.requireAuthForLargeTransactions) score += 10;
    if (settings.dailyLimit < 10000) score += 10;
    if (settings.allowedSlippage <= 3) score += 10;
    if (settings.whitelistedAddresses.length > 0) score += 10;
    if (settings.antiPhishingCode) score += 10;
    return Math.min(score, 100);
  };

  const securityScore = calculateSecurityScore();

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Shield className="w-5 h-5" />
          <span>Advanced Security Controls</span>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-auto",
              securityScore >= 80 ? "text-green-400 border-green-500" :
              securityScore >= 60 ? "text-yellow-400 border-yellow-500" :
              "text-red-400 border-red-500"
            )}
          >
            Security Score: {securityScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Profiles */}
        <div>
          <Label className="text-gray-300 mb-3 block">Security Profiles</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SECURITY_PROFILES.map((profile) => (
              <Card 
                key={profile.id}
                className={cn(
                  "cursor-pointer transition-all border",
                  activeProfile === profile.id 
                    ? "bg-blue-900/30 border-blue-500" 
                    : "bg-gray-700 border-gray-600 hover:border-gray-500"
                )}
                onClick={() => applyProfile(profile.id)}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium text-white">{profile.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{profile.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Daily: ${profile.settings.dailyLimit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs defaultValue="limits" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-700">
            <TabsTrigger value="limits" className="text-xs">Limits</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
            <TabsTrigger value="addresses" className="text-xs">Addresses</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
          </TabsList>

          {/* Transaction Limits */}
          <TabsContent value="limits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">Daily Limit ($)</Label>
                <Input
                  type="number"
                  value={settings.dailyLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSettings(prev => ({ ...prev, dailyLimit: value }));
                    updateSettingsMutation.mutate({ dailyLimit: value });
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Monthly Limit ($)</Label>
                <Input
                  type="number"
                  value={settings.monthlyLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSettings(prev => ({ ...prev, monthlyLimit: value }));
                    updateSettingsMutation.mutate({ monthlyLimit: value });
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Single Transaction Limit ($)</Label>
                <Input
                  type="number"
                  value={settings.singleTransactionLimit}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSettings(prev => ({ ...prev, singleTransactionLimit: value }));
                    updateSettingsMutation.mutate({ singleTransactionLimit: value });
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Allowed Slippage (%)</Label>
              <div className="mt-2">
                <Slider
                  value={[settings.allowedSlippage]}
                  onValueChange={(value) => {
                    setSettings(prev => ({ ...prev, allowedSlippage: value[0] }));
                    updateSettingsMutation.mutate({ allowedSlippage: value[0] });
                  }}
                  max={10}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Current: {settings.allowedSlippage}%
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Auto-Lock Wallet</Label>
                  <p className="text-xs text-gray-400">Lock wallet after inactivity</p>
                </div>
                <Switch
                  checked={settings.autoLockEnabled}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, autoLockEnabled: checked }));
                    updateSettingsMutation.mutate({ autoLockEnabled: checked });
                  }}
                />
              </div>

              {settings.autoLockEnabled && (
                <div>
                  <Label className="text-gray-300">Auto-Lock Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.autoLockTimeout}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30;
                      setSettings(prev => ({ ...prev, autoLockTimeout: value }));
                      updateSettingsMutation.mutate({ autoLockTimeout: value });
                    }}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Smart Lock</Label>
                  <p className="text-xs text-gray-400">AI-powered suspicious activity detection</p>
                </div>
                <Switch
                  checked={settings.smartLockEnabled}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, smartLockEnabled: checked }));
                    updateSettingsMutation.mutate({ smartLockEnabled: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Require Auth for Large Transactions</Label>
                  <p className="text-xs text-gray-400">Additional confirmation for large amounts</p>
                </div>
                <Switch
                  checked={settings.requireAuthForLargeTransactions}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, requireAuthForLargeTransactions: checked }));
                    updateSettingsMutation.mutate({ requireAuthForLargeTransactions: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Two-Factor Authentication</Label>
                  <p className="text-xs text-gray-400">Enable 2FA for enhanced security</p>
                </div>
                <Switch
                  checked={settings.require2FA}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, require2FA: checked }));
                    updateSettingsMutation.mutate({ require2FA: checked });
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* Address Management */}
          <TabsContent value="addresses" className="space-y-4">
            {/* Whitelist */}
            <div>
              <Label className="text-gray-300">Whitelisted Addresses</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="0x..."
                  value={newWhitelistAddress}
                  onChange={(e) => setNewWhitelistAddress(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button onClick={addToWhitelist} size="sm">
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {settings.whitelistedAddresses.map((address, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <span className="text-xs text-gray-300 font-mono">{address}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = settings.whitelistedAddresses.filter((_, i) => i !== index);
                        setSettings(prev => ({ ...prev, whitelistedAddresses: updated }));
                        updateSettingsMutation.mutate({ whitelistedAddresses: updated });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Blacklist */}
            <div>
              <Label className="text-gray-300">Blacklisted Addresses</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="0x..."
                  value={newBlacklistAddress}
                  onChange={(e) => setNewBlacklistAddress(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button onClick={addToBlacklist} size="sm" variant="destructive">
                  Block
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {settings.blacklistedAddresses.map((address, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-900/20 p-2 rounded">
                    <span className="text-xs text-gray-300 font-mono">{address}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = settings.blacklistedAddresses.filter((_, i) => i !== index);
                        setSettings(prev => ({ ...prev, blacklistedAddresses: updated }));
                        updateSettingsMutation.mutate({ blacklistedAddresses: updated });
                      }}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label className="text-gray-300">Anti-Phishing Code</Label>
              <Input
                value={settings.antiPhishingCode}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, antiPhishingCode: e.target.value }));
                  updateSettingsMutation.mutate({ antiPhishingCode: e.target.value });
                }}
                placeholder="Enter a secret phrase"
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                This code will be shown on legitimate transactions
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Trading Time Restrictions</Label>
                <p className="text-xs text-gray-400">Only allow trading during specific hours</p>
              </div>
              <Switch
                checked={settings.tradingTimeRestrictions}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({ ...prev, tradingTimeRestrictions: checked }));
                  updateSettingsMutation.mutate({ tradingTimeRestrictions: checked });
                }}
              />
            </div>

            {settings.tradingTimeRestrictions && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Start Time</Label>
                  <Input
                    type="time"
                    value={settings.allowedTradingHours.start}
                    onChange={(e) => {
                      const updatedHours = { ...settings.allowedTradingHours, start: e.target.value };
                      setSettings(prev => ({ ...prev, allowedTradingHours: updatedHours }));
                      updateSettingsMutation.mutate({ allowedTradingHours: updatedHours });
                    }}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">End Time</Label>
                  <Input
                    type="time"
                    value={settings.allowedTradingHours.end}
                    onChange={(e) => {
                      const updatedHours = { ...settings.allowedTradingHours, end: e.target.value };
                      setSettings(prev => ({ ...prev, allowedTradingHours: updatedHours }));
                      updateSettingsMutation.mutate({ allowedTradingHours: updatedHours });
                    }}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-gray-300">Suspicious Activity Threshold</Label>
              <div className="mt-2">
                <Slider
                  value={[settings.suspiciousActivityThreshold]}
                  onValueChange={(value) => {
                    setSettings(prev => ({ ...prev, suspiciousActivityThreshold: value[0] }));
                    updateSettingsMutation.mutate({ suspiciousActivityThreshold: value[0] });
                  }}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Trigger after {settings.suspiciousActivityThreshold} unusual activities
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Security Score Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-gray-300">Security Score</Label>
            <span className="text-sm text-gray-400">{securityScore}/100</span>
          </div>
          <Progress 
            value={securityScore} 
            className="h-2"
          />
          <p className="text-xs text-gray-400 mt-1">
            {securityScore >= 80 ? "Excellent security configuration" :
             securityScore >= 60 ? "Good security, consider enabling more features" :
             "Security can be improved"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}