// Merge metadata without replacing local IDs, unsent questions, or browser-only preferences.
export function mergeConversationCatalog(local, remote) {
  const byBackendId = new Map(local.filter((chat) => chat.backendConversationId).map((chat) => [chat.backendConversationId, chat]));
  const merged = new Map(local.map((chat) => [chat.id, chat]));
  for (const record of remote) {
    const existing = byBackendId.get(record.id);
    const chat = {
      ...existing,
      id: existing?.id ?? `ai:${record.id}`,
      backendConversationId: record.id,
      title: existing?.renamed ? existing.title : record.title,
      content: existing?.content ?? [],
      updatedAt: Math.max(existing?.updatedAt ?? 0, Date.parse(record.updated_at ?? record.created_at) || 0),
    };
    merged.set(chat.id, chat);
  }
  return [...merged.values()];
}

export function restoreMessages(records, cached = []) {
  const ordered = [...records].sort((a, b) => (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0));
  const messages = ordered
    .filter((record) => record.content.trim() && (record.role === 'user' || record.status === 'completed'))
    .map((record) => ({ id: record.id, role: record.role === 'assistant' ? 'quagbot' : 'user', text: record.content }));
  // Preserve a question whose creation/send failed before the backend saved it.
  const unsent = cached.at(-1);
  const countQuestion = (items, text) => items.filter((message) => message.role === 'user' && message.text === text).length;
  if (unsent?.role === 'user' && countQuestion(cached, unsent.text) > countQuestion(messages, unsent.text)) {
    messages.push(unsent);
  }
  return { messages, pending: ordered.at(-1)?.status === 'pending' };
}
