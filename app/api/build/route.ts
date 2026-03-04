import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    let buildMethod = formData.get('buildMethod') as string || 'zip';
    if (buildMethod === 'upload') buildMethod = 'zip';

    const appName = formData.get('appName') as string;
    const packageName = formData.get('packageName') as string;
    
    // 1. Validate Input based on Build Method
    if (!appName || !packageName) {
      return NextResponse.json(
        { error: 'App Name and Package Name are required' },
        { status: 400 }
      );
    }

    if (buildMethod === 'zip') {
      const file = formData.get('file') as File | null;
      const templateId = formData.get('templateId') as string;
      if (!file && !templateId) {
        return NextResponse.json(
          { error: 'Please upload a project ZIP or select a template' },
          { status: 400 }
        );
      }
    } else if (buildMethod === 'paste') {
      const mainActivityCode = formData.get('mainActivityCode') as string;
      const activityMainXml = formData.get('activityMainXml') as string;
      if (!mainActivityCode || !activityMainXml) {
        return NextResponse.json(
          { error: 'MainActivity.kt and activity_main.xml are required' },
          { status: 400 }
        );
      }
    } else if (buildMethod === 'github') {
      const githubRepoUrl = formData.get('githubRepoUrl') as string;
      if (!githubRepoUrl) {
        return NextResponse.json(
          { error: 'GitHub Repository URL is required' },
          { status: 400 }
        );
      }
    }

    // 2. Check GitHub Configuration
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      // If no GitHub config, return a mock ID for demo purposes
      console.warn('GitHub configuration missing. Returning mock build ID.');
      return NextResponse.json({ 
        message: 'Build started (Simulation)', 
        buildId: 'mock-' + Date.now().toString()
      });
    }

    const octokit = new Octokit({ auth: token });

    // 3. Trigger GitHub Workflow
    // We'll look for a workflow file. Usually 'android.yml' or 'build.yml'
    const workflows = await octokit.rest.actions.listRepoWorkflows({ owner, repo });
    const workflow = workflows.data.workflows.find(w => 
      w.name.toLowerCase().includes('android') || 
      w.name.toLowerCase().includes('build') ||
      w.path.includes('android')
    );

    if (!workflow) {
       return NextResponse.json(
        { error: 'No suitable GitHub Workflow found in the repository.' },
        { status: 404 }
      );
    }

    // Prepare inputs for the workflow
    const mainActivityCode = formData.get('mainActivityCode') as string || '';
    const activityMainXml = formData.get('activityMainXml') as string || '';
    const dependencies = formData.get('dependencies') as string || '';
    const buildType = formData.get('buildType') as string || 'debug';
    const minSdk = formData.get('minSdk') as string || '24';
    const permissionsJson = formData.get('permissions') as string;
    
    let permissions = '';
    try {
      const perms = JSON.parse(permissionsJson);
      if (Array.isArray(perms)) {
        permissions = perms.join(',');
      }
    } catch (e) {
      permissions = permissionsJson || '';
    }

    // Trigger the workflow with EXACT input names
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflow.id,
      ref: 'main', // or master, depending on default branch
      inputs: {
        appName,
        packageName,
        buildMethod,
        main_code: Buffer.from(mainActivityCode).toString('base64'),
        layout_code: Buffer.from(activityMainXml).toString('base64'),
        dependencies: dependencies || "",
        buildType: buildType || "debug",
        minSdk: minSdk || "24",
        permissions: permissions || ""
      }
    });

    // 4. Get the Run ID
    // Wait a moment for GitHub to create the run
    await new Promise(resolve => setTimeout(resolve, 2000));

    const runs = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflow.id,
      per_page: 1,
    });

    const latestRun = runs.data.workflow_runs[0];

    if (!latestRun) {
      throw new Error('Failed to retrieve build ID from GitHub');
    }

    return NextResponse.json({
      message: 'Build started successfully',
      buildId: latestRun.id.toString(),
    });

  } catch (error: any) {
    console.error('Build API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
