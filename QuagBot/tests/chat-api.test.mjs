import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteConversation, listMessages, sendConversationMessage, sendMessage } from '../src/lib/api/chat.js';

test('message loading and sending preserve HTTP 404 for missing conversations', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Conversation unavailable.' }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  }));
  const unavailable = (error) => error.status === 404 && error.message === 'Conversation unavailable.';
  await assert.rejects(listMessages('old-conversation'), unavailable);
  await assert.rejects(sendMessage('old-conversation', 'Follow-up'), unavailable);
});

test('a stale server ID is replaced and the follow-up is sent with saved context', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    const body = JSON.parse(options.body);
    requests.push({ path, body });
    if (body.conversationId === 'old') return Response.json({ error: 'Conversation unavailable.' }, { status: 404 });
    if (path === '/api/conversations') return Response.json({ id: 'replacement' });
    return Response.json({ reply: 'QuagBot reply' });
  });
  const links = [];
  const response = await sendConversationMessage({
    conversationId: 'old',
    title: 'Yorktown',
    message: 'What happened next?',
    priorMessages: [{ id: 'earlier', role: 'user', text: 'Tell me about Yorktown.' }],
    onLink: (...link) => links.push(link),
  });
  assert.equal(response.reply, 'QuagBot reply');
  assert.deepEqual(requests.map(({ path }) => path), ['/api/messages', '/api/conversations', '/api/messages']);
  assert.equal(requests[1].body.title, 'Yorktown');
  assert.equal(requests[2].body.conversationId, 'replacement');
  assert.match(requests[2].body.message, /Tell me about Yorktown.*[\s\S]*What happened next\?/);
  assert.deepEqual(links, [['replacement', requests[2].body.message]]);
});

test('transient errors do not create replacement conversations', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Service unavailable.' }, { status: 503 }));
  await assert.rejects(sendConversationMessage({
    conversationId: 'existing',
    message: 'Follow-up',
    onLink: () => assert.fail('The existing conversation should stay linked.'),
  }), { status: 503 });
  assert.equal(fetch.mock.callCount(), 1);
});

test('streaming updates reach the caller before the final reply', async (t) => {
  const encoder = new TextEncoder();
  let stream;
  const body = new ReadableStream({ start(controller) { stream = controller; } });
  t.mock.method(globalThis, 'fetch', async (_path, options) => {
    assert.equal(options.headers.Accept, 'application/x-ndjson');
    return new Response(body, { headers: { 'Content-Type': 'application/x-ndjson' } });
  });
  const updates = [];
  const reply = sendMessage('old-conversation', 'Follow-up', {
    onUpdate(event) {
      updates.push(event);
      if (event.type === 'delta') {
        stream.enqueue(encoder.encode('{"type":"completed","reply":"Full saved answer"}\n'));
        stream.close();
      }
    },
  });
  stream.enqueue(encoder.encode('{"type":"progress","label":"searching"}\n{"type":"del'));
  stream.enqueue(encoder.encode('ta","text":"Partial"}\n'));
  assert.deepEqual(await reply, { reply: 'Full saved answer' });
  assert.deepEqual(updates, [
    { type: 'progress', label: 'searching' },
    { type: 'delta', text: 'Partial' },
  ]);
});

test('deletes a conversation through its resource URL and accepts an empty response', async (t) => {
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    assert.equal(path, '/api/conversations/server-id');
    assert.equal(options.method, 'DELETE');
    assert.equal(options.body, undefined);
    return new Response(null, { status: 204 });
  });
  await deleteConversation('server-id');
});

test('keeps deletion errors available to the history UI', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Try again later.' }, { status: 503 }));
  await assert.rejects(deleteConversation('server-id'), { status: 503, message: 'Try again later.' });
});

test('sends the selected PDF ID and preserves citations from streamed completion', async (t) => {
  const documentId = '11111111-2222-4333-8444-555555555555';
  const citations = [{
    number: 1, document_id: documentId, filename: 'Notes.pdf',
    page_number: 7, section_name: 'The Stamp Act',
  }];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    assert.equal(path, '/api/messages');
    assert.deepEqual(JSON.parse(options.body), {
      conversationId: 'existing', message: 'What did it tax?', documentId,
    });
    return new Response(JSON.stringify({ type: 'completed', reply: 'Printed materials [1].', citations }) + '\n', {
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
  });
  assert.deepEqual(await sendConversationMessage({
    conversationId: 'existing', message: 'What did it tax?', documentId,
  }), { reply: 'Printed materials [1].', citations });
});
