
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ThreatStats from '@/components/ThreatStats';
import LiveAttackFeed from '@/components/LiveAttackFeed';
import ThreatMap from '@/components/ThreatMap';
import ConnectionPanel from '@/components/ConnectionPanel';
import BlockchainViewer from '@/components/BlockchainViewer';
import ThreatChart from '@/components/ThreatChart';
import AlertBanner from '@/components/AlertBanner';
import { useThreatData, ThreatData } from '@/hooks/useThreatData';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

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
  
  const { 
    isConnected,
    isLoading,
    error,
    threatData,
    blockchainData,
    threatStats,
    connectToSources,
    disconnect
  } = useThreatData(persistedSettings);
  
  // Auto-connect on load if we have persisted settings
  useEffect(() => {
    if (persistedSettings.apiUrl && persistedSettings.blockchainUrl && !isConnected && !isLoading) {
      connectToSources();
    }
  }, []);
  
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
        <Toaster position="top-right" />
        <Header 
          isConnected={isConnected}
          connectionSettings={persistedSettings}
          onDisconnect={handleDisconnect}
          onReset={handleReset}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
        />
        
        <main className="container mx-auto pt-24 pb-16 px-4 sm:px-6">
          <div className="space-y-6">
            {/* Alert Banner */}
            {currentAlert && (
              <AlertBanner 
                threat={currentAlert} 
                onClose={() => setCurrentAlert(null)} 
                soundEnabled={soundEnabled}
                soundVolume={soundVolume}
              />
            )}
            
            {/* Connection Panel */}
            <section>
              <ConnectionPanel 
                onConnect={handleConnect} 
                isLoading={isLoading} 
                isConnected={isConnected} 
                initialValues={persistedSettings}
              />
            </section>
            
            {/* Stats & Feed */}
            <section className="dashboard-grid">
              <div className="md:col-span-3">
                <ThreatStats {...threatStats} />
              </div>
              <div className="md:col-span-5 h-[500px]">
                <LiveAttackFeed threats={threatData} />
              </div>
              <div className="md:col-span-4 h-[500px]">
                <ThreatChart threats={threatData} />
              </div>
            </section>
            
            {/* Map & Blockchain */}
            <section className="dashboard-grid">
              <div className="md:col-span-8 h-[400px]">
                <ThreatMap threats={threatData} />
              </div>
              <div className="md:col-span-4">
                <BlockchainViewer data={blockchainData} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Index;
