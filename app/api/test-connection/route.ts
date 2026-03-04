import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(req: Request) {
  try {
    const { token, owner, repo } = await req.json();

    if (!token || !owner || !repo) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });

    // Try to get the repo
    await octokit.rest.repos.get({
      owner,
      repo,
    });

    // Try to get workflows (to see if we have permissions)
    await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('GitHub Connection Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to connect to GitHub' 
    }, { status: 500 });
  }
}
