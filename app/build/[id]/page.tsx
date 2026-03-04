'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

type BuildStatus = {
  status: string;
  conclusion: string | null;
  currentStep: string;
  progress: number;
  duration: string;
  downloadUrl: string | null;
  apkSize: number | null;
  errorMessage: string | null;
};

export default function BuildStatusPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();
        setBuildStatus(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !buildStatus) {
    return (
      <div className="container mx-auto py-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <Clock className="h-12 w-12 animate-pulse text-slate-400 mb-4" />
        <p className="text-lg text-slate-400">Loading build status...</p>
      </div>
    );
  }

  if (!buildStatus) return <div className="container mx-auto py-8 text-center">Build not found</div>;

  const isSuccess = buildStatus.status === 'completed' && buildStatus.conclusion === 'success';
  const isFailed = buildStatus.status === 'completed' && buildStatus.conclusion === 'failure';
  const isInProgress = buildStatus.status === 'in_progress' || buildStatus.status === 'queued';

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Build Status</CardTitle>
              <CardDescription>
                Build ID: {id}
              </CardDescription>
            </div>
            {isSuccess && <CheckCircle2 className="h-8 w-8 text-green-500" />}
            {isFailed && <XCircle className="h-8 w-8 text-red-500" />}
            {isInProgress && <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Message */}
          <div className="text-center">
            {isSuccess && <h2 className="text-xl font-bold text-green-500">Build Successful!</h2>}
            {isFailed && <h2 className="text-xl font-bold text-red-500">Build Failed!</h2>}
            {isInProgress && <h2 className="text-xl font-bold text-blue-500">Building... {buildStatus.duration}</h2>}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Progress</span>
              <span>{buildStatus.progress}%</span>
            </div>
            <Progress value={buildStatus.progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-2 border rounded-md p-4 bg-slate-900/50">
            <div className="flex items-center gap-2">
              {buildStatus.progress >= 10 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border rounded-full border-slate-600" />}
              <span className={buildStatus.progress >= 10 ? 'text-slate-200' : 'text-slate-500'}>Step 1: Build Started</span>
            </div>
            <div className="flex items-center gap-2">
              {buildStatus.progress >= 20 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border rounded-full border-slate-600" />}
              <span className={buildStatus.progress >= 20 ? 'text-slate-200' : 'text-slate-500'}>Step 2: Setting up JDK</span>
            </div>
             <div className="flex items-center gap-2">
              {isInProgress && buildStatus.progress > 20 && buildStatus.progress < 80 ? <Clock className="h-4 w-4 animate-spin text-blue-500" /> : 
               buildStatus.progress >= 80 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border rounded-full border-slate-600" />}
              <span className={buildStatus.progress > 20 ? 'text-slate-200' : 'text-slate-500'}>
                Step 3: Building APK {isInProgress && buildStatus.progress > 20 && buildStatus.progress < 80 && `(Current: ${buildStatus.currentStep})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {buildStatus.progress >= 90 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border rounded-full border-slate-600" />}
              <span className={buildStatus.progress >= 90 ? 'text-slate-200' : 'text-slate-500'}>Step 4: Uploading Artifact</span>
            </div>
             <div className="flex items-center gap-2">
              {isSuccess ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border rounded-full border-slate-600" />}
              <span className={isSuccess ? 'text-slate-200' : 'text-slate-500'}>Step 5: Complete</span>
            </div>
          </div>

          {/* Success Actions */}
          {isSuccess && buildStatus.downloadUrl && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-4 border border-green-500/20 bg-green-500/10 rounded-lg">
                <div>
                  <p className="font-medium text-green-500">APK Ready</p>
                  <p className="text-sm text-slate-400">Size: {(buildStatus.apkSize ? buildStatus.apkSize / 1024 / 1024 : 0).toFixed(2)} MB</p>
                  <p className="text-sm text-slate-400">Duration: {buildStatus.duration}</p>
                </div>
                <a href={buildStatus.downloadUrl} download>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" /> Download APK
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Failure Actions */}
          {isFailed && (
            <div className="pt-4 space-y-4">
              <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg">
                <p className="font-medium text-red-500">Build Failed</p>
                <p className="text-sm text-slate-300 mt-1">{buildStatus.errorMessage || 'Unknown error occurred'}</p>
              </div>
              
              <div className="border rounded-md bg-slate-950">
                <Button 
                  variant="ghost" 
                  className="w-full flex justify-between p-4 hover:bg-slate-900"
                  onClick={() => setLogsOpen(!logsOpen)}
                >
                  <span>View Full Log</span>
                  {logsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {logsOpen && (
                  <div className="p-4 pt-0 border-t border-slate-800">
                    <pre className="text-xs text-slate-400 overflow-x-auto p-2 bg-black rounded whitespace-pre-wrap mt-2">
                      {buildStatus.errorMessage}
                      {'\n\n(Full logs available in GitHub Actions)'}
                    </pre>
                  </div>
                )}
              </div>

              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
