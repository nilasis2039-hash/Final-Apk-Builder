'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  CheckCircle2,
  Clock,
  Plus,
  History,
  AlertCircle,
  Rocket,
} from 'lucide-react';
import { Build } from '@/types';
import { formatDuration, formatDate, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedBuilds = localStorage.getItem('builds');
    if (storedBuilds) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setBuilds(JSON.parse(storedBuilds));
    }
    setLoading(false);
  }, []);

  const totalBuilds = builds.length;
  const successBuilds = builds.filter((b) => b.status === 'success').length;
  const successRate = totalBuilds > 0 ? Math.round((successBuilds / totalBuilds) * 100) : 0;
  
  const avgTime =
    builds.length > 0
      ? builds.reduce((acc, curr) => acc + (curr.duration || 0), 0) / builds.length
      : 0;

  const recentBuilds = [...builds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-400">Welcome back! Ready to build some apps?</p>
        </div>
        <div className="flex gap-2">
          <Link href="/build">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" /> New Build
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" /> View History
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              Total Builds
            </CardTitle>
            <Rocket className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalBuilds}</div>
            <p className="text-xs text-slate-400">Lifetime builds</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              Success Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{successRate}%</div>
            <p className="text-xs text-slate-400">
              {successBuilds} successful builds
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              Avg. Build Time
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatDuration(avgTime)}
            </div>
            <p className="text-xs text-slate-400">Per build average</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">Recent Builds</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBuilds.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No builds yet. Start your first build!
            </div>
          ) : (
            <div className="space-y-4">
              {recentBuilds.map((build, index) => (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        build.status === 'success'
                          ? 'bg-green-500/10 text-green-500'
                          : build.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      )}
                    >
                      {build.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : build.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{build.appName}</h4>
                      <p className="text-sm text-slate-400">
                        {formatDate(build.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 hidden md:inline-block">
                      {build.duration ? formatDuration(build.duration) : '--'}
                    </span>
                    <Link href={`/build/${build.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
