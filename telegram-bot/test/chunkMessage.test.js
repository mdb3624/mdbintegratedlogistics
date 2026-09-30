const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkMessage } = require('../src/chunkMessage');

test('returns a single chunk when text is under the limit', () => {
  assert.deepEqual(chunkMessage('hello', 4096), ['hello']);
});

test('returns a single chunk when text is exactly at the limit', () => {
  const text = 'a'.repeat(4096);
  const result = chunkMessage(text, 4096);
  assert.equal(result.length, 1);
  assert.equal(result[0].length, 4096);
});

test('splits text one character over the limit into two chunks', () => {
  const text = 'a'.repeat(4097);
  const result = chunkMessage(text, 4096);
  assert.equal(result.length, 2);
  assert.equal(result[0].length, 4096);
  assert.equal(result[1].length, 1);
});

test('splits very long text into multiple full chunks and preserves content', () => {
  const text = 'a'.repeat(10000);
  const result = chunkMessage(text, 4096);
  assert.equal(result.length, 3);
  assert.equal(result.join(''), text);
});
