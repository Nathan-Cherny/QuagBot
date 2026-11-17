import test from 'node:test';
import assert from 'node:assert/strict';
import { browserHistory } from '../src/lib/browserHistory.mjs';

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const chat = {
  id: 'local-id', backendConversationId: 'unavailable-backend-id', title: 'Washington', updatedAt: 123,
  content: [{ id: 'question', role: 'user', text: 'Who was Washington?' }, { id: 'answer', role: 'quagbot', text: 'A general.' }],
};

test('cached messages restore even when all network access fails', (t) => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Network unavailable'); });
  const store = storage();
  browserHistory.save(store, 'account-a', [chat]);
  assert.deepEqual(browserHistory.load(store, 'account-a'), [chat]);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('rename and deletion persist through reload for AI chats without touching another account', () => {
  const store = storage();
  browserHistory.save(store, 'account-a', [chat]);
  browserHistory.save(store, 'account-b', [{ ...chat, id: 'other-user-chat' }]);
  const renamed = browserHistory.rename(browserHistory.load(store, 'account-a'), chat.id, '  My revision notes  ');
  browserHistory.save(store, 'account-a', renamed);
  const reloaded = browserHistory.load(store, 'account-a');
  assert.equal(reloaded[0].title, 'My revision notes');
  assert.equal(reloaded[0].renamed, true);
  assert.equal(reloaded[0].backendConversationId, chat.backendConversationId);
  assert.deepEqual(reloaded[0].content, chat.content);
  browserHistory.save(store, 'account-a', browserHistory.remove(reloaded, chat.id));
  assert.deepEqual(browserHistory.load(store, 'account-a'), []);
  assert.equal(browserHistory.load(store, 'account-b')[0].id, 'other-user-chat');
});

test('legacy practice chats and metadata-only entries are preserved without invented messages', () => {
  const store = storage();
  const legacy = { id: 'legacy', title: 'Practice', content: chat.content };
  const metadata = { ...chat, content: [] };
  browserHistory.save(store, 'account', [legacy, metadata]);
  assert.deepEqual(browserHistory.load(store, 'account'), [legacy, metadata]);
  assert.deepEqual(browserHistory.load(store, 'new-account'), []);
});

test('malformed history is reported without changing the stored data', () => {
  const store = storage();
  for (const value of ['not json', '{}']) {
    store.setItem('account', value);
    assert.throws(() => browserHistory.load(store, 'account'));
    assert.equal(store.getItem('account'), value);
  }
});

test('blocked storage and quota errors remain observable to the UI', () => {
  assert.throws(() => browserHistory.load({ getItem: () => { throw new Error('blocked'); } }, 'account'), /blocked/);
  assert.throws(() => browserHistory.save({ setItem: () => { throw new Error('quota'); } }, 'account', [chat]), /quota/);
});
