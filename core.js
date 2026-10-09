(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChronogramCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const VALUES = Object.freeze({ I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 });
  const KEYS = Object.freeze(Object.keys(VALUES));
  const LIMIT = 10000;
  const descending = [['M', 1000], ['D', 500], ['C', 100], ['L', 50], ['X', 10], ['V', 5], ['I', 1]];
  const subtractive = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90],
    ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
  const templates = Object.freeze([
    'deo optimo maximo sacrum. vixit in pace, laboravit pro gloria dei.',
    'may the most gracious lord grant victory and prosperity to all nations in this divine age.',
    'in memoriam of those who served with valor, devotion and courage. their glorious legacy lives on.',
    'lord almighty, bless this sacred monument built in commemoration of your divine grace and eternal victory.',
    'this sacred chapel was erected in devotion to the almighty creator, may his divine light guide all nations.',
    'here lies a memorial to all devoted souls who lived with extraordinary courage, valor and conviction.',
    'constructed by royal decree, this magnificent edifice stands as a testament to divine providence and civic duty.'
  ]);

  function fail(code) { throw new Error(code); }
  function parseYear(value) {
    if (typeof value !== 'number' && typeof value !== 'string') fail('invalidYear');
    if (typeof value === 'string' && !/^[0-9]+$/.test(value.trim())) fail('invalidYear');
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 9999) fail('invalidYear');
    return n;
  }
  function range(min, max) {
    const a = parseYear(min), b = parseYear(max);
    if (a > b) fail('invalidRange');
    return [a, b];
  }
  function roman(value, additive = false) {
    let n = parseYear(value), out = '';
    for (const [symbol, amount] of additive ? descending : subtractive) {
      const count = Math.floor(n / amount);
      out += symbol.repeat(count);
      n %= amount;
    }
    return out;
  }
  function checkText(text) {
    if (typeof text !== 'string') fail('invalidText');
    if (text.length > LIMIT) fail('tooLong');
  }
  function extract(text, mode = 'uppercase') {
    checkText(text);
    if (!['all', 'uppercase', 'positional'].includes(mode)) fail('invalidMode');
    const positions = [];
    if (mode === 'positional') {
      for (const match of text.matchAll(/[^\r\n]+/g)) {
        const trimmed = match[0].trim();
        if (!trimmed) continue;
        const first = match.index + match[0].indexOf(trimmed);
        const last = first + trimmed.length - 1;
        if (/[IVXLCDMivxlcdm]/.test(text[first])) positions.push(first);
        if (last !== first && /[IVXLCDMivxlcdm]/.test(text[last])) positions.push(last);
      }
    } else {
      const pattern = mode === 'all' ? /[IVXLCDMivxlcdm]/g : /[IVXLCDM]/g;
      for (const match of text.matchAll(pattern)) positions.push(match.index);
    }
    const letters = positions.map(i => text[i].toUpperCase()).join('');
    const counts = Object.fromEntries(KEYS.map(k => [k, 0]));
    for (const letter of letters) counts[letter]++;
    const sum = KEYS.reduce((total, key) => total + VALUES[key] * counts[key], 0);
    return { positions, letters, counts, sum };
  }
  function search(counts, min, max, mode = 'subset', limit = 12) {
    const [a, b] = range(min, max);
    if (!['subset', 'exact'].includes(mode)) fail('invalidMode');
    if (!Number.isInteger(limit) || limit < 1 || limit > 9999) fail('invalidLimit');
    for (const key of KEYS) {
      if (!Number.isInteger(counts[key] || 0) || (counts[key] || 0) < 0) fail('invalidCounts');
    }
    const candidates = [];
    let total = 0;
    for (let year = a; year <= b; year++) {
      const notation = roman(year), needed = extract(notation).counts;
      if (!KEYS.every(key => mode === 'exact' ? needed[key] === (counts[key] || 0) : needed[key] <= (counts[key] || 0))) continue;
      total++;
      if (candidates.length < limit) candidates.push({ year, roman: notation });
    }
    return { total, candidates };
  }
  function distribute(template, symbols) {
    const available = extract(template, 'all').counts;
    const needed = extract(symbols).counts;
    if (KEYS.some(key => available[key] < needed[key])) return null;
    let text = '';
    for (const char of template.toLowerCase()) {
      const key = char.toUpperCase();
      if (needed[key] > 0) { text += key; needed[key]--; }
      else text += char;
    }
    return text;
  }
  function generate(value) {
    const year = parseYear(value), additive = roman(year, true);
    const examples = [];
    for (let i = 0; i < templates.length && examples.length < 3; i++) {
      const text = distribute(templates[i], additive);
      if (text !== null) examples.push({ text, kind: 'template', lang: i === 0 ? 'la' : 'en' });
    }
    if (!examples.length) examples.push({ text: `example: ${additive}`, kind: 'fallback', lang: 'en' });
    for (const example of examples) {
      example.sum = extract(example.text).sum;
      if (example.sum !== year) fail('generationMismatch');
    }
    return { year, roman: roman(year), additive, examples };
  }
  return Object.freeze({ VALUES, KEYS, LIMIT, parseYear, range, roman, extract, search, generate });
});
