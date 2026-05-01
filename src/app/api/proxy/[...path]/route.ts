import { NextRequest, NextResponse } from 'next/server';

/**
 * Catch-all proxy route — forwards all /api/proxy/* requests to the private backend.
 *
 * Why this exists:
 * - grace-hub-service is a Render Private Service (no public URL)
 * - Browsers block HTTP requests from HTTPS pages (mixed content policy)
 * - This proxy runs server-side: browser → Next.js (HTTPS, same origin) → backend (HTTP, private network)
 *
 * BACKEND_URL is a server-side env var only — never exposed to the browser.
 */

const BACKEND = process.env.BACKEND_URL;

async function proxy(
  req: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<NextResponse> {
  if (!BACKEND) {
    return NextResponse.json({ message: 'BACKEND_URL not configured' }, { status: 503 });
  }

  const { path } = await params;
  const url = new URL(req.url);
  const target = `${BACKEND}/${path.join('/')}${url.search}`;

  const headers: HeadersInit = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;

  const body =
    req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  let res: Response;
  try {
    res = await fetch(target, { method: req.method, headers, body });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
