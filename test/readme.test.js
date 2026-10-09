'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const composer = require('../composer-core.js');
const docs = ['README.md', 'README.en.md'].map(name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
const headings = [
  ['# Epigraph Chronogrammer - クロノグラム解析・生成ツール', '# Epigraph Chronogrammer - Chronogram Analyzer & Generator'],
  ['## 🌐 デモページ', '## 🌐 Demo'], ['## 📸 スクリーンショット', '## 📸 Screenshots'],
  ['## 📜 クロノグラムの原理', '## 📜 How chronograms work'], ['## ⚙️ 機能と使い方', '## ⚙️ Features and usage'],
  ['### 解析', '### Analyze'], ['### 補助パズル', '### Extra puzzle'], ['### 生成', '### Generate'],
  ['### 作文', '### Compose'],
  ['### 座学と表示設定', '### Learning and display preferences'],
  ['## 📝 検算できる例', '## 📝 Examples you can verify'], ['## 🎯 ユースケース', '## 🎯 Use cases'],
  ['## 🔒 安全性と限界', '## 🔒 Security and limitations'], ['## 🔗 参考資料', '## 🔗 References'],
  ['## 📁 ディレクトリー構造', '## 📁 Directory structure'], ['## 💻 動作環境とテスト', '## 💻 Environment and tests'],
  ['## 📄 ライセンス', '## 📄 License'], ['## 🛠️ このツールについて', '## 🛠️ About this tool']
];
test('README headings match completely in order and level', () => {
  docs.forEach((text, language) => assert.deepEqual(text.match(/^#{1,3} .+$/gm), headings.map(pair => pair[language])));
});
for (const [index, text] of docs.entries()) {
  test(`README ${index}: draft examples and shortage recipe recalculate`, () => {
    const rows = [...text.matchAll(/\| `([^`]+)` \| (\d+) \| (\d+) \| (-?\d+) \|/g)];
    assert.equal(rows.length, 3);
    for (const [, draft, year, sum, difference] of rows) {
      const result = composer.inspect(draft, year);
      assert.equal(result.sum, +sum);
      assert.equal(result.difference, +difference);
    }
    assert.ok(text.includes('`X + V + I + I + I`'));
    assert.equal(core.extract('X + V + I + I + I').sum, composer.inspect('MMVI', 2024).difference);
    for (const value of ['`MMVI`', '`XVIII`', '2006', '2024', '18']) {
      const section = text.slice(text.indexOf(index ? '## 🎯 Use cases' : '## 🎯 ユースケース'));
      assert.ok(section.includes(value));
    }
  });
  test(`README ${index}: every extraction table row recalculates correctly`, () => {
    const rows = [...text.matchAll(/\| `([^`]+)` \| `(all|uppercase|positional)` \| `([^`]+)` \| (\d+) \|/g)];
    assert.equal(rows.length, 7);
    for (const [, input, mode, letters, sum] of rows) {
      const actual = core.extract(input, mode);
      assert.equal(actual.letters, letters);
      assert.equal(actual.sum, Number(sum));
    }
  });
  test(`README ${index}: conventional and additive examples recalculate`, () => {
    const rows = [...text.matchAll(/\| (\d+) \| `([IVXLCDM]+)` \| `([IVXLCDM]+)` \|/g)];
    assert.equal(rows.length, 4);
    for (const [, year, normal, additive] of rows) {
      assert.equal(core.roman(year), normal);
      assert.equal(core.roman(year, true), additive);
      assert.equal(core.extract(additive).sum, +year);
    }
  });
  test(`README ${index}: local links exist and history-of-changes prose is absent`, () => {
    for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(link) || link.startsWith('#')) continue;
      assert.ok(fs.existsSync(path.join(__dirname, '..', link)), link);
    }
    assert.doesNotMatch(text, /previously|used to|earlier version|formerly|改修前|以前は/i);
  });
  test(`README ${index}: use-case values agree with the calculator`, () => {
    const start = index === 0 ? '## 🎯 ユースケース' : '## 🎯 Use cases';
    const end = index === 0 ? '## 🔒 安全性と限界' : '## 🔒 Security and limitations';
    const section = text.slice(text.indexOf(start), text.indexOf(end));
    for (const [input, mode] of [['MilLe Domini Christi', 'uppercase'], ['MilLe Domini Christi', 'all'], ['CILDMI', 'uppercase'], ['IMDLIC', 'uppercase']]) {
      assert.ok(section.includes('`' + input + '`'));
      assert.ok(section.includes(String(core.extract(input, mode).sum)));
    }
    const generated = core.generate(2024);
    assert.ok(section.includes('`' + generated.roman + '`'));
    assert.ok(section.includes('`' + generated.additive + '`'));
    assert.ok(generated.examples.every(e => core.extract(e.text).sum === 2024));
    const subset = core.search(core.extract('MLDC').counts, 1500, 2100);
    assert.deepEqual(subset.candidates.map(c => c.year), [1500, 1550, 1600, 1650]);
    assert.equal(subset.total, 4);
    for (const year of subset.candidates.map(c => c.year)) assert.ok(text.includes(String(year)));
  });
}
test('English is a complete companion with matching tables and screenshots', () => {
  const rows = text => text.split('\n').filter(line => /^\| (?:`|\d)/.test(line));
  assert.deepEqual(rows(docs[0]), rows(docs[1]));
  const images = text => [...text.matchAll(/\]\((assets\/[^)]+)\)/g)].map(m => m[1].replace('/en/', '/'));
  assert.deepEqual(images(docs[0]), images(docs[1]));
  assert.ok(docs[1].startsWith('English · [日本語](README.md)'));
  assert.doesNotMatch(docs[1].split('\n').slice(1).join('\n'), /[\u3040-\u30ff\u3400-\u9fff]/);
});
