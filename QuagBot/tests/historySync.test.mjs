import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeConversationCatalog, restoreMessages } from '../src/lib/historySync.mjs';

const remote = { id: 'server-1', title: 'Washington', updated_at: '2026-11-03T12:00:00Z' };
const user = { id: 'u1', role: 'user', text: 'Who was Washington?' };
const local = { id: 'local-1', backendConversationId: remote.id, title: 'My title', renamed: true, content: [user], updatedAt: 0 };

test('history merges by backend ID while preserving local IDs, pending messages, titles', () => {
  const merged = mergeConversationCatalog([local], [remote]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, local.id);
  assert.equal(merged[0].title, local.title);
  assert.deepEqual(merged[0].content, [user]);
  assert.equal(merged[0].updatedAt, Date.parse(remote.updated_at));
});

test('a fresh browser restores remote metadata without making up messages', () => {
  const merged = mergeConversationCatalog([], [remote]);
  assert.equal(merged[0].backendConversationId, remote.id);
  assert.equal(merged[0].title, remote.title);
  assert.deepEqual(merged[0].content, []);
  assert.deepEqual(mergeConversationCatalog(merged, [remote]), merged);
});

test('a stale history fetch preserves local practice chats and newly created AI conversations', () => {
  const practice = { id: 'old', title: 'Practice', content: [] };
  const created = { ...local, backendConversationId: 'new-server' };
  const merged = mergeConversationCatalog([practice, created], []);
  assert.deepEqual(merged, [practice, created]);
});

const records = [
  { id: 'u1', role: 'user', content: user.text, status: 'completed', created_at: '2026-11-03T12:00:00Z' },
  { id: 'a1', role: 'assistant', content: 'A general.', status: 'completed', created_at: '2026-11-03T12:00:01Z' },
];

test('restored messages are chronological and assistant roles render as QuagBot', () => {
  const restored = restoreMessages([...records].reverse());
  assert.deepEqual(restored.messages, [user, { id: 'a1', role: 'quagbot', text: 'A general.' }]);
  assert.equal(restored.pending, false);
});

test('failed or pending assistants are not displayed as successful answers', () => {
  const restored = restoreMessages([...records.slice(0, 1), { ...records[1], status: 'pending' }]);
  assert.deepEqual(restored.messages, [user]);
  assert.equal(restored.pending, true);
  assert.equal(restoreMessages([{ ...records[1], status: 'failed' }]).messages.length, 0);
});

test('unsent questions survive refresh, including a repeated question', () => {
  const cached = [user, { id: 'a-local', role: 'quagbot', text: 'A general.' }, { ...user, id: 'u2' }];
  assert.equal(restoreMessages(records, cached).messages.at(-1).id, 'u2');
  assert.deepEqual(restoreMessages(records, [user]).messages, restoreMessages(records).messages);
});
