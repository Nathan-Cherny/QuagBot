import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExplanationLevel, saveExplanationLevel } from '../src/app/components/Chat/chatPreferences.js';

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
