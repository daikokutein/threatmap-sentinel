
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ThreatStats from '@/components/ThreatStats';
import LiveAttackFeed from '@/components/LiveAttackFeed';
import ThreatMap from '@/components/ThreatMap';
import BlockchainViewer from '@/components/BlockchainViewer';
import ThreatChart from '@/components/ThreatChart';
import AlertBanner from '@/components/AlertBanner';
import ThreatTrends from '@/components/ThreatTrends';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useThreatData, ThreatData } from '@/hooks/useThreatData';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Shield, AlertOctagon } from 'lucide-react';

const Index = () => {
  const [persistedSettings, setPersistedSettings] = useState(() => {
    const stored = localStorage.getItem('sentinel-connection-settings');
    return stored ? JSON.parse(stored) : {
      apiKey: '',
      apiUrl: '',
      blockchainUrl: '',
    };
  });
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sentinel-sound-enabled') === 'true';
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('sentinel-notifications-enabled') !== 'false';
  });
  
  const [soundVolume, setSoundVolume] = useState(() => {
    const storedVolume = localStorage.getItem('sentinel-sound-volume');
    return storedVolume ? parseInt(storedVolume, 10) : 70;
  });
  
  const [currentAlert, setCurrentAlert] = useState<ThreatData | null>(null);
  const [alertHistory, setAlertHistory] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('sentinel-connection-settings', JSON.stringify(persistedSettings));
  }, [persistedSettings]);
  
  useEffect(() => {
    localStorage.setItem('sentinel-sound-enabled', soundEnabled.toString());
  }, [soundEnabled]);
  
  useEffect(() => {
    localStorage.setItem('sentinel-notifications-enabled', notificationsEnabled.toString());
  }, [notificationsEnabled]);
  
  useEffect(() => {
    localStorage.setItem('sentinel-sound-volume', soundVolume.toString());
  }, [soundVolume]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
    audioRef.current.preload = 'auto'; // Preload for faster playback
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  const { 
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
  } = useThreatData(persistedSettings);
  
  // Toggle sound notifications
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  // Auto-connect on load if we have persisted settings
  useEffect(() => {
    if (persistedSettings.apiUrl && persistedSettings.blockchainUrl && !isConnected && !isLoading) {
      connectToSources();
    }
  }, [persistedSettings, isConnected, isLoading, connectToSources]);
  
  // Force refresh data periodically even if interval fails
  useEffect(() => {
    if (isConnected && !isLoading) {
      const forcedRefresh = setInterval(() => {
        fetchThreatData();
        fetchBlockchainData();
      }, 15000); // Every 15 seconds as a backup
      
      return () => clearInterval(forcedRefresh);
    }
  }, [isConnected, isLoading, fetchThreatData, fetchBlockchainData]);
  
  // Handle new threats for alerts
  useEffect(() => {
    if (!threatData.length || !notificationsEnabled) return;
    
    // Check for new high severity threats that aren't in alert history
    const highSeverityThreats = threatData
      .filter(threat => 
        threat.severity === 'High' && 
        threat.status !== 'Mitigated' && 
        !alertHistory.includes(threat.id)
      );
    
    if (highSeverityThreats.length > 0) {
      // Take the most recent high severity threat
      setCurrentAlert(highSeverityThreats[0]);
      
      // Add to alert history
      setAlertHistory(prev => [...prev, highSeverityThreats[0].id]);
    }
  }, [threatData, notificationsEnabled, alertHistory]);
  
  const handleConnect = (apiKey: string, apiUrl: string, blockchainUrl: string) => {
    const newSettings = { apiKey, apiUrl, blockchainUrl };
    setPersistedSettings(newSettings);
    connectToSources();
  };
  
  const handleDisconnect = () => {
    disconnect();
  };
  
  const handleReset = () => {
    const newSettings = { apiKey: '', apiUrl: '', blockchainUrl: '' };
    setPersistedSettings(newSettings);
    disconnect();
  };
  
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
        <Toaster position="top-right" richColors closeButton />
        <Header 
          isConnected={isConnected}
          connectionSettings={persistedSettings}
          onDisconnect={handleDisconnect}
          onReset={handleReset}
          onConnect={handleConnect}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
        />
        
        <main className="container mx-auto pt-24 pb-16 px-4 sm:px-6">
          {(isConnected || isReconnecting) && (
            <div className="mb-4">
              <ConnectionStatus 
                isConnected={isConnected} 
                lastUpdated={lastUpdated}
                isReconnecting={isReconnecting}
                reconnectAttempts={reconnectAttempts} 
              />
            </div>
          )}
          
          <div className="space-y-6">
            {/* Alert Banner */}
            {currentAlert && (
              <AlertBanner 
                threat={currentAlert} 
                onClose={() => setCurrentAlert(null)} 
                soundEnabled={soundEnabled}
                soundVolume={soundVolume}
                toggleSound={toggleSound}
              />
            )}
            
            {!isConnected && !isLoading && !isReconnecting ? (
              <div className="h-[70vh] flex flex-col items-center justify-center">
                <div className="text-center space-y-6 max-w-lg">
                  <Shield className="h-20 w-20 text-primary opacity-20 mx-auto" />
                  <h2 className="text-2xl font-semibold">Sentinel Dashboard</h2>
                  <p className="text-muted-foreground">
                    Connect to your threat intelligence API and blockchain ledger to view 
                    real-time security insights and threat data.
                  </p>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => document.getElementById('settings-trigger')?.click()}
                      className="connect-button group"
                    >
                      Connect to Data Sources
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Stats & Activity Overview */}
                <section className="dashboard-grid">
                  <div className="md:col-span-3">
                    <ThreatStats {...threatStats} />
                  </div>
                  <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-9 gap-6">
                    <div className="md:col-span-5 h-[500px]">
                      <LiveAttackFeed threats={threatData} />
                    </div>
                    <div className="md:col-span-4 h-[500px]">
                      <ThreatChart threats={threatData} />
                    </div>
                  </div>
                </section>
                
                {/* Map & Analytics */}
                <section className="dashboard-grid">
                  <div className="md:col-span-8 h-[400px]">
                    <ThreatMap threats={threatData} />
                  </div>
                  <div className="md:col-span-4">
                    <BlockchainViewer data={blockchainData} />
                  </div>
                </section>

                {/* Trends & Analytics */}
                <section>
                  <ThreatTrends threats={threatData} />
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Index;
