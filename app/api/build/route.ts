import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      appName,
      packageName,
      buildMethod,
      mainCode,
      layoutCode,
      dependencies,
      buildType,
      minSdk,
      permissions
    } = body;

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      return NextResponse.json(
        { success: false, error: 'GitHub configuration missing' },
        { status: 500 }
      );
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1. Take raw code from frontend (NOT base64) - handled by body parsing
    // 2. Convert to base64 in API
    const mainCodeBase64 = Buffer.from(mainCode || '').toString('base64');
    const layoutCodeBase64 = layoutCode ? Buffer.from(layoutCode).toString('base64') : '';

    // 3. Send to GitHub with EXACT input names
    await octokit.rest.actions.createWorkflowDispatch({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workflow_id: 'build.yml',
      ref: 'main',
      inputs: {
        appName: appName || "MyApp",
        packageName: packageName || "com.mybuilder.app",
        buildMethod: buildMethod || "paste",
        main_code: mainCodeBase64,
        layout_code: layoutCodeBase64,
        dependencies: dependencies || "",
        buildType: buildType || "debug",
        minSdk: minSdk || "24",
        permissions: permissions || ""
      }
    });

    // 4. Return the workflow run_id to frontend
    // Wait 3 seconds then get the run ID
    await new Promise(r => setTimeout(r, 3000));
    
    const runs = await octokit.rest.actions.listWorkflowRuns({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workflow_id: 'build.yml',
      per_page: 1
    });
    
    const runId = runs.data.workflow_runs[0]?.id;

    if (!runId) {
       return NextResponse.json(
        { success: false, error: 'Failed to start build' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, buildId: runId });

  } catch (error: any) {
    console.error('Build API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
