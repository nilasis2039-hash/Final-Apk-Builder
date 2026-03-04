'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Download, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Copy, 
  Clock, 
  FileCode 
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDuration, cn } from '@/lib/utils';
import { Build } from '@/types';

export default function BuildStatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const [build, setBuild] = useState<Build | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll for build status
  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/status/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
             // If API returns 404, try to load from local storage as fallback
             const storedBuilds = JSON.parse(localStorage.getItem('builds') || '[]');
             const localBuild = storedBuilds.find((b: Build) => b.id === id);
             if (localBuild) {
               setBuild(localBuild);
               setLogs(['Waiting for server updates...']);
             } else {
               toast.error('Build not found');
               router.push('/history');
             }
             return;
          }
          throw new Error('Failed to fetch status');
        }
        
        const data = await response.json();
        setBuild(data.build);
        setLogs(data.logs || []);
        setProgress(data.progress || 0);

        // Update local storage
        const storedBuilds = JSON.parse(localStorage.getItem('builds') || '[]');
        const updatedBuilds = storedBuilds.map((b: Build) => 
          b.id === id ? { ...b, ...data.build } : b
        );
        localStorage.setItem('builds', JSON.stringify(updatedBuilds));

        if (data.build.status === 'success' || data.build.status === 'failed') {
          return true; // Stop polling
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
      return false;
    };

    // Initial fetch
    fetchStatus();

    const interval = setInterval(async () => {
      const shouldStop = await fetchStatus();
      if (shouldStop) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [id, router]);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    toast.success('Logs copied to clipboard');
  };

  if (!build) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Build #{build.id.slice(0, 8)}
            <Badge 
              variant={
                build.status === 'success' ? 'success' : 
                build.status === 'failed' ? 'destructive' : 
                'secondary'
              }
              className="ml-2"
            >
              {build.status.toUpperCase()}
            </Badge>
          </h1>
          <p className="text-slate-400 flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3" /> Started {new Date(build.date).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {build.status === 'success' && (
            <a href={`/api/download/${id}`} download>
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" /> Download APK
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Build Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase">App Name</span>
              <p className="text-slate-200 font-medium">{build.appName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase">Package Name</span>
              <p className="text-slate-200 font-mono text-sm">{build.packageName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase">Duration</span>
              <p className="text-slate-200">{build.duration ? formatDuration(build.duration) : '--'}</p>
            </div>
            
            {build.status === 'building' && (
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Console */}
        <Card className="bg-slate-950 border-slate-800 lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-sm font-mono text-slate-300">Build Output</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={copyLogs} className="h-8 text-xs">
              <Copy className="mr-2 h-3 w-3" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative overflow-hidden">
            <div 
              ref={scrollRef}
              className="absolute inset-0 overflow-y-auto p-4 font-mono text-xs space-y-1"
            >
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Initializing build environment...</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-2 group">
                    <span className="text-slate-600 select-none w-6 text-right shrink-0">{index + 1}</span>
                    <span className={cn(
                      "break-all whitespace-pre-wrap",
                      log.toLowerCase().includes('error') || log.toLowerCase().includes('failed') ? "text-red-400" :
                      log.toLowerCase().includes('success') ? "text-green-400" :
                      log.toLowerCase().includes('warning') ? "text-yellow-400" :
                      "text-slate-300"
                    )}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
