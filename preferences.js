(function () {
  'use strict';
  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* Optional preference. */ } }
  const saved = read('theme');
  const theme = ['light', 'dark'].includes(saved) ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  const query = new URLSearchParams(location.search).get('lang');
  const stored = read('language');
  const language = ['ja', 'en'].includes(query) ? query : ['ja', 'en'].includes(stored) ? stored
    : navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  document.documentElement.lang = language;
  window.ChronogramPreferences = { read, write, language };
})();
