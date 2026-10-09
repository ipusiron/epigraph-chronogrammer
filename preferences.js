(function () {
  'use strict';
  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* Optional preference. */ } }
  const saved = read('theme');
  const theme = ['light', 'dark'].includes(saved) ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  window.ChronogramPreferences = { read, write, language: 'ja' };
})();
