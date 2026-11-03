import { NextResponse } from 'next/server';
import { authenticatedRoute } from '@/lib/ai-route';
import { createAIConversation, listAIConversations } from '@/lib/ai-backend.mjs';

export const POST = authenticatedRoute(async (request, body, userId) => {
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : 'New chat';
  const conversation = await createAIConversation({ userId, title, signal: request.signal });
  return NextResponse.json(conversation, { status: 201 });
});

export const GET = authenticatedRoute(async (request, _body, userId) => {
  const conversations = await listAIConversations({ userId, signal: request.signal });
  return NextResponse.json(conversations, { headers: { 'Cache-Control': 'private, no-store' } });
});
