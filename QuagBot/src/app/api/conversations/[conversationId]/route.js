import { AIError, deleteAIConversation } from '@/lib/ai-backend.mjs';
import { authenticatedRoute } from '@/lib/ai-route';

export const DELETE = authenticatedRoute(async (request, _body, userId, context) => {
  const { conversationId } = await context.params;
  if (!/^[a-z0-9_-]{1,200}$/i.test(conversationId)) {
    throw new AIError('A valid conversation ID is required.', 400);
  }

  try {
    await deleteAIConversation({ userId, conversationId, signal: request.signal });
  } catch (error) {
    // A previous attempt or another device may already have deleted it.
    if (error.status !== 404) throw error;
  }
  return new Response(null, { status: 204 });
}, { parseBody: false });
