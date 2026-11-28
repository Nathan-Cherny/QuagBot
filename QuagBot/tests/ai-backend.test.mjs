import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { AIError, callAI, createAIConversation, listAIConversations, listAIMessages, parseChatResponse, readResponse, sendAIMessage, streamAIMessage } from '../src/lib/ai-backend.mjs';

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

const sse = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const statuses = sse('status', { status: 'received', response: null }) + sse('status', { status: 'generating', response: null });

async function readEvents(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) if (line) events.push(JSON.parse(line));
  }
  return events;
}

async function withBackend(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.AI_API_URL;
  process.env.AI_API_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    if (previous === undefined) delete process.env.AI_API_URL; else process.env.AI_API_URL = previous;
    server.closeAllConnections(); server.close();
  });
}

test('streamAIMessage forwards deltas as they arrive, before the backend finishes', async (t) => {
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });
  await withBackend(t, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    // Split an event across two writes to prove partial blocks are buffered.
    const first = sse('delta', { delta: 'General Howe ' });
    res.write(statuses + first.slice(0, 20));
    setTimeout(() => res.write(first.slice(20) + sse('delta', { delta: 'was British.' })), 10);
    finished.then(() => res.end(sse('status', { status: 'completed', response: { reply: 'General Howe was British.' } }) + 'data: [DONE]\n\n'));
  });
  const stream = await streamAIMessage({ userId: 'user', conversationId: 'c1', message: 'Who was Howe?' });
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const seen = [];
  let buffer = '';
  while (seen.length < 2) {
    const { done, value } = await reader.read();
    assert.ok(!done, 'stream ended before deltas arrived');
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) if (line) seen.push(JSON.parse(line));
  }
  // The backend has not completed yet, but both deltas are already available.
  assert.deepEqual(seen, [{ type: 'delta', text: 'General Howe ' }, { type: 'delta', text: 'was British.' }]);
  finish();
  const rest = await readEvents(new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(buffer));
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  }));
  assert.deepEqual(rest, [{ type: 'done', reply: 'General Howe was British.' }]);
});

test('streamAIMessage reports mid-answer failures as an error event and early failures as rejections', async (t) => {
  await withBackend(t, (req, res) => {
    if (req.headers['x-user-id'] === 'missing') { res.writeHead(404); res.end('nope'); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(sse('delta', { delta: 'Partial ' }));
    setTimeout(() => res.end(sse('status', { status: 'failed', response: null })), 10);
  });
  const events = await readEvents(await streamAIMessage({ userId: 'user', conversationId: 'c1', message: 'Hi' }));
  assert.deepEqual(events[0], { type: 'delta', text: 'Partial ' });
  assert.equal(events[1].type, 'error');
  assert.equal(events[1].status, 502);
  assert.match(events[1].message, /could not complete/);
  await assert.rejects(streamAIMessage({ userId: 'missing', conversationId: 'c1', message: 'Hi' }), (error) => error.status === 404);
});

test('streamAIMessage errors when the backend ends without a completed answer, and wraps JSON replies', async (t) => {
  await withBackend(t, (req, res) => {
    if (req.headers['x-user-id'] === 'json') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"reply":"Plain answer"}'); return;
    }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.end(sse('delta', { delta: 'Cut off' }));
  });
  const events = await readEvents(await streamAIMessage({ userId: 'user', conversationId: 'c1', message: 'Hi' }));
  assert.equal(events.at(-1).type, 'error');
  assert.match(events.at(-1).message, /ended without an answer/);
  assert.deepEqual(await readEvents(await streamAIMessage({ userId: 'json', conversationId: 'c1', message: 'Hi' })), [{ type: 'done', reply: 'Plain answer' }]);
});

test('parseChatResponse ignores delta events and still returns the completed reply', () => {
  const stream = statuses + sse('delta', { delta: 'Hello' }) + sse('status', { status: 'completed', response: { reply: 'Hello' } });
  assert.deepEqual(parseChatResponse(stream), { reply: 'Hello' });
});
