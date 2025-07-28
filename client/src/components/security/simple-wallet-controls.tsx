import { useState } from 'react';
import { Shield, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SimpleWalletControlsProps {
  className?: string;
}

export function SimpleWalletControls({ className }: SimpleWalletControlsProps) {
  const [walletLocked, setWalletLocked] = useState(false);
  const [dailyUsed] = useState(2500);
  const [dailyLimit] = useState(10000);

  const handleToggleLock = () => {
    setWalletLocked(!walletLocked);
  };

  const getDailyUsagePercentage = () => {
    return (dailyUsed / dailyLimit) * 100;
  };

  return (
    <Card className={cn("bg-gray-800 border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Wallet Security</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lock Status */}
        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            {walletLocked ? (
              <Lock className="w-8 h-8 text-red-400" />
            ) : (
              <Unlock className="w-8 h-8 text-green-400" />
            )}
            <div>
              <div className="font-medium text-white">
                {walletLocked ? 'Wallet Locked' : 'Wallet Unlocked'}
              </div>
              <div className="text-sm text-gray-400">
                {walletLocked ? 'All transactions blocked' : 'Transactions enabled'}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleToggleLock}
            variant={walletLocked ? "destructive" : "default"}
            className="min-w-20"
          >
            {walletLocked ? 'Unlock' : 'Lock'}
          </Button>
        </div>

        {/* Daily Transaction Limit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Daily Transaction Limit</span>
            <Badge variant="outline" className="text-green-400 border-green-500">
              ${dailyUsed} / ${dailyLimit}
            </Badge>
          </div>
          
          <Progress 
            value={getDailyUsagePercentage()} 
            className="h-3"
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              !walletLocked ? "bg-green-400 animate-pulse" : "bg-red-400"
            )} />
            <span className="text-xs text-gray-400">
              {!walletLocked ? 'Security Active' : 'Wallet Secured'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}