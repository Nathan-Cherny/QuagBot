import test from 'node:test';
import assert from 'node:assert/strict';
import { locateHighlight, sectionParagraphs } from '../src/lib/ragHighlight.mjs';

const section = 'After Yorktown, diplomats took two years to conclude a peace treaty. Talks began in Paris in April 1782.';

test('finds an exact quote and returns its offsets', () => {
  const quote = 'After Yorktown, diplomats took two years to conclude a peace treaty.';
  const hit = locateHighlight([section], quote);
  assert.deepEqual(hit, { section: 0, start: 0, end: quote.length });
  assert.equal(section.slice(hit.start, hit.end), quote);
});

test('matches across differences in whitespace, quotes, case and extraction hyphens', () => {
  const text = ['The Americans negoti-ated secretly. “In endeavouring to assist you,” a Wea Indian complained.'];
  const hit = locateHighlight(text, '  the americans   negotiated secretly. "In endeavouring to assist you," ');
  assert.ok(hit);
  assert.equal(text[0].slice(hit.start, hit.end), 'The Americans negoti-ated secretly. “In endeavouring to assist you,”');
});

test('reports the paragraph the quote was found in', () => {
  const hit = locateHighlight(['First paragraph.', 'Second paragraph about Paris.'], 'about Paris');
  assert.equal(hit.section, 1);
});

test('returns null when the quote is absent or unusable', () => {
  assert.equal(locateHighlight([section], 'The Battle of Saratoga'), null);
  assert.equal(locateHighlight([section], ''), null);
  assert.equal(locateHighlight([section], undefined), null);
  assert.equal(locateHighlight([], 'anything'), null);
});

test('sectionParagraphs accepts an array or a single string and drops empty entries', () => {
  assert.deepEqual(sectionParagraphs(['a', '  ', 'b', 3]), ['a', 'b']);
  assert.deepEqual(sectionParagraphs('only'), ['only']);
  assert.deepEqual(sectionParagraphs(undefined), []);
});
