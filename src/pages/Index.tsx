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

  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
    audioRef.current.preload = 'auto';
    
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
  
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  useEffect(() => {
    if (persistedSettings.apiUrl && persistedSettings.blockchainUrl && !isConnected && !isLoading) {
      connectToSources();
    }
  }, [persistedSettings, isConnected, isLoading, connectToSources]);
  
  useEffect(() => {
    if (isConnected && !isLoading) {
      const forcedRefresh = setInterval(() => {
        fetchThreatData();
        fetchBlockchainData();
      }, 15000);
      
      return () => clearInterval(forcedRefresh);
    }
  }, [isConnected, isLoading, fetchThreatData, fetchBlockchainData]);
  
  useEffect(() => {
    if (!threatData.length || !notificationsEnabled) return;
    
    const highSeverityThreats = threatData
      .filter(threat => 
        threat.severity === 'High' && 
        threat.status !== 'Mitigated' && 
        !alertHistory.includes(threat.id)
      );
    
    if (highSeverityThreats.length > 0) {
      setCurrentAlert(highSeverityThreats[0]);
      setAlertHistory(prev => [...prev, highSeverityThreats[0].id]);
    }
  }, [threatData, notificationsEnabled, alertHistory]);
  
  const handleConnect = (apiKey: string, apiUrl: string, blockchainUrl: string) => {
    try {
      new URL(apiUrl);
      new URL(blockchainUrl);
      
      const newSettings = { apiKey, apiUrl, blockchainUrl };
      setPersistedSettings(newSettings);
      connectToSources();
    } catch (err) {
      console.error("Invalid URL format", err);
    }
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
                
                <section className="dashboard-grid">
                  <div className="md:col-span-8 h-[400px]">
                    <ThreatMap threats={threatData} />
                  </div>
                  <div className="md:col-span-4">
                    <BlockchainViewer data={blockchainData} />
                  </div>
                </section>

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
