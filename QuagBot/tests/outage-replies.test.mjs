import test from 'node:test';
import assert from 'node:assert/strict';
import { getOutageReply } from '../src/lib/chat.js';

const user = (text) => ({ role: 'user', text });

test('outage returns a natural backup answer for supported questions', () => {
  assert.doesNotMatch(getOutageReply([user('Who was George Washington?')]), /prepared answer|AI is temporarily unavailable/i);
  assert.match(getOutageReply([user('Who was George Washington?')]), /Continental Army/);
});

test('questions beyond prepared material receive an outage notice', () => {
  assert.match(getOutageReply([user('Analyze the economic impact of the Seven Years War')]), /can’t answer this question/);
  assert.match(getOutageReply([user('What is calculus?')]), /try again in a little while/);
});

test('prepared follow-ups retain the topic', () => {
  assert.match(getOutageReply([user('What happened at Yorktown?'), user('Tell me more')]), /Cornwallis/);
});
