import { NextResponse } from "next/server";
import { authenticatedRoute } from "@/lib/ai-route";
import { AIError, listAIMessages, shareConversation } from "@/lib/ai-backend.mjs";

export const GET = authenticatedRoute(
  async (request, _body, userId, context) => {

    const { conversationId } = await context.params;
    console.log(`${conversationId}\n\n${userId}`)
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        conversationId,
      )
    ) {
      throw new AIError("A valid conversation ID is required.", 400);
    }
    const messages = await shareConversation({
      userId,
      conversationId,
      signal: request.signal,
    });
    return NextResponse.json(messages, {
      headers: { "Cache-Control": "private, no-store" },
    });
  },
);
