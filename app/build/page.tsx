'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileCode, 
  Github, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Smartphone, 
  Settings, 
  Palette, 
  Shield, 
  Type,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import JSZip from 'jszip';

function NewBuildForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  // Tab State
  const [activeTab, setActiveTab] = useState('upload');

  // Upload Tab State
  const [file, setFile] = useState<File | null>(null);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);

  // Paste Code Tab State
  const [mainActivityCode, setMainActivityCode] = useState(`package com.example.myapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}`);
  const [activityMainXml, setActivityMainXml] = useState(`<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello World!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>`);
  const [extraFiles, setExtraFiles] = useState<{ name: string; content: string }[]>([]);
  const [dependencies, setDependencies] = useState('');

  // GitHub Tab State
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');

  // Shared Settings State
  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [versionCode, setVersionCode] = useState('1');
  const [versionName, setVersionName] = useState('1.0.0');
  const [appIcon, setAppIcon] = useState<File | null>(null);
  const [appIconPreview, setAppIconPreview] = useState<string | null>(null);
  const [buildType, setBuildType] = useState('debug');
  const [minSdk, setMinSdk] = useState('24');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState('#6200EE');
  const [orientation, setOrientation] = useState('portrait');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Auto-generate package name
  useEffect(() => {
    if (appName) {
      const sanitized = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
      setPackageName(`com.example.${sanitized}`);
    }
  }, [appName]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setFile(selectedFile);
      
      // Preview ZIP contents
      try {
        const zip = new JSZip();
        const content = await zip.loadAsync(selectedFile);
        const files: string[] = [];
        content.forEach((relativePath) => {
          if (!relativePath.endsWith('/')) {
            files.push(relativePath);
          }
        });
        setPreviewFiles(files.slice(0, 10)); // Show first 10 files
      } catch (e) {
        console.error('Failed to parse ZIP', e);
        toast.error('Invalid ZIP file');
        setFile(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    maxFiles: 1,
  });

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAppIcon(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExtraFile = () => {
    setExtraFiles([...extraFiles, { name: '', content: '' }]);
  };

  const handleRemoveExtraFile = (index: number) => {
    const newFiles = [...extraFiles];
    newFiles.splice(index, 1);
    setExtraFiles(newFiles);
  };

  const handleExtraFileChange = (index: number, field: 'name' | 'content', value: string) => {
    const newFiles = [...extraFiles];
    newFiles[index][field] = value;
    setExtraFiles(newFiles);
  };

  const togglePermission = (permission: string) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'upload' && !file && !templateId) {
      toast.error('Please upload a project ZIP or select a template');
      return;
    }

    if (activeTab === 'github' && !githubRepoUrl) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (!appName || !packageName) {
      toast.error('App Name and Package Name are required');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('buildMethod', activeTab);
      formData.append('appName', appName);
      formData.append('packageName', packageName);
      formData.append('versionCode', versionCode);
      formData.append('versionName', versionName);
      formData.append('buildType', buildType);
      formData.append('minSdk', minSdk);
      formData.append('themeColor', themeColor);
      formData.append('orientation', orientation);
      formData.append('permissions', JSON.stringify(permissions));

      if (appIcon) {
        formData.append('appIcon', appIcon);
      }

      if (activeTab === 'upload') {
        if (file) formData.append('file', file);
        if (templateId) formData.append('templateId', templateId);
      } else if (activeTab === 'paste') {
        formData.append('mainActivityCode', mainActivityCode);
        formData.append('activityMainXml', activityMainXml);
        formData.append('dependencies', dependencies);
        formData.append('extraFiles', JSON.stringify(extraFiles));
      } else if (activeTab === 'github') {
        formData.append('githubRepoUrl', githubRepoUrl);
        formData.append('githubBranch', githubBranch);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/build', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Build failed to start');
      }

      const data = await response.json();
      toast.success('Build started successfully!');
      
      // Store build in local storage
      const existingBuilds = JSON.parse(localStorage.getItem('builds') || '[]');
      const newBuild = {
        id: data.buildId,
        appName,
        packageName,
        versionName,
        versionCode: parseInt(versionCode),
        status: 'building',
        date: new Date().toISOString(),
        progress: 0,
        step: 0,
        settings: {
          minSdk: parseInt(minSdk),
          targetSdk: 34,
          buildType,
          orientation,
          permissions,
          themeColor,
        }
      };
      localStorage.setItem('builds', JSON.stringify([newBuild, ...existingBuilds]));

      router.push(`/build/${data.buildId}`);
    } catch (error: any) {
      toast.error(error.message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Build</h1>
        <p className="text-slate-400">Create a new Android application build.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload ZIP
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" /> Paste Code
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" /> GitHub Link
            </TabsTrigger>
          </TabsList>
          
          {/* TAB 1: Upload ZIP */}
          <TabsContent value="upload" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Upload Project</CardTitle>
                <CardDescription>Upload a ZIP file containing your Android project.</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                    isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-slate-800">
                      <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-200">
                        {isDragActive ? 'Drop the ZIP here' : 'Drag & drop project ZIP'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Or click to select file (Max 50MB)
                      </p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 bg-slate-950 rounded-lg p-4 border border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-purple-400" />
                          <span className="font-medium text-slate-200">{file.name}</span>
                          <span className="text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setPreviewFiles([]);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {previewFiles.length > 0 && (
                        <div className="mt-2 pl-7">
                          <p className="text-xs text-slate-500 mb-1">Contents preview:</p>
                          <ul className="text-xs text-slate-400 space-y-1 font-mono">
                            {previewFiles.map((f, i) => (
                              <li key={i} className="truncate">{f}</li>
                            ))}
                            {previewFiles.length === 10 && <li>...</li>}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Paste Code */}
          <TabsContent value="paste" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Paste Code</CardTitle>
                <CardDescription>Directly paste your Kotlin and XML code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mainActivity">MainActivity.kt</Label>
                  <Textarea
                    id="mainActivity"
                    value={mainActivityCode}
                    onChange={(e) => setMainActivityCode(e.target.value)}
                    className="font-mono text-xs bg-slate-950 min-h-[200px]"
                    placeholder="Paste MainActivity.kt content here..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="activityMain">activity_main.xml</Label>
                  <Textarea
                    id="activityMain"
                    value={activityMainXml}
                    onChange={(e) => setActivityMainXml(e.target.value)}
                    className="font-mono text-xs bg-slate-950 min-h-[200px]"
                    placeholder="Paste activity_main.xml content here..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dependencies">Dependencies (build.gradle.kts)</Label>
                  <Textarea
                    id="dependencies"
                    value={dependencies}
                    onChange={(e) => setDependencies(e.target.value)}
                    className="font-mono text-xs bg-slate-950 min-h-[100px]"
                    placeholder="implementation(\&quot;com.example:library:1.0.0\&quot;)..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Extra Files</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddExtraFile}>
                      <Plus className="h-4 w-4 mr-2" /> Add File
                    </Button>
                  </div>
                  
                  {extraFiles.map((file, index) => (
                    <div key={index} className="space-y-2 p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Filename (e.g., MyClass.kt)"
                          value={file.name}
                          onChange={(e) => handleExtraFileChange(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveExtraFile(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="File content..."
                        value={file.content}
                        onChange={(e) => handleExtraFileChange(index, 'content', e.target.value)}
                        className="font-mono text-xs bg-slate-950 min-h-[150px]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: GitHub Link */}
          <TabsContent value="github" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>GitHub Repository</CardTitle>
                <CardDescription>Clone and build directly from a GitHub repository.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repoUrl">Repository URL</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="repoUrl"
                      placeholder="https://github.com/username/repo"
                      className="pl-10"
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch Name</Label>
                  <Input
                    id="branch"
                    placeholder="main"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SHARED SETTINGS */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Build Configuration
            </CardTitle>
            <CardDescription>Configure your app settings. These apply to all build methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* App Identity */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="appName"
                    placeholder="My Awesome App"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="packageName"
                    placeholder="com.example.myapp"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="versionName">Version Name</Label>
                    <Input
                      id="versionName"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="versionCode">Version Code</Label>
                    <Input
                      id="versionCode"
                      type="number"
                      value={versionCode}
                      onChange={(e) => setVersionCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* App Icon & Theme */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>App Icon</Label>
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                      {appIconPreview ? (
                        <img src={appIconPreview} alt="App Icon" className="h-full w-full object-cover" />
                      ) : (
                        <Smartphone className="h-8 w-8 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Recommended: 512x512 PNG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="themeColor"
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-12 h-10 p-1 bg-slate-950 border-slate-800"
                    />
                    <Input
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
              {/* Build Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <Layers className="h-4 w-4" /> Build Settings
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Build Type</Label>
                    <RadioGroup value={buildType} onValueChange={setBuildType} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debug" id="debug" />
                        <Label htmlFor="debug">Debug</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="release" id="release" />
                        <Label htmlFor="release">Release</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Min SDK</Label>
                    <Select value={minSdk} onValueChange={setMinSdk}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Min SDK" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 14 }, (_, i) => i + 21).map((sdk) => (
                          <SelectItem key={sdk} value={sdk.toString()}>
                            API {sdk} (Android {sdk >= 29 ? '10+' : sdk >= 28 ? '9' : sdk >= 26 ? '8' : sdk >= 24 ? '7' : '5+'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select value={orientation} onValueChange={setOrientation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <Shield className="h-4 w-4" /> Permissions
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'internet', label: 'Internet Access' },
                    { id: 'camera', label: 'Camera' },
                    { id: 'storage', label: 'Storage (Read/Write)' },
                    { id: 'location', label: 'Location (GPS)' },
                    { id: 'microphone', label: 'Microphone' },
                    { id: 'bluetooth', label: 'Bluetooth' },
                  ].map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={perm.id} 
                        checked={permissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Label htmlFor={perm.id} className="cursor-pointer">{perm.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Preparing Build...</span>
                  <span className="text-slate-200">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-slate-800 pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 min-w-[150px] text-lg py-6"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  BUILD APK
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function NewBuildPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>}>
      <NewBuildForm />
    </Suspense>
  );
}
