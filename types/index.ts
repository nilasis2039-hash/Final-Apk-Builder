export type BuildStatus = 'queued' | 'building' | 'success' | 'failed';

export interface Build {
  id: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  status: BuildStatus;
  date: string; // ISO string
  duration?: number; // milliseconds
  apkSize?: number; // bytes
  downloadUrl?: string;
  error?: string;
  logs?: string[];
  settings: BuildSettings;
  step: number; // 0-5
}

export interface BuildSettings {
  minSdk: number;
  targetSdk: number;
  buildType: 'debug' | 'release';
  orientation: 'portrait' | 'landscape' | 'both';
  permissions: string[];
  themeColor: string;
  githubRepo?: string;
  githubBranch?: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  files: Record<string, string>; // filename -> content
}

export interface UserSettings {
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  defaultMinSdk: number;
  defaultBuildType: 'debug' | 'release';
}
