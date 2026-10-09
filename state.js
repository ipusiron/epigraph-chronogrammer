(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.ChronogramState = factory(root.ChronogramCore);
})(typeof globalThis === 'object' ? globalThis : this, function (core) {
  'use strict';
  function create() {
    const input = { text: '', mode: 'uppercase', min: '1500', max: '2100', match: 'subset', year: '2025' };
    let analysis = null, generated = null, analysisError = '', generationError = '', revision = 0;
    function read() {
      return { input: { ...input }, analysis, generated, analysisError, generationError, revision };
    }
    function set(key, value) {
      if (!Object.hasOwn(input, key)) throw new Error('invalidField');
      if (input[key] === value) return read();
      input[key] = value;
      revision++;
      if (key === 'year') { generated = null; generationError = ''; }
      else { analysis = null; analysisError = ''; }
      return read();
    }
    function analyze() {
      analysis = null;
      analysisError = '';
      revision++;
      try {
        if (!input.text.trim()) throw new Error('emptyText');
        const extraction = core.extract(input.text, input.mode);
        const puzzle = core.search(extraction.counts, input.min, input.max, input.match);
        analysis = { ...extraction, puzzle, text: input.text, mode: input.mode };
      } catch (error) { analysisError = error.message; }
      return read();
    }
    function generate() {
      generated = null;
      generationError = '';
      revision++;
      try { generated = core.generate(input.year); }
      catch (error) { generationError = error.message; }
      return read();
    }
    function clear() {
      input.text = '';
      analysis = null;
      analysisError = '';
      revision++;
      return read();
    }
    return Object.freeze({ read, set, analyze, generate, clear });
  }
  return Object.freeze({ create });
});
