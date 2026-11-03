export function groupHistory(chats, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups = { Today: [], Yesterday: [], Older: [] };
  for (const chat of [...chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))) {
    const timestamp = Number(chat.updatedAt) || 0;
    const label = timestamp >= today.getTime() ? 'Today' : timestamp >= yesterday.getTime() ? 'Yesterday' : 'Older';
    groups[label].push(chat);
  }
  return Object.entries(groups).filter(([, items]) => items.length);
}
