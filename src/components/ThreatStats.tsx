
import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface ThreatStatsProps {
  total: number;
  high: number;
  medium: number;
  low: number;
  mitigated: number;
  active: number;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  delay 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  iconColor: string; 
  delay: number; 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-500 transform",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${iconColor}/10`}>
            <Icon className={`h-5 w-5 text-${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BarIndicator = ({ percentage, color }: { percentage: number; color: string }) => (
  <div className="relative h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
    <div
      className={`absolute left-0 top-0 h-full bg-${color} transition-all duration-1000 ease-out`}
      style={{ width: `${percentage}%` }}
    />
  </div>
);

const ThreatStats = ({ total, high, medium, low, mitigated, active }: ThreatStatsProps) => {
  const [showPercentage, setShowPercentage] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPercentage(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const calculatePercentage = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  
  const highPercentage = calculatePercentage(high);
  const mediumPercentage = calculatePercentage(medium);
  const lowPercentage = calculatePercentage(low);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">Threat Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total Threats" 
            value={total} 
            icon={Shield} 
            iconColor="primary" 
            delay={100} 
          />
          <StatCard 
            title="Active Threats" 
            value={active} 
            icon={AlertTriangle} 
            iconColor="severity-high" 
            delay={200} 
          />
          <StatCard 
            title="Mitigated" 
            value={mitigated} 
            icon={CheckCircle} 
            iconColor="severity-low" 
            delay={300} 
          />
        </div>
      </div>
      
      <div className="glass-card p-4 rounded-lg animate-fade-in">
        <h3 className="text-sm font-medium mb-4">Severity Distribution</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-severity-high mr-2" />
              <span className="text-sm">High</span>
            </div>
            <span className="text-sm">{high}</span>
          </div>
          <BarIndicator percentage={showPercentage ? highPercentage : 0} color="severity-high" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-severity-medium mr-2" />
              <span className="text-sm">Medium</span>
            </div>
            <span className="text-sm">{medium}</span>
          </div>
          <BarIndicator percentage={showPercentage ? mediumPercentage : 0} color="severity-medium" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-severity-low mr-2" />
              <span className="text-sm">Low</span>
            </div>
            <span className="text-sm">{low}</span>
          </div>
          <BarIndicator percentage={showPercentage ? lowPercentage : 0} color="severity-low" />
        </div>
      </div>
    </div>
  );
};

export default ThreatStats;
