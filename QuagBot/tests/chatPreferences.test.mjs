import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExplanationLevel, saveExplanationLevel, prepareMessage } from '../src/app/components/Chat/chatPreferences.js';

test('explanation levels survive reload without modifying existing preferences or another account', () => {
  const accountA = 'quagbot:chats:v1:account-a';
  const accountB = 'quagbot:chats:v1:account-b';
  const existingPreferences = JSON.stringify({ font: 'Georgia, serif', textSize: '22px', fontColor: '#164ca0' });
  const values = new Map([[accountA + ':preferences', existingPreferences]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  for (const level of ['easy', 'medium', 'max']) {
    saveExplanationLevel(accountA + ':explanation-level', level, storage);
    assert.equal(loadExplanationLevel(accountA + ':explanation-level', storage), level);
    assert.equal(loadExplanationLevel(accountB + ':explanation-level', storage), 'medium');
    assert.equal(values.get(accountA + ':preferences'), existingPreferences);
  }
  values.set(accountA + ':explanation-level', 'invalid');
  assert.equal(loadExplanationLevel(accountA + ':explanation-level', storage), 'medium');
});

test('blocked storage still allows default explanation levels without throwing', () => {
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(loadExplanationLevel('account', storage), 'medium');
  assert.doesNotThrow(() => saveExplanationLevel('account', 'max', storage));
});

test('normal questions carry the selected level through the existing chat API', async (t) => {
  const { sendMessage } = await import('../src/lib/api/chat.js');
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ reply: 'Test response' }), { status: 200 });
  });
  const question = 'Why did France support the American Revolution?';
  for (const [level, expected] of [['easy', 'elementary-school'], ['medium', 'high-school'], ['max', 'college']]) {
    await sendMessage('conversation', prepareMessage(question, level));
    const sent = requests.at(-1);
    assert.equal(sent.conversationId, 'conversation');
    assert.ok(sent.message.includes(expected));
    assert.ok(sent.message.endsWith('\n\n' + question));
    assert.equal(sent.message.split(question).length, 2);
  }
  assert.equal(prepareMessage(question, 'invalid'), prepareMessage(question, 'medium'));
});

test('practice exam requests pass through unchanged at every level', () => {
  const prompt = 'Generate a practice exam as JSON.';
  for (const level of ['easy', 'medium', 'max']) {
    assert.equal(prepareMessage(prompt, level, true), prompt);
  }
});
