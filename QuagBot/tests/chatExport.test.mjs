import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatTranscript, chatExportFilename, exportableMessages } from '../src/lib/chatExport.js';

test('exports conversation turns in order without welcome or internal messages', () => {
  const messages = [
    { id: 'welcome', role: 'quagbot', text: 'Welcome!' },
    { role: 'system', text: 'Internal instructions' },
    { role: 'user', text: 'Why?\nExplain more.' },
    { role: 'quagbot', text: 'Here is **why**.' },
  ];
  assert.equal(createChatTranscript('History', messages), 'History\n\nYou:\nWhy?\nExplain more.\n\nQuagBot:\nHere is **why**.\n');
  assert.equal(exportableMessages(messages).length, 2);
  assert.equal(exportableMessages(messages.slice(0, 2)).length, 0);
});

test('includes practice exam contents and preserves malformed JSON as text', () => {
  const exam = { title: 'Quiz', text: 'Question 1\nAnswer key' };
  for (const text of [exam, '```json\n' + JSON.stringify(exam) + '\n```']) {
    assert.match(createChatTranscript('Study', [{ role: 'quagbot', text }]), /Quiz\n\nQuestion 1\nAnswer key/);
  }
  assert.match(createChatTranscript('', [{ role: 'assistant', text: '```json invalid' }]), /```json invalid/);
});

test('download filenames are bounded and contain no path separators', () => {
  assert.equal(chatExportFilename('../History / notes?'), 'History-notes.txt');
  assert.equal(chatExportFilename('🌎'), 'QuagBot-chat.txt');
  assert.equal(chatExportFilename('a'.repeat(200)).length, 84);
});

test('preserves user JSON code blocks exactly as typed', () => {
  const text = '```json\n{"title":"Example","text":"Keep the JSON"}\n```';
  assert.equal(createChatTranscript('JSON', [{ role: 'user', text }]), `JSON\n\nYou:\n${text}\n`);
});
