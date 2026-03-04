'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Build } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatDate, formatBytes } from '@/lib/utils';
import { Search, Filter, Trash2, Download, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [builds, setBuilds] = useLocalStorage<Build[]>('builds', []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const filteredBuilds = builds
    .filter((build) => {
      const matchesSearch = build.appName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || build.status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return 0;
    });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this build record?')) {
      setBuilds(builds.filter((b) => b.id !== id));
      toast.success('Build deleted');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL history?')) {
      setBuilds([]);
      toast.success('History cleared');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Build History</h1>
          <p className="text-slate-400">View and manage your past builds.</p>
        </div>
        <Button variant="destructive" onClick={handleClearAll} disabled={builds.length === 0}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear All History
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by app name..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-900/50">
                  <TableHead className="text-slate-400">App Name</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Size</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuilds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      No builds found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuilds.map((build) => (
                    <TableRow key={build.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-200">{build.appName}</TableCell>
                      <TableCell>
                        <Badge variant={build.status === 'success' ? 'success' : build.status === 'failed' ? 'destructive' : 'secondary'}>
                          {build.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">{formatDate(build.date)}</TableCell>
                      <TableCell className="text-slate-400">{build.duration ? formatDuration(build.duration) : '--'}</TableCell>
                      <TableCell className="text-slate-400">{build.apkSize ? formatBytes(build.apkSize) : '--'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/build/${build.id}`}>
                            <Button variant="ghost" size="icon" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {build.status === 'success' && (
                            <Button variant="ghost" size="icon" title="Download APK">
                              <Download className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(build.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
