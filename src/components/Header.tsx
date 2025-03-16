
import { useEffect, useState } from 'react';
import { Shield, Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
      scrolled ? "backdrop-blur-md bg-white/80 dark:bg-gray-900/80 shadow-sm" : "bg-transparent"
    )}>
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-medium tracking-tight">Sentinel</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <time className="text-sm text-muted-foreground hidden md:block">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
        
        <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse-subtle" />
        </button>
        
        <button className="p-2 rounded-full hover:bg-secondary transition-colors md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
