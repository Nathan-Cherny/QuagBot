import { NextResponse } from 'next/server';
import { authenticatedRoute } from '@/lib/ai-route';
import { AIError, MAX_MESSAGE_LENGTH, sendAIMessage } from '@/lib/ai-backend.mjs';

export const POST = authenticatedRoute(async (request, body, userId) => {
  if (typeof body.conversationId !== 'string' || !body.conversationId.trim() || body.conversationId.length > 200) {
    throw new AIError('A valid conversation ID is required.', 400);
  }
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > MAX_MESSAGE_LENGTH) {
    throw new AIError(`Enter a question between 1 and ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }
  const options = {
    userId,
    conversationId: body.conversationId,
    message: body.message.trim(),
    signal: request.signal,
  };
  if (request.headers.get('accept') === 'application/x-ndjson') {
    return streamReply(options);
  }

  return NextResponse.json(await sendAIMessage(options));
});

function streamReply(options) {
  const abort = new AbortController();
  const signal = AbortSignal.any([options.signal, abort.signal]);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const emit = (event) => {
        if (!signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };
      async function forwardReply() {
        try {
          const { reply } = await sendAIMessage({ ...options, signal, onUpdate: emit });
          emit({ type: 'completed', reply });
        } catch (error) {
          const known = error instanceof AIError;
          emit({
            type: 'error',
            error: known ? error.message : 'The AI request failed. Please try again.',
            status: known ? error.status : 500,
            retryAfter: known ? error.retryAfter : null,
          });
        } finally {
          if (!abort.signal.aborted) controller.close();
        }
      }
      void forwardReply();
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'private, no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
