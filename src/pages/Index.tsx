
import { useState } from 'react';
import Header from '@/components/Header';
import ThreatStats from '@/components/ThreatStats';
import LiveAttackFeed from '@/components/LiveAttackFeed';
import ThreatMap from '@/components/ThreatMap';
import ConnectionPanel from '@/components/ConnectionPanel';
import BlockchainViewer from '@/components/BlockchainViewer';
import { useThreatData } from '@/hooks/useThreatData';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  const [connectionSettings, setConnectionSettings] = useState({
    apiKey: '',
    apiUrl: '',
    blockchainUrl: '',
  });
  
  const { 
    isConnected,
    isLoading,
    error,
    threatData,
    blockchainData,
    threatStats,
    connectToSources
  } = useThreatData(connectionSettings);
  
  const handleConnect = (apiKey: string, apiUrl: string, blockchainUrl: string) => {
    setConnectionSettings({ apiKey, apiUrl, blockchainUrl });
    connectToSources();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Toaster position="top-right" />
      <Header />
      
      <main className="container mx-auto pt-24 pb-16 px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8">
          {/* Connection Panel */}
          <section>
            <ConnectionPanel 
              onConnect={handleConnect} 
              isLoading={isLoading} 
              isConnected={isConnected} 
            />
          </section>
          
          {/* Stats & Feed */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <ThreatStats {...threatStats} />
            </div>
            <div className="md:col-span-2 h-[500px]">
              <LiveAttackFeed threats={threatData} />
            </div>
          </section>
          
          {/* Map & Blockchain */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 h-[400px]">
              <ThreatMap threats={threatData} />
            </div>
            <div className="md:col-span-1">
              <BlockchainViewer data={blockchainData} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
