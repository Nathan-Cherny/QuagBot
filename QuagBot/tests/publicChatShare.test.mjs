import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicChatLink, encodeChatSnapshot, decodeChatSnapshot, MAX_SHARE_FRAGMENT_LENGTH } from '../src/lib/publicChatShare.mjs';

const messages = [
  { id: 'welcome', role: 'quagbot', text: 'Welcome' },
  { role: 'system', text: 'Internal instructions' },
  { id: 'private-local-id', role: 'user', text: 'Why? 🌎\n你好', userId: 'private-user-id' },
  { role: 'quagbot', text: '**Answer**\n\n- A point' },
];

test('public links round-trip Unicode and only include displayed chat data', () => {
  const link = createPublicChatLink('https://quagbot.example/', 'History 🌎', messages);
  const url = new URL(link);
  assert.equal(url.pathname, '/share');
  assert.equal(url.search, '');
  const snapshot = decodeChatSnapshot(url.hash);
  assert.deepEqual(snapshot, { version: 1, title: 'History 🌎', messages: [
    { role: 'user', text: 'Why? 🌎\n你好' },
    { role: 'assistant', text: '**Answer**\n\n- A point' },
  ] });
  assert.doesNotMatch(JSON.stringify(snapshot), /private-|Welcome|Internal/);
  messages.push({ role: 'user', text: 'Added later' });
  assert.equal(decodeChatSnapshot(url.hash).messages.length, 2);
  messages.pop();
});

test('exam content is included and user JSON is preserved verbatim', () => {
  const raw = '```json\n{"title":"User code","text":"unchanged"}\n```';
  const snapshot = decodeChatSnapshot(encodeChatSnapshot('Quiz', [
    { role: 'user', text: raw },
    { role: 'quagbot', text: '```json\n{"title":"Exam","text":"Question 1"}\n```' },
  ]));
  assert.equal(snapshot.messages[0].text, raw);
  assert.equal(snapshot.messages[1].text, 'Exam\n\nQuestion 1');
});

test('invalid, truncated, oversized and unsupported snapshots are rejected', () => {
  const encode = (data) => Buffer.from(JSON.stringify(data)).toString('base64url');
  for (const fragment of ['', '#', 'bad%link', '!!!!', encode({ version: 2, title: 'No', messages: [] }), encode({ version: 1, title: 'No', messages: [{ role: 'system', text: 'Injected' }] }), encode({ version: 1, title: 'No', messages: [{ role: 'user', text: {} }] })]) {
    assert.throws(() => decodeChatSnapshot(fragment), /invalid or incomplete/);
  }
  const valid = encodeChatSnapshot('Test', messages);
  assert.throws(() => decodeChatSnapshot(valid.slice(0, -9)), /invalid or incomplete/);
  assert.throws(() => encodeChatSnapshot('Long', [{ role: 'user', text: 'a'.repeat(19000) }]), /too large/);
  assert.throws(() => decodeChatSnapshot('a'.repeat(MAX_SHARE_FRAGMENT_LENGTH + 1)), /too large/);
  assert.throws(() => encodeChatSnapshot('Empty', []), /invalid or incomplete/);
});
