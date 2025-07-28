import { useState } from 'react';
import { 
  Home, 
  ArrowUpDown, 
  Zap, 
  Shield, 
  BarChart3, 
  Settings, 
  TrendingUp,
  Network,
  Wallet,
  PieChart,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  onNavigate?: (section: string) => void;
  activeSection?: string;
}

const NAVIGATION_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Home className="w-4 h-4" />,
    section: 'overview'
  },
  {
    id: 'swap',
    label: 'Fusion+ Swap',
    icon: <ArrowUpDown className="w-4 h-4" />,
    section: 'swap'
  },
  {
    id: 'strategy-builder',
    label: 'Strategy Builder',
    icon: <Zap className="w-4 h-4" />,
    section: 'strategy-builder'
  },
  {
    id: 'strategies',
    label: 'Active Strategies',
    icon: <TrendingUp className="w-4 h-4" />,
    section: 'strategies'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: <PieChart className="w-4 h-4" />,
    section: 'portfolio'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: <BarChart3 className="w-4 h-4" />,
    section: 'analysis'
  },
  {
    id: 'risk',
    label: 'Risk Assessment',
    icon: <AlertTriangle className="w-4 h-4" />,
    section: 'risk'
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="w-4 h-4" />,
    section: 'security'
  }
];

export function Sidebar({ className, onNavigate, activeSection }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigate = (section: string) => {
    onNavigate?.(section);
  };

  return (
    <div className={cn(
      "flex flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Network className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-white">1inch Hub</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {NAVIGATION_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => handleNavigate(item.section)}
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700",
              activeSection === item.section && "bg-blue-900/30 text-blue-300 border-blue-500/50",
              isCollapsed && "px-3"
            )}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </div>
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800",
                  activeSection === "settings" && "bg-gray-800 text-blue-400"
                )}
                onClick={() => onNavigate("settings")}
                disabled={!navigator.onLine}
              >
                <Settings className="w-4 h-4" />
                Settings
                {!navigator.onLine && (
                  <span className="text-xs text-red-400 ml-auto">Offline</span>
                )}
              </Button>
      </div>
    </div>
  );
}