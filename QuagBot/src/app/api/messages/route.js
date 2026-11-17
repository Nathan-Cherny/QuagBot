import { NextResponse } from 'next/server';
import { authenticatedRoute } from '@/lib/ai-route';
import { AIError, callAI, MAX_MESSAGE_LENGTH, parseChatResponse, readResponse } from '@/lib/ai-backend.mjs';

export const POST = authenticatedRoute(async (request, body, userId) => {
  if (typeof body.conversationId !== 'string' || !body.conversationId.trim() || body.conversationId.length > 200) {
    throw new AIError('A valid conversation ID is required.', 400);
  }
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > MAX_MESSAGE_LENGTH) {
    throw new AIError(`Enter a question between 1 and ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }
  // Send the actual user text. Model instructions and retrieval belong in the AI service.


  const payload = await callAI('/chat/stream', {
    userId,
    body: { conversation_id: body.conversationId, message: body.message.trim() },
    signal: request.signal,
  }, async (response) => parseChatResponse(await readResponse(response), response.headers.get('content-type') ?? ''));
  return NextResponse.json(payload);
});
