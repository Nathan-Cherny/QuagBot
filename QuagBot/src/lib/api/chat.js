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
    const error = new Error(data?.error ?? `AI request failed (${response.status}). Please try again.`);
    error.status = response.status;
    const retryAfter = Number(response.headers.get('retry-after'));
    error.retryAfter = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30;
    throw error;
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

export async function shareConversation(conversationId, options){
  const data = await request(`/api/conversations/${encodeURIComponent(conversationId)}/share`, {
    ...options
  })
  return data
}