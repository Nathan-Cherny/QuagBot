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

test('local fallback turns and unsent questions survive newer backend turns and repeated sync', () => {
  const offlineQuestion = { id: 'offline-u', role: 'user', text: 'Why?' };
  const fallback = { id: 'fallback', role: 'quagbot', text: 'A local practice answer.', source: 'local' };
  const unsent = { id: 'draft', role: 'user', text: 'Not sent yet' };
  const cached = [user, { id: 'local-answer', role: 'quagbot', text: 'A general.' }, offlineQuestion, fallback, unsent];
  const newer = [...records, { id: 'remote-next-u', role: 'user', content: 'From another device', status: 'completed', created_at: '2026-11-03T13:00:00Z' }];
  const result = restoreMessages(newer, cached);
  assert.ok(result.messages.some((item) => item.id === 'fallback'));
  assert.ok(result.messages.some((item) => item.id === 'offline-u'));
  assert.ok(result.messages.some((item) => item.id === 'draft'));
  assert.ok(result.messages.some((item) => item.id === 'remote-next-u'));
  assert.deepEqual(restoreMessages(newer, result.messages), result);
  assert.deepEqual(cached.at(-1), unsent);
});

test('matches backend explanation prompts while keeping the original local question', () => {
  const remoteText = 'Explain at a high-school level with relevant historical terms, supporting detail, and causes and effects. Keep facts and citations accurate.\n\nWho was Washington?';
  const enrichedRecords = [{ ...records[0], content: remoteText }, records[1]];
  const cached = [{ ...user, id: 'local-question', remoteText }];
  const restored = restoreMessages(enrichedRecords, cached);
  assert.equal(restored.messages.length, 2);
  assert.equal(restored.messages[0].text, user.text);
  assert.equal(restored.messages[0].id, 'local-question');
  assert.equal(restored.messages[0].backendMessageId, 'u1');
  assert.equal(restoreMessages(enrichedRecords).messages[0].text, user.text);
});

test('restores transformed practice-exam messages without exposing the generated prompt twice', () => {
  const prompt = 'Generate a short practice exam based on the content of the following conversation. Question settings';
  const question = { id: 'local-exam', role: 'user', text: 'QuagBot, please generate a practice exam for me!', remoteText: prompt };
  const record = { id: 'remote-exam', role: 'user', content: prompt, status: 'completed' };
  assert.equal(restoreMessages([record], [question]).messages.length, 1);
  assert.equal(restoreMessages([record]).messages[0].text, question.text);
});

test('empty or stale server results never erase cached messages', () => {
  const cached = [user, { id: 'fallback', role: 'quagbot', text: 'Local fallback' }, { id: 'unsent', role: 'user', text: 'Another question' }];
  assert.deepEqual(restoreMessages([], cached).messages, cached);
  assert.ok(restoreMessages(records.slice(0, 1), cached).messages.some((item) => item.id === 'fallback'));
});

test('locally hidden backend chats do not reappear during catalog synchronization', () => {
  const hidden = new Set([remote.id]);
  const other = { ...remote, id: 'other-server' };
  assert.deepEqual(mergeConversationCatalog([], [remote], hidden), []);
  assert.equal(mergeConversationCatalog([], [remote, other], hidden)[0].backendConversationId, other.id);
  assert.deepEqual([...hidden], [remote.id]);
});
