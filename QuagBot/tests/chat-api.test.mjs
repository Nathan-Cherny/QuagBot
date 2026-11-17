import test from 'node:test';
import assert from 'node:assert/strict';
import { listMessages, sendMessage } from '../src/lib/api/chat.js';

test('message loading and sending preserve HTTP 404 so the UI can offer a new chat', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Conversation unavailable.' }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  }));
  const unavailable = (error) => error.status === 404 && error.message === 'Conversation unavailable.';
  await assert.rejects(listMessages('old-conversation'), unavailable);
  await assert.rejects(sendMessage('old-conversation', 'Follow-up'), unavailable);
});
