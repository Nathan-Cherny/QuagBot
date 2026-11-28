function requestError(message, status, retryAfter) {
  const error = new Error(message);
  error.status = status;
  const seconds = Number(retryAfter);
  error.retryAfter = Number.isFinite(seconds) && seconds > 0 ? seconds : 30;
  return error;
}

async function request(path, { signal, body, method = 'GET' } = {}) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw requestError(data?.error ?? `AI request failed (${response.status}). Please try again.`, response.status, response.headers.get('retry-after'));
  }
  if (!data) throw new Error('The AI service returned an invalid response. Please try again.');
  return data;
}

export async function createConversation(title, options) {
  const data = await request('/api/conversations', { ...options, method: 'POST', body: { title } });
  if (typeof data.id !== 'string' || !data.id.trim()) throw new Error('The AI service did not provide a conversation ID. Please try again.');
  return data;
}

export async function sendMessage(conversationId, message, options) {
  const data = await request('/api/messages', { ...options, method: 'POST', body: { conversationId, message } });
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The AI service returned an empty answer. Please try again.');
  return data;
}

// Sends a message and reports the answer as it is written. `onDelta(text)` is
// called with the full text so far each time more arrives; the returned
// promise resolves with the final { reply }.
export async function streamMessage(conversationId, message, { signal, onDelta } = {}) {
  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message, stream: true }),
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw requestError(data?.error ?? `AI request failed (${response.status}). Please try again.`, response.status, response.headers.get('retry-after'));
  }
  if (!response.body) throw new Error('The AI service returned an invalid response. Please try again.');

  let partial = '';
  let reply = null;
  function handleLine(line) {
    if (!line.trim()) return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error('The AI service returned an invalid response. Please try again.');
    }
    if (event.type === 'delta' && typeof event.text === 'string') {
      partial += event.text;
      onDelta?.(partial);
    } else if (event.type === 'done') {
      reply = event.reply;
    } else if (event.type === 'error') {
      throw requestError(event.message || 'The AI service could not respond. Please try again.', event.status, event.retryAfter);
    }
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      lines.forEach(handleLine);
    }
    handleLine(buffer + decoder.decode());
  } finally {
    reader.cancel().catch(() => {});
  }
  if (typeof reply !== 'string' || !reply.trim()) throw new Error('The AI service returned an empty answer. Please try again.');
  return { reply };
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
  const data = await request(`/api/conversations`, {...options, method:'DELETE', body: { conversationId }})
  if (/*typeof data?.deleted !== true*/ false) throw new Error("Conversation could not be deleted.");
  return data
}