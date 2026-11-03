import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIError } from './ai-backend.mjs';

export function authenticatedRoute(handler) {
  return async (request, context) => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (error || !userId) return NextResponse.json({ error: 'Please sign in again to use AI chat.' }, { status: 401 });
      let body = {};
      if (request.method !== 'GET') {
        try { body = await request.json(); }
        catch { throw new AIError('Send a valid JSON request.', 400); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AIError('Send a valid request object.', 400);
      }
      return await handler(request, body, userId, context);
    } catch (error) {
      if (!(error instanceof AIError)) console.error('AI request failed:', error.name);
      return NextResponse.json(
        { error: error instanceof AIError ? error.message : 'The AI request failed. Please try again.' },
        { status: error instanceof AIError ? error.status : 500 },
      );
    }
  };
}
