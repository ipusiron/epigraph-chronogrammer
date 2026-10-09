'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
test('Composer scripts have no network, storage or markup execution sinks', () => {
  for (const name of ['composer-core.js', 'composer-state.js', 'script.js']) {
    assert.doesNotMatch(read(name), /innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(|new Function/);
    assert.doesNotMatch(read(name), /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
  }
});
test('Composer dependencies load before the UI and provide labels and status', () => {
  const html = read('index.html');
  for (const [a, b] of [['core.js', 'composer-core.js'], ['composer-core.js', 'composer-state.js'], ['composer-state.js', 'script.js']]) {
    assert.ok(html.indexOf(`src="${a}"`) < html.indexOf(`src="${b}"`));
  }
  for (const id of ['composeText', 'composeYear', 'composeMemo']) assert.match(html, new RegExp(`for="${id}"`));
  assert.match(html, /id="composeStatus"[^>]*role="status"/);
  assert.match(html, /id="composeMemo"[^>]*readonly/);
});
test('Public exports and bounded history are wired without storing drafts', () => {
  const script = read('script.js');
  assert.match(script, /compositionstart/);
  assert.match(script, /compositionend/);
  assert.match(script, /isComposing/);
  assert.match(script, /setSelectionRange/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /replaceDraft/);
  assert.match(script, /replaceAnalysis/);
});
