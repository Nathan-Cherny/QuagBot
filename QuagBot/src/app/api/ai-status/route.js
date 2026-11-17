import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ maintenance: process.env.AI_MAINTENANCE_MODE === 'true' }, { headers: { 'Cache-Control': 'no-store' } });
}
