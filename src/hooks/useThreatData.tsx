import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface ThreatDetail {
  user_agent: string;
  method: string;
  url_path: string;
  source_port: number;
  destination_port: number;
}

export interface ThreatData {
  id: string;
  timestamp: string;
  ip: string;
  attack_type: string;
  severity: 'High' | 'Medium' | 'Low';
  status: string;
  details: ThreatDetail;
  // Optional coordinates for map display
  coordinates?: [number, number];
}

export interface BlockchainBlock {
  data: {
    message: string;
    type: string;
    // Other data can be added here
  };
  data_hash: string;
  hash: string;
  previous_hash: string;
  timestamp: string;
}

export interface BlockchainData {
  chain: BlockchainBlock[];
}

interface useThreatDataProps {
  apiKey?: string;
  apiUrl?: string;
  blockchainUrl?: string;
}

// Cache for IP coordinates to ensure consistency
const IP_CACHE: Record<string, [number, number]> = {};

// Function to generate realistic coordinates for IPs not in the cache
const getCoordinatesForIP = (ip: string): [number, number] => {
  if (IP_CACHE[ip]) {
    return IP_CACHE[ip];
  }
  
  // Generate realistic coordinates
  const lat = Math.random() * 140 - 70; // -70 to 70
  const lng = Math.random() * 340 - 170; // -170 to 170
  
  IP_CACHE[ip] = [lat, lng];
  return [lat, lng];
};

export const useThreatData = ({ apiKey, apiUrl, blockchainUrl }: useThreatDataProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  const [blockchainData, setBlockchainData] = useState<BlockchainData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Keep track of seen threat IDs to detect new threats
  const seenThreatIdsRef = useRef<Set<string>>(new Set());
  
  const fetchThreatData = useCallback(async () => {
    if (!apiUrl) return;
    
    // Cancel any in-progress requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await fetch(apiUrl, { 
        headers,
        signal: abortControllerRef.current.signal,
        // Add cache busting parameter to prevent caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: ThreatData[] = await response.json();
      
      // Add coordinates to each threat for map visualization
      const enrichedData = data.map(threat => ({
        ...threat,
        coordinates: getCoordinatesForIP(threat.ip)
      }));
      
      // Check for new threats
      const currentThreatIds = new Set(enrichedData.map(t => t.id));
      const newThreats = enrichedData.filter(t => !seenThreatIdsRef.current.has(t.id));
      
      // Update seen threat IDs
      enrichedData.forEach(t => seenThreatIdsRef.current.add(t.id));
      
      setThreatData(enrichedData);
      setLastUpdated(new Date());
      setLastSuccessfulFetch(new Date());
      
      // Reset reconnect state on successful fetch
      if (isReconnecting) {
        setIsReconnecting(false);
        setReconnectAttempts(0);
        toast.success('Reconnected to threat data source');
      }
      
      // If we weren't connected before, set connected now
      if (!isConnected) {
        setIsConnected(true);
      }
      
      // Return new threats for notification purposes
      return { newThreats, success: true };
    } catch (err) {
      // Only set error if it's not an abort error
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        
        if (isConnected && !isReconnecting) {
          setIsReconnecting(true);
          toast.error('Connection to threat API lost. Attempting to reconnect...');
        }
        
        // If it was connected but now it's not, start reconnect process
        if (isConnected) {
          scheduleReconnect();
        }
        
        return { newThreats: [], success: false };
      }
      return { newThreats: [], success: false, aborted: true };
    }
  }, [apiUrl, apiKey, isConnected, isReconnecting]);
  
  const fetchBlockchainData = useCallback(async () => {
    if (!blockchainUrl) return;
    
    try {
      const response = await fetch(blockchainUrl, {
        // Add cache busting parameter to prevent caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Blockchain request failed with status ${response.status}`);
      }
      
      const data: BlockchainData = await response.json();
      setBlockchainData(data);
      setLastUpdated(new Date());
      setLastSuccessfulFetch(new Date());
      
      return { success: true };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        
        if (isConnected && !isReconnecting) {
          setIsReconnecting(true);
          toast.error('Connection to blockchain lost. Attempting to reconnect...');
        }
        
        // If it was connected but now it's not, start reconnect process
        if (isConnected) {
          scheduleReconnect();
        }
        
        return { success: false };
      }
      return { success: false };
    }
  }, [blockchainUrl, isConnected, isReconnecting]);
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Exponential backoff for reconnect attempts (1s, 2s, 4s, 8s, etc., max 30s)
    const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
    
    reconnectTimeoutRef.current = window.setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      Promise.all([
        fetchThreatData(),
        fetchBlockchainData()
      ]);
    }, delay);
    
  }, [reconnectAttempts, fetchThreatData, fetchBlockchainData]);
  
  const disconnect = useCallback(() => {
    // Cancel any in-progress requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
    setReconnectAttempts(0);
    toast.info('Disconnected from data sources');
  }, []);
  
  const connectToSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Clear any existing interval and timeout
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      const results = await Promise.all([
        fetchThreatData(),
        fetchBlockchainData()
      ]);
      
      const allSuccessful = results.every(result => result?.success);
      
      if (allSuccessful) {
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        toast.success('Successfully connected to data sources');
        
        // Set up polling every 5 seconds (reduced from 10 for more real-time updates)
        intervalRef.current = window.setInterval(() => {
          fetchThreatData();
          fetchBlockchainData();
        }, 5000);
      } else {
        toast.error('Failed to connect to one or more data sources');
        setIsConnected(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
      toast.error('Failed to connect to data sources');
    } finally {
      setIsLoading(false);
    }
  }, [fetchThreatData, fetchBlockchainData]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Check for stale data periodically
  useEffect(() => {
    const staleDataCheck = setInterval(() => {
      if (isConnected && lastSuccessfulFetch) {
        const now = new Date();
        const timeSinceLastFetch = now.getTime() - lastSuccessfulFetch.getTime();
        
        // If last successful fetch was more than 15 seconds ago, try reconnecting
        if (timeSinceLastFetch > 15000 && !isReconnecting) {
          setIsReconnecting(true);
          scheduleReconnect();
        }
      }
    }, 5000);
    
    return () => clearInterval(staleDataCheck);
  }, [isConnected, lastSuccessfulFetch, isReconnecting, scheduleReconnect]);
  
  // Statistics calculations with error handling
  const threatStats = {
    total: threatData.length || 0,
    high: threatData.filter(t => t.severity === 'High').length || 0,
    medium: threatData.filter(t => t.severity === 'Medium').length || 0,
    low: threatData.filter(t => t.severity === 'Low').length || 0,
    mitigated: threatData.filter(t => t.status === 'Mitigated').length || 0,
    active: threatData.filter(t => t.status !== 'Mitigated').length || 0,
  };
  
  return {
    isConnected,
    isLoading,
    error,
    lastUpdated,
    threatData,
    blockchainData,
    threatStats,
    reconnectAttempts,
    isReconnecting,
    connectToSources,
    disconnect,
    fetchThreatData,
    fetchBlockchainData
  };
};
