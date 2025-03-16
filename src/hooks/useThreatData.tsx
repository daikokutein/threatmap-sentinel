import { useState, useEffect, useCallback } from 'react';
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threat data');
      toast.error('Failed to fetch threat data');
    }
  }, [apiUrl, apiKey]);
  
  const fetchBlockchainData = useCallback(async () => {
    if (!blockchainUrl) return;
    
    try {
      const response = await fetch(blockchainUrl);
      
      if (!response.ok) {
        throw new Error(`Blockchain request failed with status ${response.status}`);
      }
      
      const data: BlockchainData = await response.json();
      setBlockchainData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blockchain data');
      toast.error('Failed to fetch blockchain data');
    }
  }, [blockchainUrl]);
  
  const connectToSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchThreatData(),
        fetchBlockchainData()
      ]);
      
      setIsConnected(true);
      toast.success('Successfully connected to data sources');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchThreatData, fetchBlockchainData]);
  
  useEffect(() => {
    let interval: number | undefined;
    
    if (isConnected) {
      // Initial fetch
      fetchThreatData();
      fetchBlockchainData();
      
      // Set up polling every 15 seconds
      interval = window.setInterval(() => {
        fetchThreatData();
        fetchBlockchainData();
      }, 15000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, fetchThreatData, fetchBlockchainData]);
  
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
    threatData,
    blockchainData,
    threatStats,
    connectToSources
  };
};
