'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
const messages = require('../messages.js');
test('Static translation keys all exist', () => {
  for (const [, key] of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) assert.ok(messages.ja[key], key);
});
test('Tab references exist and IDs are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of html.matchAll(/aria-(?:controls|labelledby|describedby)="([^"]+)"/g)) assert.ok(ids.includes(id), id);
});
test('Every century is non-overlapping with the correct lower bound', () => {
  const ranges = [...html.matchAll(/data-century="(\d+)" data-range="(\d+),(\d+)"/g)];
  assert.equal(ranges.length, 6);
  for (const [, n, a, b] of ranges) {
    assert.equal(+a, (+n - 1) * 100 + 1);
    assert.equal(+b, +n * 100);
  }
});
test('Rendering never parses user text as markup', () => {
  assert.doesNotMatch(script, /innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(|new Function/);
  assert.match(script, /createTextNode/);
  assert.match(script, /replaceChildren/);
});
test('Preferences initialize before styles and application code', () => {
  assert.ok(html.indexOf('src="preferences.js"') < html.indexOf('href="style.css"'));
  assert.ok(html.indexOf('src="core.js"') < html.indexOf('src="script.js"'));
});
