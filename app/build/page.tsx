'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

export default function BuildPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    appName: '',
    packageName: 'com.mybuilder.app',
    buildMethod: 'paste',
    mainCode: '',
    layoutCode: '',
    dependencies: '',
    buildType: 'debug',
    minSdk: '24',
    permissions: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/build/${data.buildId}`);
      } else {
        alert('Build failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting build:', error);
      alert('An error occurred while submitting the build.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Build</CardTitle>
          <CardDescription>Configure your Android app build settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appName">App Name</Label>
                <Input
                  id="appName"
                  name="appName"
                  value={formData.appName}
                  onChange={handleChange}
                  required
                  placeholder="My App"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleChange}
                  required
                  placeholder="com.example.app"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainCode">Main Code (Kotlin)</Label>
              <Textarea
                id="mainCode"
                name="mainCode"
                value={formData.mainCode}
                onChange={handleChange}
                required
                placeholder="package com.example.app..."
                className="font-mono h-48"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layoutCode">Layout Code (XML)</Label>
              <Textarea
                id="layoutCode"
                name="layoutCode"
                value={formData.layoutCode}
                onChange={handleChange}
                placeholder="<?xml version='1.0' encoding='utf-8'?>..."
                className="font-mono h-32"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependencies">Dependencies (Gradle)</Label>
              <Textarea
                id="dependencies"
                name="dependencies"
                value={formData.dependencies}
                onChange={handleChange}
                placeholder="implementation 'com.squareup.retrofit2:retrofit:2.9.0'"
                className="font-mono h-24"
              />
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="permissions">Permissions (Comma separated)</Label>
              <Input
                id="permissions"
                name="permissions"
                value={formData.permissions}
                onChange={handleChange}
                placeholder="INTERNET, CAMERA"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Build Type</Label>
                <RadioGroup
                  value={formData.buildType}
                  onValueChange={(val) => handleSelectChange('buildType', val)}
                  className="flex space-x-4"
                >
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
                <Label htmlFor="minSdk">Min SDK</Label>
                <Select
                  value={formData.minSdk}
                  onValueChange={(val) => handleSelectChange('minSdk', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Min SDK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="21">API 21 (Android 5.0)</SelectItem>
                    <SelectItem value="24">API 24 (Android 7.0)</SelectItem>
                    <SelectItem value="26">API 26 (Android 8.0)</SelectItem>
                    <SelectItem value="30">API 30 (Android 11)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Build...
                </>
              ) : (
                'Start Build'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
