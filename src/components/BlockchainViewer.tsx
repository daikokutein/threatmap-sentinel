
import { useEffect, useState } from 'react';
import { Database, Lock, Hash, Clock, FileText, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { BlockchainData } from '@/hooks/useThreatData';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  isLatest,
  totalBlocks
}: { 
  block: any; 
  index: number; 
  isLatest: boolean;
  totalBlocks: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div 
      className="blockchain-block"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut"
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Database className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm font-medium">
            {index === 0 ? 'Genesis Block' : `Block ${totalBlocks - index}`}
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
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden pt-2"
            >
              <div className="space-y-1.5 bg-muted/30 p-2 rounded-md border border-border/50">
                <div className="flex items-start text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 mr-1.5 mt-0.5" />
                  <div className="font-mono overflow-hidden">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(block.data, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {index > 0 && (
                  <div className="flex items-center text-muted-foreground mt-1 pt-1 border-t border-border/30">
                    <Hash className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Prev: </span>
                    <span className="font-mono ml-1">{shortenHash(block.previous_hash)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <button 
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors flex items-center"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            View details
          </>
        )}
      </button>
      
      <div className="blockchain-connection"></div>
    </motion.div>
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
      <Card className="animate-fade-in h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 text-primary mr-2" />
            Blockchain Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-60px)] flex flex-col items-center justify-center">
          <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground text-center">No blockchain data available</p>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Connect to blockchain source to view immutable threat records
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const displayedBlocks = data.chain.slice(0, visibleBlocks).reverse();
  const hasMoreBlocks = data.chain.length > visibleBlocks;
  
  return (
    <Card className="animate-fade-in h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 text-primary mr-2" />
          Blockchain Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            Immutable record of security events verified by blockchain
          </p>
        </div>
        
        <div className="space-y-6 mt-4 relative blockchain-container">
          {displayedBlocks.map((block, index) => (
            <BlockchainBlock 
              key={block.hash} 
              block={block} 
              index={index} 
              isLatest={index === 0}
              totalBlocks={data.chain.length - 1}
            />
          ))}
          
          {hasMoreBlocks && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setVisibleBlocks(prev => prev + 3)}
                className="text-sm bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-md transition-colors"
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
