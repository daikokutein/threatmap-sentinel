
import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { ThreatData } from '@/hooks/useThreatData';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertBannerProps {
  threat: ThreatData;
  onClose: () => void;
  soundEnabled: boolean;
  soundVolume: number;
}

const AlertBanner = ({ threat, onClose, soundEnabled }: AlertBannerProps) => {
  const closeTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Auto-dismiss after 10 seconds
    closeTimeoutRef.current = window.setTimeout(() => {
      onClose();
    }, 10000);
    
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [onClose]);
  
  return (
    <AnimatePresence>
      <motion.div 
        className="alert-banner mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive animate-bounce-light" />
          <div>
            <h3 className="font-medium">
              {threat.attack_type}{' '}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive ml-2">
                High Severity
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Threat detected from {threat.ip} targeting {threat.details.url_path}
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
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner;
