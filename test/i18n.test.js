'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const messages = require('../messages.js');
test('Japanese and English message keys and placeholders match', () => {
  assert.deepEqual(Object.keys(messages.ja).sort(), Object.keys(messages.en).sort());
  for (const key of Object.keys(messages.ja)) {
    assert.ok(messages.en[key].trim(), key);
    assert.deepEqual(messages.ja[key].match(/\{\w+\}/g), messages.en[key].match(/\{\w+\}/g), key);
    if (key !== 'languageSwitch') assert.doesNotMatch(messages.en[key], /[\u3040-\u30ff\u3400-\u9fff]/, key);
  }
});
const source = fs.readFileSync(path.join(__dirname, '../preferences.js'), 'utf8');
function resolve(search, stored, browserLanguage, systemDark, blocked = false) {
  const context = { URLSearchParams, location: { search }, navigator: { language: browserLanguage },
    document: { documentElement: { dataset: {} } }, window: {},
    matchMedia: () => ({ matches: systemDark }),
    localStorage: { getItem: key => { if (blocked) throw new Error('blocked'); return stored[key]; },
      setItem: () => { if (blocked) throw new Error('blocked'); } }
  };
  vm.runInNewContext(source, context);
  return context;
}
test('Language priority is query, storage, then browser', () => {
  assert.equal(resolve('?lang=en', { language: 'ja' }, 'ja-JP', false).window.ChronogramPreferences.language, 'en');
  assert.equal(resolve('?lang=unknown', { language: 'en' }, 'ja-JP', false).window.ChronogramPreferences.language, 'en');
  assert.equal(resolve('', {}, 'ja-JP', false).window.ChronogramPreferences.language, 'ja');
  assert.equal(resolve('', {}, 'fr-FR', false).window.ChronogramPreferences.language, 'en');
});
test('Theme priority and storage failure are safe before rendering', () => {
  assert.equal(resolve('', { theme: 'light' }, 'en', true).document.documentElement.dataset.theme, 'light');
  assert.equal(resolve('', { theme: 'invalid' }, 'en', true).document.documentElement.dataset.theme, 'dark');
  const blocked = resolve('?lang=ja', {}, 'en', false, true);
  assert.equal(blocked.document.documentElement.dataset.theme, 'light');
  assert.equal(blocked.window.ChronogramPreferences.language, 'ja');
  assert.doesNotThrow(() => blocked.window.ChronogramPreferences.write('theme', 'dark'));
});
test('UI event code has no hard-coded Japanese messages', () => {
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8'), /[\u3040-\u30ff\u3400-\u9fff]/);
});
