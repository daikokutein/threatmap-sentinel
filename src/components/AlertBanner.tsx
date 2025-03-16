
import { useEffect, useState } from 'react';
import { X, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { ThreatData } from '@/hooks/useThreatData';
import { Button } from '@/components/ui/button';

interface AlertBannerProps {
  threat: ThreatData;
  onClose: () => void;
  soundEnabled: boolean;
  soundVolume: number;
}

const AlertBanner = ({ threat, onClose, soundEnabled, soundVolume }: AlertBannerProps) => {
  const [audioPlayed, setAudioPlayed] = useState(false);
  
  useEffect(() => {
    if (soundEnabled && !audioPlayed) {
      const audio = new Audio('/alert.mp3');
      audio.volume = soundVolume / 100;
      audio.play().catch(error => {
        console.error('Failed to play alert sound:', error);
      });
      setAudioPlayed(true);
    }
    
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [onClose, soundEnabled, audioPlayed, soundVolume]);
  
  return (
    <div className="alert-banner mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive animate-bounce-light" />
        <div>
          <h3 className="font-medium">{threat.attack_type}</h3>
          <p className="text-sm text-muted-foreground">
            High severity attack detected from {threat.ip}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {soundEnabled ? (
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AlertBanner;
