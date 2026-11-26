import { NextResponse } from 'next/server';
import { authenticatedRoute } from '@/lib/ai-route';
import { listEducationSources } from '@/lib/ai-backend.mjs';

export const GET = authenticatedRoute(async (request, _body, userId) =>
  NextResponse.json(await listEducationSources({ userId, signal: request.signal }), {
    headers: { 'Cache-Control': 'private, no-store' },
  })
);
