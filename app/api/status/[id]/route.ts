import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { sendTelegramMessage } from '@/lib/telegram';

function calculateDuration(startStr: string, endStr?: string) {
  if (!startStr) return '0s';
  const start = new Date(startStr).getTime();
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const notify = url.searchParams.get('notify') === 'true';
  const appName = url.searchParams.get('appName');

  try {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
       return NextResponse.json({ status: 'failed', errorMessage: 'Server configuration missing' });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const run = await octokit.rest.actions.getWorkflowRun({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      run_id: parseInt(id)
    });

    // Get jobs to find current step
    const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      run_id: parseInt(id)
    });

    const currentJob = jobs.data.jobs[0];
    const currentStep = currentJob?.steps?.find(s => s.status === 'in_progress')?.name 
      || currentJob?.steps?.filter(s => s.status === 'completed').pop()?.name
      || 'Starting...';

    // Calculate progress
    let progress = 10;
    if (run.data.status === 'in_progress') {
      const completedSteps = currentJob?.steps?.filter(s => s.status === 'completed').length || 0;
      const totalSteps = currentJob?.steps?.length || 10;
      const safeTotal = totalSteps > 0 ? totalSteps : 10;
      progress = Math.floor((completedSteps / safeTotal) * 80) + 10;
    }
    if (run.data.status === 'completed') progress = 100;

    // Get artifact if success
    let downloadUrl = null;
    let apkSize = null;
    if (run.data.status === 'completed' && run.data.conclusion === 'success') {
      const artifacts = await octokit.rest.actions.listWorkflowRunArtifacts({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        run_id: parseInt(id)
      });
      if (artifacts.data.artifacts.length > 0) {
        downloadUrl = `/api/download/${artifacts.data.artifacts[0].id}`;
        apkSize = artifacts.data.artifacts[0].size_in_bytes;
      }
    }

    // Get error if failed
    let errorMessage = null;
    if (run.data.status === 'completed' && run.data.conclusion === 'failure') {
      // Get failed step
      const failedStep = currentJob?.steps?.find(s => s.conclusion === 'failure');
      errorMessage = failedStep ? `Failed at: ${failedStep.name}` : 'Build failed';
    }

    const duration = calculateDuration(run.data.run_started_at || run.data.created_at, run.data.status === 'completed' ? run.data.updated_at : undefined);

    // Telegram Notification Logic
    if (notify && appName && (run.data.status === 'completed')) {
      const appStatus = run.data.conclusion === 'success' ? 'success' : 'failed';
      const emoji = appStatus === 'success' ? '✅' : '❌';
      const msg = `${emoji} *Build ${appStatus === 'success' ? 'Success' : 'Failed'}*\nApp: ${appName}`;
      await sendTelegramMessage(msg);
    }

    return NextResponse.json({
      status: run.data.status,
      conclusion: run.data.conclusion,
      currentStep: currentStep,
      progress: progress,
      duration: duration,
      downloadUrl: downloadUrl,
      apkSize: apkSize,
      errorMessage: errorMessage
    });

  } catch (error: any) {
    console.error('Status API Error:', error);
    return NextResponse.json({
      status: 'failed',
      errorMessage: error.message || 'Internal Server Error'
    });
  }
}
