
import { useState, useEffect, useRef } from 'react';
import { Signal, Clock, AlertTriangle, Loader2 } from 'lucide-react';
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
  const staleWarningShownRef = useRef<boolean>(false);
  const prevLastUpdatedRef = useRef<Date | null>(lastUpdated);
  
  useEffect(() => {
    const updateTime = () => {
      if (lastUpdated) {
        try {
          setTimeAgo(formatDistanceToNow(lastUpdated, { addSuffix: true }));
          
          // Check if data is stale (older than 30 seconds)
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdated.getTime();
          const isDataStale = isConnected && timeDiff > 30000;
          
          // Only update staleData state if it's actually changing
          if (isDataStale !== staleData) {
            setStaleData(isDataStale);
          }
          
          // Show toast for stale data only once
          if (isDataStale && isConnected && !staleWarningShownRef.current) {
            toast.warning("Data hasn't updated recently. Possible connection issues.", {
              id: "stale-data-warning",
            });
            staleWarningShownRef.current = true;
          } else if (!isDataStale) {
            staleWarningShownRef.current = false;
          }
        } catch (error) {
          console.error("Error formatting time:", error);
        }
      }
    };
    
    // Only update if lastUpdated actually changed
    if (lastUpdated !== prevLastUpdatedRef.current) {
      updateTime();
      prevLastUpdatedRef.current = lastUpdated;
    }
    
    const interval = setInterval(updateTime, 10000); // Less frequent updates to reduce re-renders
    
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
              <span>Reconnecting{reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}</span>
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
          <AlertTriangle className="h-3 w-3 mr-1" />
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
