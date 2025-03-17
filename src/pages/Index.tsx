
import { useState, useEffect, useRef, useCallback } from 'react';
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
  // Load persisted settings from localStorage with error handling
  const [persistedSettings, setPersistedSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('sentinel-connection-settings');
      return stored ? JSON.parse(stored) : {
        apiKey: '',
        apiUrl: '',
        blockchainUrl: '',
      };
    } catch (error) {
      console.error('Error loading persisted settings:', error);
      return {
        apiKey: '',
        apiUrl: '',
        blockchainUrl: '',
      };
    }
  });
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('sentinel-sound-enabled') === 'true';
    } catch (error) {
      console.error('Error loading sound setting:', error);
      return false;
    }
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('sentinel-notifications-enabled') !== 'false';
    } catch (error) {
      console.error('Error loading notifications setting:', error);
      return true;
    }
  });
  
  const [soundVolume, setSoundVolume] = useState(() => {
    try {
      const storedVolume = localStorage.getItem('sentinel-sound-volume');
      return storedVolume ? parseInt(storedVolume, 10) : 70;
    } catch (error) {
      console.error('Error loading volume setting:', error);
      return 70;
    }
  });
  
  const [currentAlert, setCurrentAlert] = useState<ThreatData | null>(null);
  const [alertHistory, setAlertHistory] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // Safely persist settings to localStorage
  const safelyPersistToStorage = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (error) {
      console.error(`Error persisting ${key} to localStorage:`, error);
    }
  }, []);
  
  useEffect(() => {
    safelyPersistToStorage('sentinel-connection-settings', persistedSettings);
  }, [persistedSettings, safelyPersistToStorage]);
  
  useEffect(() => {
    safelyPersistToStorage('sentinel-sound-enabled', soundEnabled.toString());
  }, [soundEnabled, safelyPersistToStorage]);
  
  useEffect(() => {
    safelyPersistToStorage('sentinel-notifications-enabled', notificationsEnabled.toString());
  }, [notificationsEnabled, safelyPersistToStorage]);
  
  useEffect(() => {
    safelyPersistToStorage('sentinel-sound-volume', soundVolume.toString());
  }, [soundVolume, safelyPersistToStorage]);

  // Initialize audio with proper error handling
  useEffect(() => {
    try {
      audioRef.current = new Audio('/alert.mp3');
      audioRef.current.preload = 'auto';
      
      const handleAudioLoaded = () => {
        setAudioLoaded(true);
      };
      
      const handleAudioError = (e: ErrorEvent) => {
        console.error('Error loading audio:', e);
        setAudioLoaded(false);
      };
      
      if (audioRef.current) {
        audioRef.current.addEventListener('canplaythrough', handleAudioLoaded);
        audioRef.current.addEventListener('error', handleAudioError as EventListener);
      }
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('canplaythrough', handleAudioLoaded);
          audioRef.current.removeEventListener('error', handleAudioError as EventListener);
        }
      };
    } catch (error) {
      console.error('Error initializing audio:', error);
      return () => {};
    }
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
  
  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled]);
  
  // Connect to sources when settings are available and connection is not active
  useEffect(() => {
    if (persistedSettings.apiUrl && persistedSettings.blockchainUrl && !isConnected && !isLoading && !isReconnecting) {
      try {
        connectToSources();
      } catch (error) {
        console.error('Error connecting to sources:', error);
      }
    }
  }, [persistedSettings, isConnected, isLoading, isReconnecting, connectToSources]);
  
  // Establish a reliable polling mechanism for data updates
  useEffect(() => {
    if (isConnected && !isLoading) {
      try {
        const updateData = () => {
          fetchThreatData().catch(err => console.error('Error fetching threat data:', err));
          fetchBlockchainData().catch(err => console.error('Error fetching blockchain data:', err));
        };
        
        // Initial fetch
        updateData();
        
        // Regular polling
        const forcedRefresh = setInterval(updateData, 10000);
        
        return () => clearInterval(forcedRefresh);
      } catch (error) {
        console.error('Error in update effect:', error);
      }
    }
  }, [isConnected, isLoading, fetchThreatData, fetchBlockchainData]);
  
  // Handle high severity threats for alerts
  useEffect(() => {
    if (!threatData.length || !notificationsEnabled) return;
    
    try {
      const highSeverityThreats = threatData
        .filter(threat => 
          threat.severity === 'High' && 
          threat.status !== 'Mitigated' && 
          !alertHistory.includes(threat.id)
        );
      
      if (highSeverityThreats.length > 0) {
        setCurrentAlert(highSeverityThreats[0]);
        setAlertHistory(prev => [...prev, highSeverityThreats[0].id]);
        
        // Play sound for high severity threats if enabled
        if (soundEnabled && audioRef.current && audioLoaded) {
          try {
            audioRef.current.volume = soundVolume / 100;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.error('Error playing audio:', err));
          } catch (error) {
            console.error('Error playing alert sound:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing threats for alerts:', error);
    }
  }, [threatData, notificationsEnabled, alertHistory, soundEnabled, soundVolume, audioLoaded]);
  
  // Safely validate URLs and connect
  const handleConnect = useCallback((apiKey: string, apiUrl: string, blockchainUrl: string) => {
    try {
      // Basic URL validation
      new URL(apiUrl);
      new URL(blockchainUrl);
      
      const newSettings = { apiKey, apiUrl, blockchainUrl };
      setPersistedSettings(newSettings);
      connectToSources();
    } catch (err) {
      console.error("Invalid URL format", err);
    }
  }, [connectToSources]);
  
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);
  
  const handleReset = useCallback(() => {
    const newSettings = { apiKey: '', apiUrl: '', blockchainUrl: '' };
    setPersistedSettings(newSettings);
    disconnect();
  }, [disconnect]);
  
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
                  <div className="md:col-span-12">
                    <ThreatStats {...threatStats} />
                  </div>
                </section>
                
                <section className="dashboard-grid mt-6">
                  <div className="md:col-span-5 h-[500px]">
                    <LiveAttackFeed threats={threatData} />
                  </div>
                  <div className="md:col-span-7 h-[500px]">
                    <ThreatChart threats={threatData} />
                  </div>
                </section>
                
                <section className="dashboard-grid mt-6">
                  <div className="md:col-span-8 h-[400px]">
                    <ThreatMap threats={threatData} />
                  </div>
                  <div className="md:col-span-4">
                    <BlockchainViewer data={blockchainData} />
                  </div>
                </section>

                <section className="mt-6">
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
