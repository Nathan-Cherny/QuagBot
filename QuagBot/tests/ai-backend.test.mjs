import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { AIError, callAI, createAIConversation, listAIConversations, listAIMessages, parseChatResponse, readResponse } from '../src/lib/ai-backend.mjs';

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
    } else if (req.url === '/chat/stream') {
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
  await assert.rejects(callAI('/conversations', options, readResponse), /503/);
  const conversation = await createAIConversation({ userId: options.userId, title: 'Washington' });
  assert.equal(conversation.id, 'backend-conversation-1');
  assert.deepEqual(requests.filter((request) => request.path === '/conversations').at(-1).body, {
    title: 'Washington', domain: 'education',
  });
  const chatOptions = { ...options, body: { conversation_id: conversation.id, message: 'Who was Washington?' } };
  for (const message of ['Who was Washington?', 'Tell me more']) {
    const reply = await callAI('/chat/stream', { ...chatOptions, body: { ...chatOptions.body, message } }, async (res) => parseChatResponse(await readResponse(res), res.headers.get('content-type')));
    assert.match(reply.reply, /Washington/);
  }
  assert.deepEqual(requests.filter((request) => request.path === '/chat/stream').map((request) => request.body.conversation_id), [conversation.id, conversation.id]);
  assert.equal(requests[3].userId, options.userId);
  assert.equal(requests[3].body.message, 'Who was Washington?');
  await assert.rejects(callAI('/missing', options, readResponse), /404/);
  await assert.rejects(callAI('/slow', { ...options, timeoutMs: 50 }, readResponse), (error) => error.status === 504);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(callAI('/chat/stream', { ...chatOptions, signal: controller.signal }, readResponse), (error) => error.status === 499);
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
      { id: 'server-id', title: 'Saved chat', updated_at: '2026-11-03T12:00:00Z' },
    ] : [{ id: 'message-id', role: 'assistant', content: 'Saved answer', status: 'completed' }]));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL; else process.env.AI_API_URL = previous;
    server.closeAllConnections(); server.close();
  });
  assert.equal((await listAIConversations({ userId: 'verified-user' }))[0].id, 'server-id');
  assert.equal((await listAIMessages({ userId: 'verified-user', conversationId: 'server-id' }))[0].content, 'Saved answer');
  assert.ok(requests.every((request) => request.method === 'GET' && request.body === '' && request.userId === 'verified-user'));
  assert.equal(requests[1].path, '/conversations/server-id/messages');
  await assert.rejects(listAIConversations({ userId: 'bad-schema' }), /invalid conversation history/);
  await assert.rejects(listAIMessages({ userId: 'bad-schema', conversationId: 'server-id' }), /invalid messages/);
  const unavailable = (error) => error.status === 404 && /no longer available for your account/.test(error.message) && !/try again/i.test(error.message);
  await assert.rejects(listAIMessages({ userId: 'missing-conversation', conversationId: 'server-id' }), unavailable);
  await assert.rejects(callAI('/chat/stream', { userId: 'missing-conversation', body: {} }, readResponse), unavailable);
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
