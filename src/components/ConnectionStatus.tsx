
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdated: Date | null;
}

const ConnectionStatus = ({ isConnected, lastUpdated }: ConnectionStatusProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  useEffect(() => {
    const updateTime = () => {
      if (lastUpdated) {
        setTimeAgo(formatDistanceToNow(lastUpdated, { addSuffix: true }));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 10000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  return (
    <div className={cn(
      "flex items-center justify-end space-x-1 text-xs",
      isConnected ? "text-green-500" : "text-red-500"
    )}>
      {isConnected ? (
        <div className="flex items-center">
          <Wifi className="h-3 w-3 mr-1" />
          <span>Connected</span>
          {lastUpdated && (
            <div className="flex items-center text-muted-foreground ml-3">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated {timeAgo}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center">
          <WifiOff className="h-3 w-3 mr-1" />
          <span>Disconnected</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
