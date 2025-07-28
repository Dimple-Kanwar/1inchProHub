import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/trading';

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

function NotificationItem({ notification, onClose }: NotificationProps) {
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    error: XCircle,
  };

  const colors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
    error: 'text-red-400',
  };

  const Icon = icons[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg animate-slide-up max-w-sm">
      <div className="flex items-start space-x-3">
        <Icon className={cn('w-5 h-5 mt-0.5', colors[notification.type])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
          <span className="text-xs text-gray-400 mt-2 block">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose methods globally for easy access
  useEffect(() => {
    (window as any).showNotification = addNotification;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}
