'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const composer = require('../composer-core.js');
const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const sum = text => [...text].reduce((n, c) => n + (values[c] || 0), 0);

test('Composer known answers: shortage, excess, match and Unicode positions', () => {
  for (const [text, target, total, difference, status] of [
    ['MMVI', 2024, 2006, 18, 'short'], ['MML', 2024, 2050, -26, 'over'],
    ['MMXXIIII', 2024, 2024, 0, 'matched'], ['😀i V', 6, 5, 1, 'short']
  ]) {
    const result = composer.inspect(text, target);
    assert.equal(result.sum, total);
    assert.equal(result.difference, difference);
    assert.equal(result.status, status);
    assert.equal(result.text, text);
  }
  assert.equal(composer.inspect('MMVI', 2024).hint, 'XVIII');
  assert.equal(composer.inspect('MML', 2024).hint, '');
  assert.equal(composer.toggle('😀i V', 2), '😀I V');
});
test('Numerical hints independently cover every possible positive difference', () => {
  for (let target = 1; target <= 9999; target++) {
    assert.equal(sum(composer.inspect('hello', target).hint), target);
  }
});
test('Toggling changes exactly one ASCII numeral and is reversible', () => {
  const text = '😀iVxLcDm\r\n IV Ｍ Ⅳ ı';
  for (const position of core.extract(text, 'all').positions) {
    const changed = composer.toggle(text, position);
    assert.equal(changed.length, text.length);
    assert.equal(composer.toggle(changed, position), text);
    assert.equal(sum(changed), composer.inspect(changed, 2024).sum);
  }
  for (const p of [-1, 0, 1, 99, 2.5, '2']) assert.throws(() => composer.toggle(text, p), /invalidPosition/);
});
test('Composer validates years and bounds without silently changing text', () => {
  for (const year of ['', 0, 10000, '2e3', '2.5', '２０２４']) assert.throws(() => composer.inspect('I', year));
  assert.throws(() => composer.inspect('I'.repeat(10001), 1), /tooLong/);
  const result = composer.inspect('M'.repeat(10000), 1);
  assert.equal(result.sum, 10000000);
  assert.equal(result.difference, -9999999);
  assert.equal(result.hint, '');
  assert.equal(composer.inspect('Ⅳ Ｍ ı', 1).sum, 0);
});
test('Preview pagination covers original text once without splitting surrogate pairs', () => {
  const text = '😀intro ' + 'i😀\r\n'.repeat(201) + ' end';
  const first = composer.preview(text);
  let restored = '', positions = [];
  for (let page = 0; page < first.pages; page++) {
    const result = composer.preview(text, page);
    assert.ok(result.positions.length <= 80);
    restored += text.slice(result.start, result.end);
    positions.push(...result.positions);
  }
  assert.equal(restored, text);
  assert.deepEqual(positions, core.extract(text, 'all').positions);
  assert.equal(composer.preview('hello').total, 2);
  assert.equal(composer.preview('abc').pages, 1);
  assert.throws(() => composer.preview('I', 1), /invalidPage/);
  assert.throws(() => composer.preview('I', -1), /invalidPage/);
});
