'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UserSettings } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Github, Send, Settings as SettingsIcon, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const defaultSettings: UserSettings = {
  defaultMinSdk: 24,
  defaultBuildType: 'debug',
};

export default function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<UserSettings>('userSettings', defaultSettings);
  const [builds, setBuilds] = useLocalStorage<any[]>('builds', []);
  const [envStatus, setEnvStatus] = useState<{ github: boolean; telegram: boolean } | null>(null);

  const handleSave = () => {
    setSettings(settings);
    toast.success('Settings saved successfully');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This includes build history and settings.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const checkEnvStatus = async () => {
    try {
      const res = await fetch('/api/check-env');
      const data = await res.json();
      setEnvStatus(data);
      if (data.github) toast.success('GitHub environment variables are set');
      else toast.error('GitHub environment variables are missing');
      
      if (data.telegram) toast.success('Telegram environment variables are set');
      else toast.error('Telegram environment variables are missing');
    } catch (error) {
      toast.error('Failed to check environment status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400">Manage your configuration and preferences.</p>
      </div>

      <Tabs defaultValue="github" className="space-y-4">
        <TabsList>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="github">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" /> GitHub Configuration
              </CardTitle>
              <CardDescription>
                Configure your GitHub Personal Access Token via environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg text-yellow-200 text-sm">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <AlertTriangle className="w-4 h-4" /> Security Notice
                </div>
                <p>
                  For security reasons, GitHub tokens must be configured in your server environment variables.
                  Please add the following to your <code>.env.local</code> file:
                </p>
                <pre className="mt-2 p-2 bg-black/50 rounded text-xs font-mono">
                  GITHUB_TOKEN=ghp_...{'\n'}
                  GITHUB_OWNER=username{'\n'}
                  GITHUB_REPO=repo-name
                </pre>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950">
                <div>
                  <p className="font-medium text-white">Environment Status</p>
                  <p className="text-sm text-slate-400">
                    {envStatus?.github ? '✅ Configured' : '❌ Not Configured'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={checkEnvStatus}>
                  Check Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" /> Telegram Notifications
              </CardTitle>
              <CardDescription>
                Configure Telegram via environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg text-yellow-200 text-sm">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <AlertTriangle className="w-4 h-4" /> Security Notice
                </div>
                <p>
                  Please add the following to your <code>.env.local</code> file:
                </p>
                <pre className="mt-2 p-2 bg-black/50 rounded text-xs font-mono">
                  TELEGRAM_BOT_TOKEN=123456:ABC...{'\n'}
                  TELEGRAM_CHAT_ID=123456789
                </pre>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950">
                <div>
                  <p className="font-medium text-white">Environment Status</p>
                  <p className="text-sm text-slate-400">
                    {envStatus?.telegram ? '✅ Configured' : '❌ Not Configured'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={checkEnvStatus}>
                  Check Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" /> Default Build Settings
              </CardTitle>
              <CardDescription>
                Set your preferred defaults for new builds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minSdk">Default Min SDK</Label>
                <Input
                  id="minSdk"
                  type="number"
                  min="21"
                  max="34"
                  value={settings.defaultMinSdk}
                  onChange={(e) => setSettings({ ...settings, defaultMinSdk: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card className="bg-slate-900 border-slate-800 border-red-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Trash2 className="w-5 h-5" /> Danger Zone
              </CardTitle>
              <CardDescription>
                Manage your local data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950">
                <div>
                  <p className="font-medium text-white">Total Builds Stored</p>
                  <p className="text-sm text-slate-400">{builds.length} builds</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="destructive" onClick={handleClearData}>Clear All Data</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
