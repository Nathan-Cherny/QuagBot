import { deleteAIConversation } from "@/lib/ai-backend.mjs";
import { NextResponse } from 'next/server';
import { authenticatedRoute } from '@/lib/ai-route';

export const DELETE = authenticatedRoute(async (request, body, userId) => {
  const conversationId = body?.conversationId;

  if (typeof conversationId !== 'string' || !conversationId.trim()) {
    return NextResponse.json(
      { error: 'A valid conversation ID is required.' },
      { status: 400 }
    );
  }

  await deleteAIConversation({
    userId,
    conversationId,
    signal: request.signal,
  });

  return NextResponse.json({
    deleted: true,
    id: conversationId,
  });
});
