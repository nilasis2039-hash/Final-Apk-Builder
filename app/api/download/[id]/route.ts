import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
       return new Response('Server configuration missing', { status: 500 });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const artifact = await octokit.rest.actions.downloadArtifact({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      artifact_id: parseInt(id),
      archive_format: 'zip'
    });

    // Return the download URL or stream
    return new Response(artifact.data as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="app.zip"'
      }
    });

  } catch (error: any) {
    console.error('Download API Error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
