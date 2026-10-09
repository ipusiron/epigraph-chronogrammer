(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.ChronogramComposer = factory(root.ChronogramCore);
})(typeof globalThis === 'object' ? globalThis : this, function (core) {
  'use strict';
  const PAGE_SIZE = 80;
  function inspect(text, target) {
    const extraction = core.extract(text, 'uppercase');
    const year = core.parseYear(target);
    const difference = year - extraction.sum;
    return {
      ...extraction, text, year, difference,
      status: difference === 0 ? 'matched' : difference > 0 ? 'short' : 'over',
      // This is a numerical example, not a claim that the draft contains these letters.
      hint: difference > 0 ? core.roman(difference, true) : ''
    };
  }
  function toggle(text, position) {
    core.extract(text);
    if (!Number.isInteger(position) || !/[IVXLCDMivxlcdm]/.test(text[position] || '')) {
      throw new Error('invalidPosition');
    }
    const char = text[position];
    const changed = char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
    return text.slice(0, position) + changed + text.slice(position + 1);
  }
  function preview(text, page = 0) {
    const positions = core.extract(text, 'all').positions;
    const pages = Math.max(1, Math.ceil(positions.length / PAGE_SIZE));
    if (!Number.isInteger(page) || page < 0 || page >= pages) throw new Error('invalidPage');
    const offset = page * PAGE_SIZE;
    const selected = positions.slice(offset, offset + PAGE_SIZE);
    const start = page === 0 ? 0 : positions[offset];
    const end = positions[offset + PAGE_SIZE] ?? text.length;
    return { start, end, positions: selected, page, pages, total: positions.length, offset };
  }
  return Object.freeze({ inspect, toggle, preview, PAGE_SIZE });
});
