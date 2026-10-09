(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./composer-core.js'));
  else root.ChronogramEditor = factory(root.ChronogramComposer);
})(typeof globalThis === 'object' ? globalThis : this, function (composer) {
  'use strict';
  const HISTORY_LIMIT = 50;
  function create() {
    let input = { text: '', year: '2024' }, result = null, error = '', revision = 0;
    const history = [];
    function read() {
      return { input: { ...input }, result, error, revision, canUndo: history.length > 0, undoCount: history.length };
    }
    function calculate() {
      result = null; error = '';
      try {
        if (!input.text.trim()) return;
        result = composer.inspect(input.text, input.year);
      } catch (e) { error = e.message; }
    }
    function replace(text, year = input.year) {
      if (typeof text !== 'string' || typeof year !== 'string') throw new Error('invalidField');
      if (text === input.text && year === input.year) return read();
      history.push({ ...input });
      if (history.length > HISTORY_LIMIT) history.shift();
      input = { text, year }; revision++; calculate();
      return read();
    }
    function set(key, value) {
      if (!Object.hasOwn(input, key)) throw new Error('invalidField');
      return replace(key === 'text' ? value : input.text, key === 'year' ? value : input.year);
    }
    function undo() {
      if (history.length) { input = history.pop(); revision++; calculate(); }
      return read();
    }
    function clear() {
      input.text = ''; history.length = 0; revision++; calculate();
      return read();
    }
    function toggle(position) { return replace(composer.toggle(input.text, position)); }
    return Object.freeze({ read, set, replace, undo, clear, toggle });
  }
  return Object.freeze({ create, HISTORY_LIMIT });
});
