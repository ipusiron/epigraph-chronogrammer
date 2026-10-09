'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('../state.js');
for (const [key, value] of [['text', 'I'], ['mode', 'all'], ['min', '1601'], ['max', '1900'], ['match', 'exact']]) {
  test(`Changing ${key} invalidates every analysis result`, () => {
    const store = create();
    store.set('text', 'MMXXV');
    assert.equal(store.analyze().analysis.sum, 2025);
    assert.equal(store.set(key, value).analysis, null);
    assert.equal(store.read().analysisError, '');
  });
}
test('Clear followed by settings changes cannot revive results', () => {
  const store = create();
  store.set('text', 'M');
  store.analyze();
  store.clear();
  assert.equal(store.set('match', 'exact').analysis, null);
  assert.equal(store.read().input.text, '');
});
test('Invalid range removes old results and reports the problem', () => {
  const store = create();
  store.set('text', 'M');
  store.analyze();
  store.set('min', '3000');
  const result = store.analyze();
  assert.equal(result.analysis, null);
  assert.equal(result.analysisError, 'invalidRange');
});
test('Empty and no-numeral text are distinct', () => {
  const store = create();
  assert.equal(store.analyze().analysisError, 'emptyText');
  store.set('text', 'hello');
  assert.equal(store.analyze().analysis.sum, 0);
  assert.equal(store.read().analysis.letters, '');
});
test('Year editing invalidates generated examples only', () => {
  const store = create();
  store.set('text', 'M');
  store.analyze();
  store.generate();
  assert.equal(store.set('year', '2024.9').generated, null);
  assert.equal(store.read().analysis.sum, 1000);
  assert.equal(store.generate().generationError, 'invalidYear');
});
test('Reanalysis and unchanged language-independent input preserve meaning', () => {
  const store = create();
  store.set('text', 'MilLe Domini Christi');
  assert.equal(store.analyze().analysis.sum, 1650);
  const revision = store.read().revision;
  assert.equal(store.set('text', 'MilLe Domini Christi').revision, revision);
  store.set('mode', 'all');
  assert.equal(store.analyze().analysis.sum, 2705);
});
