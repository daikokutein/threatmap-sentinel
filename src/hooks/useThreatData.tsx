
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

const IP_CACHE: Record<string, [number, number]> = {};

// Function to generate random coordinates for IPs not in the cache
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
  const intervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  const fetchThreatData = useCallback(async () => {
    if (!apiUrl) return;
    
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: ThreatData[] = await response.json();
      
      // Add coordinates to each threat for map visualization
      const enrichedData = data.map(threat => ({
        ...threat,
        coordinates: getCoordinatesForIP(threat.ip)
      }));
      
      setThreatData(enrichedData);
      setLastUpdated(new Date());
      
      // Reset reconnect attempts on successful fetch
      if (reconnectAttempts > 0) {
        setReconnectAttempts(0);
        toast.success('Reconnected to data sources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threat data');
      
      if (isConnected) {
        toast.error('Connection to threat API lost. Attempting to reconnect...');
        scheduleReconnect();
      }
    }
  }, [apiUrl, apiKey, isConnected, reconnectAttempts]);
  
  const fetchBlockchainData = useCallback(async () => {
    if (!blockchainUrl) return;
    
    try {
      const response = await fetch(blockchainUrl);
      
      if (!response.ok) {
        throw new Error(`Blockchain request failed with status ${response.status}`);
      }
      
      const data: BlockchainData = await response.json();
      setBlockchainData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blockchain data');
      
      if (isConnected) {
        toast.error('Connection to blockchain lost. Attempting to reconnect...');
        scheduleReconnect();
      }
    }
  }, [blockchainUrl, isConnected]);
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Exponential backoff for reconnect attempts (1s, 2s, 4s, 8s, etc., max 30s)
    const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
    
    reconnectTimeoutRef.current = window.setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      fetchThreatData();
      fetchBlockchainData();
    }, delay);
    
  }, [reconnectAttempts, fetchThreatData, fetchBlockchainData]);
  
  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
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
      await Promise.all([
        fetchThreatData(),
        fetchBlockchainData()
      ]);
      
      setIsConnected(true);
      setReconnectAttempts(0);
      toast.success('Successfully connected to data sources');
      
      // Set up polling every 10 seconds
      intervalRef.current = window.setInterval(() => {
        fetchThreatData();
        fetchBlockchainData();
      }, 10000);
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
    };
  }, []);
  
  // Statistics calculations
  const threatStats = {
    total: threatData.length,
    high: threatData.filter(t => t.severity === 'High').length,
    medium: threatData.filter(t => t.severity === 'Medium').length,
    low: threatData.filter(t => t.severity === 'Low').length,
    mitigated: threatData.filter(t => t.status === 'Mitigated').length,
    active: threatData.filter(t => t.status !== 'Mitigated').length,
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
    connectToSources,
    disconnect
  };
};
