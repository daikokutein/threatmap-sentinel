
import { useEffect, useState } from 'react';
import { Shield, Bell, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import SettingsPanel from '@/components/SettingsPanel';

interface HeaderProps {
  isConnected: boolean;
  connectionSettings: {
    apiKey: string;
    apiUrl: string;
    blockchainUrl: string;
  };
  onDisconnect: () => void;
  onReset: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
}

const Header = ({ 
  isConnected,
  connectionSettings,
  onDisconnect,
  onReset,
  soundEnabled,
  setSoundEnabled,
  notificationsEnabled,
  setNotificationsEnabled,
  soundVolume,
  setSoundVolume
}: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 flex items-center justify-between",
      scrolled ? "dark-nav" : "bg-transparent"
    )}>
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-medium tracking-tight">Sentinel</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <time className="text-sm text-muted-foreground hidden md:block">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5" />
          {isConnected && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse-subtle" />}
        </button>
        
        <SettingsPanel 
          connectionSettings={connectionSettings}
          isConnected={isConnected}
          onDisconnect={onDisconnect}
          onReset={onReset}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
        />
        
        <button className="p-2 rounded-full hover:bg-secondary transition-colors md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
