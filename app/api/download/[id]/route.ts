import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return new NextResponse('Server configuration missing', { status: 500 });
    }

    const octokit = new Octokit({ auth: token });

    // Get artifact download URL (Fix 2)
    // Instead of downloading to memory, we get the redirect URL
    const response = await octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: parseInt(id),
      archive_format: 'zip',
      request: {
        redirect: 'manual' // Don't follow redirect automatically
      }
    });

    // If GitHub redirects (which it usually does for artifacts), use that URL
    const downloadUrl = response.headers.location;

    if (downloadUrl) {
        // Stream from the redirect URL
        const artifactResponse = await fetch(downloadUrl);
        
        if (!artifactResponse.ok || !artifactResponse.body) {
            throw new Error('Failed to fetch artifact stream');
        }

        return new NextResponse(artifactResponse.body, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="app-release.zip"`,
            },
        });
    } else {
        // Fallback for small artifacts if no redirect (unlikely for artifacts)
        const buffer = response.data as ArrayBuffer;
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="app-release.zip"`,
            },
        });
    }

  } catch (error: any) {
    console.error('Download Error:', error);
    return new NextResponse(error.message || 'Failed to download artifact', { status: 500 });
  }
}
