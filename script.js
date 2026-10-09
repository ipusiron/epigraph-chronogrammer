(function () {
  'use strict';
  const core = window.ChronogramCore, store = window.ChronogramState.create();
  const preferences = window.ChronogramPreferences;
  let language = preferences.language;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const t = (key, args = {}) => (window.ChronogramMessages[language][key] || window.ChronogramMessages[language].unexpected)
    .replace(/\{(\w+)\}/g, (_, name) => String(args[name] ?? ''));
  function node(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
  }
  function highlight(target, text, positions) {
    const fragment = document.createDocumentFragment();
    let start = 0;
    for (const index of positions) {
      fragment.append(document.createTextNode(text.slice(start, index)), node('mark', text[index], 'hl'));
      start = index + 1;
    }
    fragment.append(document.createTextNode(text.slice(start)));
    target.replaceChildren(fragment);
  }
  function themeLabel() {
    const key = document.documentElement.dataset.theme === 'dark' ? 'themeLight' : 'themeDark';
    $('#themeToggle').textContent = t(key);
  }
  function localize() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-century]').forEach(el => { el.textContent = t('century', { n: el.dataset.century }); });
    $('#inputText').placeholder = t('placeholder');
    $('#languageToggle').textContent = language === 'ja' ? 'English' : '日本語';
    $('#languageToggle').lang = language === 'ja' ? 'en' : 'ja';
    themeLabel();
    render();
  }
  function renderAnalysis() {
    const state = store.read(), a = state.analysis;
    $('#analysisResults').hidden = !a;
    $('#copyExtractBtn').disabled = !a || !a.letters;
    $('#clearInputBtn').disabled = !state.input.text;
    $('#analysisStatus').textContent = state.analysisError ? t(state.analysisError)
      : a ? (a.letters ? t('analysisDone', { sum: a.sum }) : t('noLetters'))
        : t(state.input.text ? 'pending' : 'emptyHint');
    $('#analysisStatus').classList.toggle('error', Boolean(state.analysisError));
    $('#inputText').setAttribute('aria-invalid', String(['emptyText', 'tooLong'].includes(state.analysisError)));
    for (const id of ['minYear', 'maxYear']) {
      $('#' + id).setAttribute('aria-invalid', String(['invalidYear', 'invalidRange'].includes(state.analysisError)));
    }
    if (['invalidYear', 'invalidRange'].includes(state.analysisError)) $('#puzzleDetails').open = true;
    $('#anagramCandidates').replaceChildren();
    if (!a) {
      for (const id of ['highlightView', 'extractedLetters', 'letterCounts', 'sumBreakdown', 'sumTotal', 'sumRoman', 'anagramSummary']) $('#' + id).replaceChildren();
      return;
    }
    highlight($('#highlightView'), a.text, a.positions);
    $('#extractedLetters').textContent = a.letters || '—';
    $('#letterCounts').textContent = core.KEYS.map(key => `${key}: ${a.counts[key]}`).join(' / ');
    $('#sumBreakdown').textContent = core.KEYS.filter(key => a.counts[key]).map(key => `${key}(${core.VALUES[key]}) × ${a.counts[key]}`).join(' + ') || '0';
    $('#sumTotal').textContent = t('sumTotal', { sum: a.sum });
    $('#sumRoman').textContent = a.sum > 0 && a.sum <= 9999 ? t('sumRoman', { roman: core.roman(a.sum) }) + (a.sum > 3999 ? ' ' + t('extendedRoman') : '') : t('outsideYear');
    $('#anagramSummary').textContent = t('countSummary', { total: a.puzzle.total, shown: a.puzzle.candidates.length });
    a.puzzle.candidates.forEach(c => $('#anagramCandidates').append(node('span', `${c.year} = ${c.roman}`, 'tag mono')));
  }
  function renderGenerated() {
    const state = store.read(), result = state.generated;
    $('#copyGeneratedBtn').disabled = !result;
    $('#generationStatus').classList.toggle('error', Boolean(state.generationError));
    $('#yearToMake').setAttribute('aria-invalid', String(Boolean(state.generationError)));
    $('#generationStatus').textContent = state.generationError ? t(state.generationError) : result
      ? t('generatedSummary', { year: result.year, count: result.examples.length }) : t('generationPending');
    $('#romanForYear').textContent = result ? t('notation', result) : '';
    $('#extendedRoman').hidden = !result || result.year < 4000;
    $('#generatedExamples').replaceChildren();
    if (!result) return;
    result.examples.forEach((sample, index) => {
      const card = node('article', '', 'card generated-card');
      card.append(node('h2', sample.kind === 'fallback' ? t('fallback') : t('template', { n: index + 1 })));
      const text = node('p', '', 'sample-text');
      text.lang = sample.lang;
      highlight(text, sample.text, core.extract(sample.text).positions);
      card.append(text);
      if (sample.kind === 'fallback') card.append(node('p', t('fallbackNote'), 'notice'));
      card.append(node('p', t('verified', { sum: sample.sum }), 'verified'));
      const copy = node('button', t('copyOne'));
      copy.type = 'button';
      copy.addEventListener('click', () => copyText(sample.text));
      card.append(copy);
      $('#generatedExamples').append(card);
    });
  }
  function render() { renderAnalysis(); renderGenerated(); $('#copyStatus').textContent = ''; }
  function change(key, value) { store.set(key, value); render(); }
  async function copyText(text) {
    const revision = store.read().revision;
    let key = 'copied';
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard');
      await navigator.clipboard.writeText(text);
    } catch (_) { key = 'copyFailed'; }
    if (revision === store.read().revision) $('#copyStatus').textContent = t(key);
  }
  function selectTab(name, focus = false) {
    $$('[role="tab"]').forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('active', active);
      const panel = $('#' + tab.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('active', active);
      if (active && focus) tab.focus();
    });
  }
  $$('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      const tabs = $$('[data-tab]'), index = tabs.indexOf(tab);
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next].dataset.tab, true);
    });
  });
  $('#inputText').addEventListener('input', event => change('text', event.target.value));
  for (const [id, field] of [['minYear', 'min'], ['maxYear', 'max'], ['yearToMake', 'year']]) {
    $('#' + id).addEventListener('input', event => change(field, event.target.value));
  }
  for (const [name, field] of [['extractionMode', 'mode'], ['anagramMode', 'match']]) {
    $$(`input[name="${name}"]`).forEach(el => el.addEventListener('change', event => change(field, event.target.value)));
  }
  $$('[data-range]').forEach(button => button.addEventListener('click', () => {
    const [min, max] = button.dataset.range.split(',');
    $('#minYear').value = min; $('#maxYear').value = max;
    store.set('min', min); store.set('max', max); render();
  }));
  $$('[data-text]').forEach(button => button.addEventListener('click', () => {
    $('#inputText').value = button.dataset.text;
    $('input[name="extractionMode"][value="uppercase"]').checked = true;
    store.set('text', button.dataset.text); store.set('mode', 'uppercase'); render();
  }));
  $('#analyzeBtn').addEventListener('click', () => { store.analyze(); render(); });
  $('#clearInputBtn').addEventListener('click', () => { $('#inputText').value = ''; store.clear(); render(); $('#inputText').focus(); });
  $('#makeChronogramBtn').addEventListener('click', () => { store.generate(); render(); });
  $('#copyExtractBtn').addEventListener('click', () => { const a = store.read().analysis; if (a && a.letters) copyText(a.letters); });
  $('#copyGeneratedBtn').addEventListener('click', () => { const g = store.read().generated; if (g) copyText(g.examples.map(x => x.text).join('\n\n')); });
  $('#themeToggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    preferences.write('theme', theme); themeLabel();
  });
  $('#languageToggle').addEventListener('click', () => {
    language = language === 'ja' ? 'en' : 'ja';
    preferences.write('language', language); localize();
  });
  localize();
})();
