'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { create, HISTORY_LIMIT } = require('../composer-state.js');
const analysis = require('../state.js');

test('Each editor mutation recalculates from current input', () => {
  const editor = create();
  assert.equal(editor.read().result, null);
  editor.set('text', 'MMVI');
  assert.equal(editor.read().result.difference, 18);
  editor.set('year', '2006');
  assert.equal(editor.read().result.status, 'matched');
  editor.toggle(0);
  assert.equal(editor.read().result.difference, 1000);
  editor.undo();
  assert.equal(editor.read().input.text, 'MMVI');
  assert.equal(editor.read().result.status, 'matched');
  editor.undo();
  assert.equal(editor.read().input.year, '2024');
  assert.equal(editor.read().result.difference, 18);
});
test('Invalid editing cannot leave valid results or a usable memo behind', () => {
  const editor = create(); editor.set('text', 'I');
  editor.set('year', '2024.9');
  assert.equal(editor.read().result, null);
  assert.equal(editor.read().error, 'invalidYear');
  editor.undo(); assert.equal(editor.read().result.year, 2024);
  editor.set('text', 'M'.repeat(10001));
  assert.equal(editor.read().error, 'tooLong');
  assert.equal(editor.read().result, null);
});
test('Clear erases the undo history without touching other tabs', () => {
  const store = analysis.create(), editor = create();
  store.set('text', 'CILDMI'); store.analyze(); store.generate();
  const before = store.read();
  editor.replace('MMVI', '2024'); editor.toggle(0); editor.clear(); editor.undo();
  assert.equal(editor.read().input.text, '');
  assert.equal(editor.read().result, null);
  assert.equal(editor.read().canUndo, false);
  assert.deepEqual(store.read(), before);
});
test('Replacing a draft and its target is one reversible operation', () => {
  const editor = create(); editor.replace('I', '1');
  editor.replace('MMXXIIII', '2024');
  assert.equal(editor.read().result.status, 'matched');
  editor.undo();
  assert.deepEqual(editor.read().input, { text: 'I', year: '1' });
});
test('Undo is bounded and no-op reads/updates preserve the revision', () => {
  const editor = create(); editor.set('text', 'I');
  const revision = editor.read().revision;
  editor.set('text', 'I');
  assert.equal(editor.read().revision, revision);
  for (let i = 0; i < 100; i++) editor.set('year', String(i + 1));
  assert.equal(editor.read().undoCount, HISTORY_LIMIT);
  for (let i = 0; i < 100; i++) editor.undo();
  assert.equal(editor.read().canUndo, false);
  assert.throws(() => editor.set('unknown', ''), /invalidField/);
});
