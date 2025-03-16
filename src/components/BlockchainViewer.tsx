
import { useEffect, useState } from 'react';
import { Database, Lock, Hash, Clock, FileText } from 'lucide-react';
import { BlockchainData } from '@/hooks/useThreatData';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlockchainViewerProps {
  data: BlockchainData | null;
}

const shortenHash = (hash: string) => {
  if (!hash) return '';
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};

const BlockchainBlock = ({ 
  block, 
  index, 
  isLatest 
}: { 
  block: any; 
  index: number; 
  isLatest: boolean; 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className="blockchain-block"
      style={{ '--index': index } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Database className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm font-medium">
            Block {index === 0 ? 'Genesis' : index}
          </span>
        </div>
        {isLatest && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            Latest
          </span>
        )}
      </div>
      
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center text-muted-foreground">
          <Hash className="h-3.5 w-3.5 mr-1.5" />
          <span className="font-mono">{shortenHash(block.hash)}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          <span>{format(new Date(block.timestamp), 'MMM dd, HH:mm:ss')}</span>
        </div>
        
        <div 
          className={cn(
            "transition-all duration-300 overflow-hidden",
            expanded ? "max-h-96" : "max-h-0"
          )}
        >
          <div className="pt-2 space-y-1.5">
            <div className="flex items-start text-muted-foreground">
              <FileText className="h-3.5 w-3.5 mr-1.5 mt-0.5" />
              <div className="font-mono overflow-hidden">
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(block.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {expanded ? 'Hide details' : 'View details'}
      </button>
      
      {index > 0 && <div className="blockchain-arrow" />}
    </div>
  );
};

const BlockchainViewer = ({ data }: BlockchainViewerProps) => {
  const [visibleBlocks, setVisibleBlocks] = useState(3);
  
  useEffect(() => {
    // Reset visible blocks when data changes
    if (data) {
      setVisibleBlocks(Math.min(3, data.chain.length));
    }
  }, [data]);
  
  if (!data || data.chain.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 text-primary mr-2" />
            Blockchain Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No blockchain data available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect to blockchain source to view immutable threat records
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const displayedBlocks = data.chain.slice(0, visibleBlocks).reverse();
  const hasMoreBlocks = data.chain.length > visibleBlocks;
  
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="h-5 w-5 text-primary mr-2" />
          Blockchain Ledger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            Immutable record of all security events, verified and stored in blockchain
          </p>
        </div>
        
        <div className="space-y-6 mt-4 relative">
          {displayedBlocks.map((block, index) => (
            <BlockchainBlock 
              key={block.hash} 
              block={block} 
              index={data.chain.length - index - 1}
              isLatest={index === 0} 
            />
          ))}
          
          {hasMoreBlocks && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setVisibleBlocks(prev => prev + 3)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Load more blocks ({data.chain.length - visibleBlocks} remaining)
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlockchainViewer;
