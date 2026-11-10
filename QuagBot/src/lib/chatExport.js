export function exportableMessages(messages) {
  return messages.filter(({ id, role }) => id !== 'welcome' && ['user', 'assistant', 'quagbot'].includes(role));
}

function messageText(text) {
  if (typeof text === 'string') {
    if (!text.startsWith('```json')) return text;
    try {
      return messageText(JSON.parse(text.replace(/^```json\s*/, '').replace(/\s*```\s*$/, '')));
    } catch {
      return text;
    }
  }
  if (text && typeof text === 'object') {
    return [text.title, text.text].filter((value) => typeof value === 'string').join('\n\n');
  }
  return '';
}

export function createChatTranscript(title, messages) {
  return `${title || 'QuagBot chat'}\n\n${exportableMessages(messages)
    .map(({ role, text }) => `${role === 'user' ? 'You' : 'QuagBot'}:\n${role === 'user' && typeof text === 'string' ? text : messageText(text)}`)
    .join('\n\n')}\n`;
}

export function chatExportFilename(title) {
  const name = (title || 'QuagBot chat').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return `${name || 'QuagBot-chat'}.txt`;
}
