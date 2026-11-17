// The UI uses this browser-only history store. The AI history API adapter remains
// separate so server synchronization can be reintroduced without changing chat IDs.
export const browserHistory = {
  load(storage, key) {
    const parsed = JSON.parse(storage.getItem(key) ?? '[]');
    if (!Array.isArray(parsed)) throw new Error('Invalid saved history');
    return parsed.filter((chat) => chat && typeof chat.id === 'string' && typeof chat.title === 'string' &&
      Array.isArray(chat.content) && chat.content.every((message) => message &&
        typeof message.id === 'string' && typeof message.text === 'string' && ['user', 'quagbot'].includes(message.role)));
  },
  save(storage, key, chats) {
    storage.setItem(key, JSON.stringify(chats));
  },
  rename(chats, id, title) {
    const trimmed = title.trim();
    if (!trimmed) return chats;
    return chats.map((chat) => chat.id === id ? { ...chat, title: trimmed, renamed: true } : chat);
  },
  remove(chats, id) {
    return chats.filter((chat) => chat.id !== id);
  },
};
