
import { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  LucideIcon, 
  Settings, 
  Volume2, 
  VolumeX, 
  Link2, 
  LogOut, 
  RotateCcw 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/components/theme-provider';

interface SettingsTabProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SettingsTab = ({ icon: Icon, label, active, onClick }: SettingsTabProps) => (
  <button 
    className={`settings-tab ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

interface SettingsPanelProps {
  connectionSettings: {
    apiKey: string;
    apiUrl: string;
    blockchainUrl: string;
  };
  isConnected: boolean;
  onDisconnect: () => void;
  onReset: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
}

const SettingsPanel = ({
  connectionSettings,
  isConnected,
  onDisconnect,
  onReset,
  soundEnabled,
  setSoundEnabled,
  notificationsEnabled,
  setNotificationsEnabled,
  soundVolume,
  setSoundVolume
}: SettingsPanelProps) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex mt-4">
          <div className="w-1/4 space-y-2 pr-4 border-r border-border">
            <SettingsTab 
              icon={Bell} 
              label="General" 
              active={activeTab === 'general'} 
              onClick={() => setActiveTab('general')} 
            />
            <SettingsTab 
              icon={Link2} 
              label="Connection" 
              active={activeTab === 'connection'} 
              onClick={() => setActiveTab('connection')} 
            />
          </div>
          
          <div className="w-3/4 pl-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Theme</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Enable Notifications
                      </Label>
                      <Switch 
                        id="notifications" 
                        checked={notificationsEnabled} 
                        onCheckedChange={setNotificationsEnabled} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Show alerts when new threats are detected
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Sound Alerts</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound-toggle" className="flex items-center gap-2">
                        {soundEnabled ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <VolumeX className="h-4 w-4" />
                        )}
                        Enable Sound Alerts
                      </Label>
                      <Switch 
                        id="sound-toggle" 
                        checked={soundEnabled} 
                        onCheckedChange={setSoundEnabled} 
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Label htmlFor="sound-volume" className="text-xs text-muted-foreground pb-2 block">
                        Alert Volume
                      </Label>
                      <div className="flex items-center gap-4">
                        <VolumeX className="h-3 w-3 text-muted-foreground" />
                        <Slider
                          id="sound-volume"
                          defaultValue={[soundVolume]}
                          max={100}
                          step={1}
                          disabled={!soundEnabled}
                          onValueChange={(value) => setSoundVolume(value[0])}
                          className="flex-1"
                        />
                        <Volume2 className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'connection' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Connection Status</h3>
                  <div className="p-4 rounded-md bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                      </div>
                    </div>
                    
                    {isConnected && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">API URL</span>
                          <span className="text-sm font-mono truncate max-w-[250px]">{connectionSettings.apiUrl}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Blockchain URL</span>
                          <span className="text-sm font-mono truncate max-w-[250px]">{connectionSettings.blockchainUrl}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Connection Actions</h3>
                  <div className="flex flex-col gap-2">
                    {isConnected && (
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={onDisconnect}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={onReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Connection Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;
