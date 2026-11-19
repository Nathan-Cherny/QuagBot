import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { AIError, callAI, createAIConversation, listAIConversations, listAIDocuments, listAIMessages, parseChatResponse, readResponse, sendAIMessage, uploadAIPDF } from '../src/lib/ai-backend.mjs';

const completion = 'data: {"status":"completed","response":{"reply":"Washington commanded the Continental Army."}}\n\n';

test('accepts completion with SSE heartbeats, progress, CRLF, and DONE', () => {
  const stream = ': heartbeat\n\ndata: {"status":"working"}\n\n' + completion + 'data: [DONE]\n\n';
  assert.match(parseChatResponse(stream).reply, /Washington/);
  assert.deepEqual(parseChatResponse(stream.replaceAll('\n', '\r\n')), parseChatResponse(stream));
});

test('accepts named completion events, multiline data, and string replies', () => {
  assert.deepEqual(parseChatResponse('event: completed\ndata: {"response":\ndata: "Answer"}\n\n'), { reply: 'Answer' });
});

test('rejects failed, incomplete, malformed, or empty streams', () => {
  for (const text of [': heartbeat\n\n', 'data: {broken}\n\n', 'event: error\ndata: {"detail":"private backend error"}\n\n', 'data: {"status":"failed"}\n\n', 'data: {"status":"completed","response":{}}\n\n', 'data: {"status":"completed","response":{"reply":" "}}\n\n']) {
    assert.throws(() => parseChatResponse(text), AIError);
  }
});

test('normalizes JSON replies and rejects incompatible response shapes', () => {
  assert.deepEqual(parseChatResponse('{"reply":"Answer"}', 'application/json'), { reply: 'Answer' });
  for (const body of ['bad json', '{}', '{"reply":null}']) assert.throws(() => parseChatResponse(body, 'application/json'), AIError);
});

test('limits backend response size', async () => {
  await assert.rejects(readResponse(new Response('x'.repeat(2 * 1024 * 1024 + 1))), /too large/);
});

test('local HTTP integration: forwards identity and conversation, handles retries, HTTP errors, timeout, and cancellation', async (t) => {
  const requests = [];
  let failCreate = true;
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ path: req.url, userId: req.headers['x-user-id'], body: JSON.parse(body) });
    if (req.url === '/me/system-prompt') {
      assert.equal(req.method, 'PUT');
      assert.match(JSON.parse(body).prompt, /American Revolutionary War/);
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}');
    } else if (req.url === '/conversations') {
      if (failCreate) { failCreate = false; res.writeHead(503); res.end('private internal error'); return; }
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end('{"id":"backend-conversation-1"}');
    } else if (req.url === '/chat') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(': heartbeat\n\n');
      res.end(completion);
    } else if (req.url === '/missing') {
      res.writeHead(404); res.end('not found');
    } else if (req.url === '/slow') {
      // Keep the body open to verify timeout covers reading, not just headers.
      res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.write(': waiting\n\n');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL; else process.env.AI_API_URL = previous;
    server.closeAllConnections(); server.close();
  });
  const options = { userId: 'verified-supabase-user', body: { title: 'Washington' } };
  await assert.rejects(callAI('/conversations', options, readResponse), (error) => error.status === 503 && error.retryAfter === 30);
  const conversation = await createAIConversation({ userId: options.userId, title: 'Washington' });
  assert.equal(conversation.id, 'backend-conversation-1');
  assert.deepEqual(requests.filter((request) => request.path === '/conversations').at(-1).body, {
    title: 'Washington', domain: 'education',
  });
  const chatOptions = { ...options, body: { conversation_id: conversation.id, message: 'Who was Washington?' } };
  for (const message of ['Who was Washington?', 'Tell me more']) {
    const reply = await sendAIMessage({ userId: options.userId, conversationId: conversation.id, message });
    assert.match(reply.reply, /Washington/);
  }
  assert.deepEqual(requests.filter((request) => request.path === '/chat').map((request) => request.body.conversation_id), [conversation.id, conversation.id]);
  assert.ok(!requests.some((request) => request.path === '/chat/stream'));
  assert.equal(requests[3].userId, options.userId);
  assert.equal(requests[3].body.message, 'Who was Washington?');
  await assert.rejects(callAI('/missing', options, readResponse), /404/);
  await assert.rejects(callAI('/slow', { ...options, timeoutMs: 50 }, readResponse), (error) => error.status === 504);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(callAI('/chat', { ...chatOptions, signal: controller.signal }, readResponse), (error) => error.status === 499);
});

test('history GET requests forward identity with no body and validate responses', async (t) => {
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method, body, userId: req.headers['x-user-id'], path: req.url });
    if (req.headers['x-user-id'] === 'missing-conversation') { res.writeHead(404); res.end('{"detail":"Not found"}'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (req.headers['x-user-id'] === 'bad-schema') { res.end('{}'); return; }
    res.end(JSON.stringify(req.url === '/conversations' ? [
      { id: 'server-id', domain: 'education', title: 'Saved chat', updated_at: '2026-11-03T12:00:00Z' },
      { id: 'medical-id', domain: 'medical', title: 'Other domain' },
    ] : [{ id: 'message-id', role: 'assistant', content: 'Saved answer', status: 'completed' }]));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL; else process.env.AI_API_URL = previous;
    server.closeAllConnections(); server.close();
  });
  assert.deepEqual((await listAIConversations({ userId: 'verified-user' })).map((chat) => chat.id), ['server-id']);
  assert.equal((await listAIMessages({ userId: 'verified-user', conversationId: 'server-id' }))[0].content, 'Saved answer');
  assert.ok(requests.every((request) => request.method === 'GET' && request.body === '' && request.userId === 'verified-user'));
  assert.equal(requests[1].path, '/conversations/server-id/messages');
  await assert.rejects(listAIConversations({ userId: 'bad-schema' }), /invalid conversation history/);
  await assert.rejects(listAIMessages({ userId: 'bad-schema', conversationId: 'server-id' }), /invalid messages/);
  const unavailable = (error) => error.status === 404 && /no longer available for your account/.test(error.message) && !/try again/i.test(error.message);
  await assert.rejects(listAIMessages({ userId: 'missing-conversation', conversationId: 'server-id' }), unavailable);
  await assert.rejects(callAI('/chat', { userId: 'missing-conversation', body: {} }, readResponse), unavailable);
});

