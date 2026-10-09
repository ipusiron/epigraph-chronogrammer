'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

const vectors = [
  [1, 'I', 'I'], [4, 'IV', 'IIII'], [9, 'IX', 'VIIII'], [40, 'XL', 'XXXX'],
  [900, 'CM', 'DCCCC'], [1652, 'MDCLII', 'MDCLII'], [1999, 'MCMXCIX', 'MDCCCCLXXXXVIIII'],
  [2024, 'MMXXIV', 'MMXXIIII'], [2025, 'MMXXV', 'MMXXV'],
  [3999, 'MMMCMXCIX', 'MMMDCCCCLXXXXVIIII'], [9999, 'MMMMMMMMMCMXCIX', 'MMMMMMMMMDCCCCLXXXXVIIII']
];
for (const [year, normal, additive] of vectors) test(`Roman forms ${year}`, () => {
  assert.equal(core.roman(year), normal);
  assert.equal(core.roman(year, true), additive);
});
const samples = [
  ['MilLe Domini Christi', 'all', 'MILLDMIICII', 2705],
  ['MilLe Domini Christi', 'uppercase', 'MLDC', 1650],
  ['MilLe Domini Christi', 'positional', 'MI', 1001],
  ['franCIs goLDsMIth', 'uppercase', 'CILDMI', 1652],
  ['  M  ', 'positional', 'M', 1000],
  ['  M abc I  \r\nI\rV\n\n x ', 'positional', 'MIIVX', 1017],
  ['\u{1F600}I e\u0301V', 'uppercase', 'IV', 6],
  ['Ⅳ Ｍ ı', 'all', '', 0]
];
for (const [text, mode, letters, sum] of samples) test(`Extract ${mode}: ${JSON.stringify(text)}`, () => {
  const result = core.extract(text, mode);
  assert.equal(result.letters, letters);
  assert.equal(result.sum, sum);
  assert.equal(result.positions.map(i => text[i].toUpperCase()).join(''), letters);
  assert.equal(new Set(result.positions).size, result.positions.length);
});
test('Invalid years are never silently truncated or defaulted', () => {
  for (const value of ['', ' ', '1e3', '2024.9', '0x10', '-1', '１２', 0, 10000, 1.2, NaN, Infinity, null, true]) {
    assert.throws(() => core.parseYear(value), /invalidYear/);
  }
  assert.equal(core.parseYear(' 2024 '), 2024);
  assert.throws(() => core.range(2100, 1500), /invalidRange/);
});
test('No subtractive reading in chronograms', () => assert.equal(core.extract('IVIXCM').sum, 1117));
test('Subset and exact are distinct puzzles', () => {
  const counts = core.extract('MLDC').counts;
  assert.deepEqual(core.search(counts, 1500, 2100).candidates.map(c => c.year), [1500, 1550, 1600, 1650]);
  assert.deepEqual(core.search(counts, 1500, 2100, 'exact').candidates.map(c => c.year), [1650]);
  assert.equal(core.search(counts, 1500, 2100, 'subset', 2).total, 4);
  assert.equal(core.search(counts, 1500, 2100, 'subset', 2).candidates.length, 2);
});
test('Text length and invalid modes are bounded', () => {
  assert.equal(core.extract('M'.repeat(10000)).sum, 10000000);
  assert.throws(() => core.extract('M'.repeat(10001)), /tooLong/);
  assert.throws(() => core.extract('I', 'unknown'), /invalidMode/);
});
test('Every generated example for 1..9999 sums independently to its requested year', () => {
  const values = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  for (let year = 1; year <= 9999; year++) {
    const result = core.generate(year);
    assert.ok(result.examples.length >= 1 && result.examples.length <= 3);
    for (const sample of result.examples) {
      const sum = [...sample.text].reduce((total, char) => total + (values[char] || 0), 0);
      assert.equal(sum, year, `${year}: ${sample.text}`);
      assert.equal(core.extract(sample.text).sum, year);
      assert.equal(sample.sum, year);
      assert.ok(!sample.text.includes('<'));
    }
  }
});
test('Generation is deterministic and labels explanatory fallback', () => {
  assert.deepEqual(core.generate(2024), core.generate(2024));
  assert.equal(core.generate(9999).examples[0].kind, 'fallback');
  assert.equal(core.generate(9999).examples[0].text, 'example: MMMMMMMMMDCCCCLXXXXVIIII');
});
