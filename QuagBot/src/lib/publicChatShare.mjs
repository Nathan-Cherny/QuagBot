import { exportableMessages, messageText } from './chatExport.js';

// A fragment travels with the link, but is not included in the HTTP request.
export const MAX_SHARE_FRAGMENT_LENGTH = 24000;
const MAX_SNAPSHOT_BYTES = 18000;
const TOO_LARGE = 'This chat is too large for a browser-only share link. Use Export to share the complete transcript.';

function validateSnapshot(data) {
  if (data?.version !== 1 || typeof data.title !== 'string' || data.title.length > 500 || !Array.isArray(data.messages) || !data.messages.length || data.messages.length > 200 || data.messages.some((message) => !message || !['user', 'assistant'].includes(message.role) || typeof message.text !== 'string')) {
    throw new Error('This shared chat link is invalid or incomplete. Ask the sender for a new link.');
  }
  return { version: 1, title: data.title, messages: data.messages.map(({ role, text }) => ({ role, text })) };
}

export function encodeChatSnapshot(title, messages) {
  const snapshot = validateSnapshot({
    version: 1,
    title: (title || 'QuagBot chat').slice(0, 500),
    messages: exportableMessages(messages).map(({ role, text }) => ({
      role: role === 'user' ? 'user' : 'assistant',
      text: role === 'user' && typeof text === 'string' ? text : messageText(text),
    })),
  });
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  if (bytes.length > MAX_SNAPSHOT_BYTES) throw new Error(TOO_LARGE);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeChatSnapshot(fragment) {
  const encoded = fragment.replace(/^#/, '');
  if (encoded.length > MAX_SHARE_FRAGMENT_LENGTH) throw new Error(TOO_LARGE);
  try {
    if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error();
    const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    if (raw.length > MAX_SNAPSHOT_BYTES) throw new Error();
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    return validateSnapshot(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch {
    throw new Error('This shared chat link is invalid or incomplete. Ask the sender for a new link.');
  }
}

export function createPublicChatLink(origin, title, messages) {
  return `${new URL(origin).origin}/share#${encodeChatSnapshot(title, messages)}`;
}