test('missing backend configuration fails explicitly', async () => {
  const previous = [process.env.AI_API_URL, process.env.NEXT_PUBLIC_API_URL];
  delete process.env.AI_API_URL; delete process.env.NEXT_PUBLIC_API_URL;
  try {
    await assert.rejects(callAI('/conversations', { userId: 'user', body: {} }, readResponse), (error) => error.status === 503);
  } finally {
    for (const [index, key] of ['AI_API_URL', 'NEXT_PUBLIC_API_URL'].entries()) {
      if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index];
    }
  }
});


test('maintenance prevents any outgoing backend request', async (t) => {
  const previous = process.env.AI_MAINTENANCE_MODE;
  process.env.AI_MAINTENANCE_MODE = 'true';
  t.after(() => {
    if (previous === undefined) delete process.env.AI_MAINTENANCE_MODE;
    else process.env.AI_MAINTENANCE_MODE = previous;
  });
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Must not contact AI'); });
  await assert.rejects(callAI('/chat', { userId: 'user', body: {} }, readResponse), (error) => error.status === 503);
  assert.equal(fetch.mock.callCount(), 0);
});

test('rate limits preserve status and Retry-After', async (t) => {
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = 'https://example.test';
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL;
    else process.env.AI_API_URL = previous;
  });
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429, headers: { 'Retry-After': '90' } }));
  await assert.rejects(callAI('/chat', { userId: 'user', body: {} }, readResponse), (error) => error.status === 429 && error.retryAfter === 90);
});

 test('current backend status events surface failed generation instead of a missing conversation', () => {
  const stream = 'event: status\ndata: {"status":"received","response":null}\n\n'
    + 'event: status\ndata: {"status":"generating","response":null}\n\n'
    + 'event: status\ndata: {"status":"failed","message":"The response could not be generated.","response":null}\n\n';
  assert.throws(() => parseChatResponse(stream), (error) => error.status === 502 && /could not complete/.test(error.message));
});

test('document listing forwards the account and preserves raw processing fields', async (t) => {
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = 'https://example.test';
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL;
    else process.env.AI_API_URL = previous;
  });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://example.test/upload?domain=education');
    assert.equal(options.method, 'GET');
    assert.equal(options.headers['X-User-ID'], 'verified-user');
    return Response.json([
      { id: 'a', filename: 'Yorktown.pdf', embedding_status: 'pending', chunk_count: 0, user_id: 'verified-user' },
      { id: 'b', filename: 'Notes.pdf', status: 'new-backend-value', chunk_count: 12 },
    ]);
  });
  assert.deepEqual(await listAIDocuments({ userId: 'verified-user' }), [
    { id: 'a', filename: 'Yorktown.pdf', status: null, embedding_status: 'pending', chunk_count: 0 },
    { id: 'b', filename: 'Notes.pdf', status: 'new-backend-value', embedding_status: null, chunk_count: 12 },
  ]);
});

test('streams progress and delta events split across SSE chunks', async (t) => {
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = 'https://example.test';
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL;
    else process.env.AI_API_URL = previous;
  });
  const encoder = new TextEncoder();
  let stream;
  const body = new ReadableStream({ start(controller) { stream = controller; } });
  t.mock.method(globalThis, 'fetch', async () =>
    new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }));
  const updates = [];
  const result = sendAIMessage({
    userId: 'verified-user',
    conversationId: 'server-id',
    message: 'What happened?',
    onUpdate(event) {
      updates.push(event);
      if (event.type === 'delta') {
        stream.enqueue(encoder.encode('data: {"status":"completed","response":{"reply":"Final reply"}}\n\n'));
        stream.close();
      }
    },
  });
  stream.enqueue(encoder.encode('data: {"status":"searching"}\r\n\r'));
  stream.enqueue(encoder.encode('\nevent: delta\ndata: {"text":"Partial reply"}\n\n'));
  assert.deepEqual(await result, { reply: 'Final reply' });
  assert.deepEqual(updates, [
    { type: 'progress', label: 'searching' },
    { type: 'delta', text: 'Partial reply' },
  ]);
});

test('uploads a PDF as education multipart and preserves processing fields', async (t) => {
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = 'https://example.test';
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL;
    else process.env.AI_API_URL = previous;
  });
  const file = new File(['%PDF-1.7'], 'Yorktown.pdf', { type: 'application/pdf' });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://example.test/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-User-ID'], 'verified-user');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body.get('domain'), 'education');
    assert.equal(options.body.getAll('files').length, 1);
    assert.equal(options.body.get('files').name, file.name);
    assert.equal(await options.body.get('files').text(), '%PDF-1.7');
    return Response.json([{
      success: true, document_id: 'uploaded-id', filename: file.name,
      status: 'uploaded', embedding_status: 'completed', chunk_count: 1,
    }], { status: 201 });
  });
  assert.deepEqual(await uploadAIPDF({ userId: 'verified-user', file }), {
    id: 'uploaded-id', filename: 'Yorktown.pdf',
    status: 'uploaded', embedding_status: 'completed', chunk_count: 1,
  });
});
