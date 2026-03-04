import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { sendTelegramMessage } from '@/lib/telegram';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const notify = url.searchParams.get('notify') === 'true';
  const appName = url.searchParams.get('appName');
  const lastLogLine = parseInt(url.searchParams.get('lastLogLine') || '0');
  
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return NextResponse.json({ status: 'failed', logs: ['[ERROR] Server configuration missing'] });
    }

    const octokit = new Octokit({ auth: token });

    // Get workflow run status
    const run = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: parseInt(id),
    });

    const status = run.data.status;
    const conclusion = run.data.conclusion;

    // Map GitHub status to our app status
    let appStatus = 'queued';
    if (status === 'in_progress') appStatus = 'building';
    if (status === 'completed') {
      appStatus = conclusion === 'success' ? 'success' : 'failed';
    }

    let logs: string[] = [];
    
    // Fix 2: Real Build Logs
    if (status === 'completed') {
        // Fetch real logs
        try {
            const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
                owner,
                repo,
                run_id: parseInt(id)
            });
            
            // Get the build job (usually the first one or named 'build')
            const buildJob = jobs.data.jobs.find(j => j.name.toLowerCase().includes('build')) || jobs.data.jobs[0];
            
            if (buildJob) {
                const logResponse = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
                    owner,
                    repo,
                    job_id: buildJob.id
                });
                
                const logText = String(logResponse.data);
                const allLines = logText.split('\n');
                
                // If client requested incremental logs, we need to handle that. 
                // However, real logs are huge. Sending full log every time is bad.
                // But since we only fetch when completed, we can send the whole thing once.
                // Or better, we filter relevant lines for the UI.
                
                // For the "fullLog" feature, we might want to return it all.
                // But for the "logs" array used in the UI, let's keep it concise or filtered.
                
                // Let's return the last N lines if it's too big, or just the whole thing if reasonable.
                // GitHub logs can be MBs.
                
                // Strategy:
                // 1. Return "logs" as a filtered summary (what we show in the black box)
                // 2. Return "fullLog" as the complete text (for download/copy)
                // 3. Return "errorSummary" for specific errors
                
                // Filter for UI
                const uiLogs = allLines.filter(line => {
                    const l = line.toLowerCase();
                    return l.includes('error') || l.includes('failed') || l.includes('exception') || 
                           l.includes('task') || l.includes('build') || l.includes('warning');
                });
                
                // If we haven't sent logs yet (lastLogLine === 0), send them.
                // Since we only fetch on completion, we just send them.
                if (lastLogLine === 0 || lastLogLine < uiLogs.length) {
                    logs = uiLogs.slice(lastLogLine);
                }
                
                // Error Summary
                const errorSummary = allLines.filter(line => {
                    const l = line.toLowerCase();
                    return l.includes('error:') || l.includes('failure') || l.includes('build failed');
                });
                
                if (errorSummary.length > 0) {
                    logs.push(...errorSummary.map(e => `[ERROR] ${e}`));
                }

            }
        } catch (e) {
            console.error('Failed to fetch real logs:', e);
            logs.push('[WARN] Could not fetch detailed logs from GitHub.');
        }

        // Clean up temp branch
        try {
             const branchName = run.data.head_branch;
             if (branchName && branchName.startsWith('build-')) {
                 await octokit.rest.git.deleteRef({
                     owner,
                     repo,
                     ref: `heads/${branchName}`
                 });
                 logs.push(`[INFO] Cleaned up temporary branch: ${branchName}`);
             }
         } catch (e) {
             // Ignore
         }
    } else {
        // In progress
        if (lastLogLine === 0) {
            logs.push(`[INFO] Status: ${status}`);
            logs.push(`[INFO] Started at: ${run.data.run_started_at}`);
            if (status === 'in_progress') {
                const elapsed = Date.now() - new Date(run.data.run_started_at || Date.now()).getTime();
                logs.push(`[INFO] Building... ${Math.floor(elapsed / 60000)}m ${Math.floor((elapsed % 60000) / 1000)}s elapsed`);
            }
        }
    }

    let downloadUrl = undefined;
    let apkSize = undefined;

    if (appStatus === 'success') {
      const artifacts = await octokit.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: parseInt(id),
      });

      if (artifacts.data.artifacts.length > 0) {
        downloadUrl = `/api/download/${artifacts.data.artifacts[0].id}`;
        apkSize = artifacts.data.artifacts[0].size_in_bytes;
      }
    }

    if (notify && appName && (appStatus === 'success' || appStatus === 'failed')) {
      const emoji = appStatus === 'success' ? '✅' : '❌';
      const msg = `${emoji} *Build ${appStatus === 'success' ? 'Success' : 'Failed'}*\nApp: ${appName}`;
      await sendTelegramMessage(msg);
    }

    return NextResponse.json({
      status: appStatus,
      step: appStatus === 'queued' ? 1 : appStatus === 'building' ? 3 : 5,
      logs,
      downloadUrl,
      apkSize,
    });

  } catch (error: any) {
    console.error('Status Check Error:', error);
    return NextResponse.json({
      status: 'failed',
      logs: [`[ERROR] ${error.message}`],
    });
  }
}
