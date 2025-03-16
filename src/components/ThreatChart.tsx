
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ThreatData } from '@/hooks/useThreatData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, BarChartIcon } from 'lucide-react';
import { format, subHours } from 'date-fns';

interface ThreatChartProps {
  threats: ThreatData[];
}

const ThreatChart = ({ threats }: ThreatChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!threats.length) return;
    
    // Generate time slots for the last 12 hours
    const timeSlots = Array.from({ length: 12 }, (_, i) => {
      const date = subHours(new Date(), 11 - i);
      return {
        hour: format(date, 'HH:00'),
        high: 0,
        medium: 0,
        low: 0,
        timestamp: date,
      };
    });
    
    // Count threats by severity for each hour
    threats.forEach(threat => {
      const threatTime = new Date(threat.timestamp);
      const slotIndex = timeSlots.findIndex(slot => {
        const slotTime = slot.timestamp;
        const nextSlotTime = new Date(slotTime);
        nextSlotTime.setHours(slotTime.getHours() + 1);
        return threatTime >= slotTime && threatTime < nextSlotTime;
      });
      
      if (slotIndex !== -1) {
        if (threat.severity === 'High') timeSlots[slotIndex].high++;
        else if (threat.severity === 'Medium') timeSlots[slotIndex].medium++;
        else if (threat.severity === 'Low') timeSlots[slotIndex].low++;
      }
    });
    
    setChartData(timeSlots);
  }, [threats]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((acc: number, item: any) => acc + item.value, 0);
      
      return (
        <div className="glass-card p-3 border border-border shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}
              </span>
              <span className="font-mono">{entry.value}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs font-medium">
            <span>Total</span>
            <span>{total}</span>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Threat Activity</CardTitle>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center">
            <span>View Details</span>
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-[240px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  align="right" 
                  verticalAlign="top"
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', marginTop: '-10px' }}
                />
                <Bar dataKey="high" name="High" stackId="a" fill="#FF3B30" radius={[2, 2, 0, 0]} maxBarSize={30} />
                <Bar dataKey="medium" name="Medium" stackId="a" fill="#FF9500" radius={[2, 2, 0, 0]} maxBarSize={30} />
                <Bar dataKey="low" name="Low" stackId="a" fill="#34C759" radius={[2, 2, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground">
            <BarChartIcon className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThreatChart;
