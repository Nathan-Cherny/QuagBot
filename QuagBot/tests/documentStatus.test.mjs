import test from 'node:test';
import assert from 'node:assert/strict';
import { describeDocument, documentQuestion } from '../src/lib/documentStatus.mjs';

test('documents are ready only when embedding completed with searchable chunks', () => {
  assert.equal(describeDocument({ embedding_status: 'completed', chunk_count: 179 }), 'Ready to ask');
  assert.equal(describeDocument({ embedding_status: 'completed', chunk_count: 0 }), 'No searchable text');
  assert.equal(describeDocument({ embedding_status: 'completed', chunk_count: null }), 'Status unavailable');
  assert.equal(describeDocument({ embedding_status: 'pending', chunk_count: 1 }), 'Processing');
  assert.equal(describeDocument({ embedding_status: 'failed', chunk_count: 1 }), 'Processing failed');
  assert.equal(describeDocument({ embedding_status: 'unknown', chunk_count: 1 }), 'Status unavailable');
});

test('the document shortcut drafts an editable question naming the file', () => {
  assert.equal(documentQuestion('  Yorktown.pdf '), 'What are the main ideas in “Yorktown.pdf”?');
  assert.equal(documentQuestion(null), '');
});
