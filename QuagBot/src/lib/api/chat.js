import { addSavedChatContext } from '../historySync.mjs';

async function request(path, { signal, body, method = 'GET', onUpdate } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(onUpdate && { Accept: 'application/x-ndjson' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal,
  });
  if (response.ok && response.headers.get('content-type')?.includes('application/x-ndjson')) {
    return readReplyStream(response, onUpdate);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error ?? `AI request failed (${response.status}). Please try again.`);
    error.status = response.status;
    const retryAfter = Number(response.headers.get('retry-after'));
    error.retryAfter = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30;
    throw error;
  }
  if (!data) throw new Error('The AI service returned an invalid response. Please try again.');
  return data;
}

async function readReplyStream(response, onUpdate) {
  if (!response.body) throw new Error('The AI service returned an empty answer.');
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.type === 'completed') {
          const { type, ...result } = event;
          return result;
        }
        if (event.type === 'error') {
          throw Object.assign(new Error(event.error), {
            status: event.status,
            retryAfter: event.retryAfter,
          });
        }
        onUpdate?.(event);
      }
    }
    throw new Error('The AI service ended without an answer. Please try again.');
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function createConversation(title, options) {
  const data = await request('/api/conversations', { ...options, method: 'POST', body: { title } });
  if (typeof data.id !== 'string' || !data.id.trim()) throw new Error('The AI service did not provide a conversation ID. Please try again.');
  return data;
}

export async function sendMessage(conversationId, message, options) {
  const data = await request('/api/messages', { ...options, method: 'POST', body: { conversationId, message, ...(options?.documentId && { documentId: options.documentId }) } });
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The AI service returned an empty answer. Please try again.');
  return data;
}

export async function sendConversationMessage({ conversationId, title, message, documentId, priorMessages, signal, onLink, onUpdate }) {
  if (conversationId) {
    try {
      return await sendMessage(conversationId, message, { signal, onUpdate, documentId });
    } catch (error) {
      if (error.status !== 404 || signal?.aborted || documentId) throw error;
    }
  }

  signal?.throwIfAborted();
  const outgoingText = documentId ? message : addSavedChatContext(message, priorMessages);
  const conversation = await createConversation(title, { signal });
  signal?.throwIfAborted();
  onLink(conversation.id, outgoingText);
  return sendMessage(conversation.id, outgoingText, { signal, onUpdate, documentId });
}

export async function listConversations(options) {
  const data = await request('/api/conversations', options);
  if (!Array.isArray(data)) throw new Error('Conversation history could not be loaded.');
  return data;
}

export async function listMessages(conversationId, options) {
  const data = await request(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, options);
  if (!Array.isArray(data)) throw new Error('Messages could not be loaded.');
  return data;
}

export async function deleteConversation(conversationId, options) {
  await request(`/api/conversations/${encodeURIComponent(conversationId)}`, {
    ...options,
    method: 'DELETE',
  });
}
