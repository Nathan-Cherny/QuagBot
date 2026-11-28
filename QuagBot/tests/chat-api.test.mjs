import test from 'node:test';
import assert from 'node:assert/strict';
import { listMessages, sendMessage, streamMessage } from '../src/lib/api/chat.js';

test('message loading and sending preserve HTTP 404 so the UI can offer a new chat', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Conversation unavailable.' }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  }));
  const unavailable = (error) => error.status === 404 && error.message === 'Conversation unavailable.';
  await assert.rejects(listMessages('old-conversation'), unavailable);
  await assert.rejects(sendMessage('old-conversation', 'Follow-up'), unavailable);
});

function ndjsonResponse(chunks) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }), { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } });
}

test('streamMessage reports growing text per delta, handles lines split across chunks, and returns the final reply', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ndjsonResponse([
    '{"type":"delta","text":"Hello"}\n{"type":"del',
    'ta","text":", world"}\n',
    '{"type":"done","reply":"Hello, world"}',
  ]));
  const partials = [];
  const result = await streamMessage('conversation', 'Hi', { onDelta: (text) => partials.push(text) });
  assert.deepEqual(partials, ['Hello', 'Hello, world']);
  assert.deepEqual(result, { reply: 'Hello, world' });
  assert.deepEqual(JSON.parse(fetch.mock.calls[0].arguments[1].body), { conversationId: 'conversation', message: 'Hi', stream: true });
});

test('streamMessage surfaces mid-answer errors and preserves HTTP status before streaming starts', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => ndjsonResponse([
    '{"type":"delta","text":"Partial"}\n{"type":"error","message":"Too slow","status":504,"retryAfter":45}\n',
  ]));
  await assert.rejects(streamMessage('conversation', 'Hi'), (error) => error.status === 504 && error.retryAfter === 45 && error.message === 'Too slow');
  mock.mock.mockImplementation(async () => new Response(JSON.stringify({ error: 'Conversation unavailable.' }), { status: 404 }));
  await assert.rejects(streamMessage('old', 'Hi'), (error) => error.status === 404 && error.message === 'Conversation unavailable.');
  mock.mock.mockImplementation(async () => ndjsonResponse(['{"type":"delta","text":"Only partial"}\n']));
  await assert.rejects(streamMessage('conversation', 'Hi'), /empty answer/);
});
