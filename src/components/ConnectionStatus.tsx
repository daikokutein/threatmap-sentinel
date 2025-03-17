
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Signal, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdated: Date | null;
  isReconnecting?: boolean;
  reconnectAttempts?: number;
}

const ConnectionStatus = ({ 
  isConnected, 
  lastUpdated, 
  isReconnecting = false,
  reconnectAttempts = 0
}: ConnectionStatusProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [staleData, setStaleData] = useState<boolean>(false);
  
  useEffect(() => {
    const updateTime = () => {
      if (lastUpdated) {
        try {
          setTimeAgo(formatDistanceToNow(lastUpdated, { addSuffix: true }));
          
          // Check if data is stale (older than 30 seconds)
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdated.getTime();
          setStaleData(isConnected && timeDiff > 30000);
          
          // Show toast for stale data only once
          if (staleData && isConnected && timeDiff > 30000 && timeDiff < 40000) {
            toast.warning("Data hasn't updated recently. Possible connection issues.", {
              id: "stale-data-warning",
            });
          }
        } catch (error) {
          console.error("Error formatting time:", error);
        }
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 5000);
    
    return () => clearInterval(interval);
  }, [lastUpdated, isConnected, staleData]);
  
  return (
    <div className="flex items-center justify-end space-x-1 text-xs">
      {isConnected ? (
        <div className={cn(
          "flex items-center transition-colors",
          staleData ? "text-yellow-500" : "text-green-500"
        )}>
          {isReconnecting ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              <span>Reconnecting{reconnectAttempts > 0 ? ` (attempt ${reconnectAttempts})` : ''}</span>
            </>
          ) : staleData ? (
            <>
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Potentially stale data</span>
            </>
          ) : (
            <>
              <Signal className="h-3 w-3 mr-1 animate-pulse" />
              <span>Connected</span>
            </>
          )}
          {lastUpdated && (
            <div className={cn(
              "flex items-center ml-3",
              staleData ? "text-yellow-500/70" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated {timeAgo}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center text-red-500">
          <WifiOff className="h-3 w-3 mr-1" />
          <span>Disconnected</span>
          {isReconnecting && (
            <span className="ml-1">- Attempting to reconnect{reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
