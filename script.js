(function () {
  'use strict';
  const core = window.ChronogramCore, store = window.ChronogramState.create();
  const preferences = window.ChronogramPreferences;
  const composer = window.ChronogramComposer, editor = window.ChronogramEditor.create();
  let composePage = 0, composing = false, uiRevision = 0, activeLetter = 0;
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
    uiRevision++;
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    $('meta[name="description"]').content = t('subtitle');
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-century]').forEach(el => { el.textContent = t('century', { n: el.dataset.century }); });
    $('#inputText').placeholder = t('placeholder');
    $('#languageToggle').textContent = t('languageSwitch');
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
      const actions = node('div', '', 'btn-row');
      actions.append(copy);
      for (const [label, destination] of [['editExample', 'compose'], ['analyzeExample', 'analyze']]) {
        const transfer = node('button', t(label));
        transfer.type = 'button';
        transfer.dataset.destination = destination;
        transfer.addEventListener('click', () => transferExample(sample.text, result.year, destination));
        actions.append(transfer);
      }
      card.append(actions);
      $('#generatedExamples').append(card);
    });
  }
  function transferExample(text, year, destination) {
    if (destination === 'compose') {
      const current = editor.read().input;
      if (current.text && (current.text !== text || current.year !== String(year)) && !window.confirm(t('replaceDraft'))) return;
      editor.replace(text, String(year)); composePage = 0;
      syncEditorInputs(); renderComposer(); selectTab('compose'); $('#composeText').focus();
    } else {
      const current = store.read().input.text;
      if (current && current !== text && !window.confirm(t('replaceAnalysis'))) return;
      $('#inputText').value = text;
      $('input[name="extractionMode"][value="uppercase"]').checked = true;
      store.set('text', text); store.set('mode', 'uppercase');
      // Invalidate even when the identical example was already analyzed.
      store.clear(); store.set('text', text);
      renderAnalysis(); selectTab('analyze'); $('#inputText').focus();
      $('#analysisStatus').textContent = t('transferAnalysis');
    }
    uiRevision++; $('#copyStatus').textContent = '';
  }
  function syncEditorInputs() {
    const input = editor.read().input;
    $('#composeText').value = input.text; $('#composeYear').value = input.year;
  }
  function renderComposer() {
    const state = editor.read(), result = composing ? null : state.result;
    $('#composeUndo').disabled = composing || !state.canUndo;
    $('#composeClear').disabled = composing || (!state.input.text && !state.canUndo);
    $('#composeCopy').disabled = composing || !state.input.text || state.input.text.length > core.LIMIT;
    $('#composeMemoCopy').disabled = !result;
    $('#composeStatus').classList.toggle('error', Boolean(state.error) && !composing);
    $('#composeYear').setAttribute('aria-invalid', String(state.error === 'invalidYear'));
    $('#composeText').setAttribute('aria-invalid', String(state.error === 'tooLong'));
    const status = result ? { short: 'composeShort', over: 'composeOver', matched: 'composeMatched' }[result.status] : '';
    $('#composeStatus').textContent = composing ? t('composing') : state.error ? t(state.error)
      : result ? t(status, { ...result, amount: Math.abs(result.difference) }) : t('composeEmpty');
    $('#composeHint').textContent = result && result.hint ? t('composeHint', { letters: result.hint.split('').join(' + ') }) : '';
    $('#composeCounts').textContent = result ? core.KEYS.map(k => `${k}: ${result.counts[k]}`).join(' / ') : '';
    $('#composeMemo').value = result ? t('memoFormat', {
      ...result, mode: t('uppercase'), letters: result.letters || '—', limit: t('composeLimits')
    }) : '';
    const target = $('#composePreview'); target.replaceChildren();
    $('#composePaging').hidden = true;
    if (composing || state.input.text.length > core.LIMIT) return;
    const first = composer.preview(state.input.text);
    composePage = Math.min(composePage, first.pages - 1);
    const part = composer.preview(state.input.text, composePage);
    let start = part.start;
    part.positions.forEach((position, index) => {
      target.append(document.createTextNode(state.input.text.slice(start, position)));
      const letter = state.input.text[position], control = node('button', letter, 'letter-control');
      control.type = 'button'; control.dataset.position = String(position);
      control.tabIndex = index === Math.min(activeLetter, part.positions.length - 1) ? 0 : -1;
      control.setAttribute('aria-pressed', String(letter === letter.toUpperCase()));
      control.setAttribute('aria-label', t('letterControl', {
        n: part.offset + index + 1, letter, value: core.VALUES[letter.toUpperCase()]
      }));
      control.addEventListener('click', () => {
        activeLetter = index;
        const input = $('#composeText'), selection = [input.selectionStart, input.selectionEnd, input.selectionDirection];
        editor.toggle(position); syncEditorInputs(); renderComposer();
        input.setSelectionRange(...selection);
        $(`#composePreview [data-position="${position}"]`).focus();
        $('#copyStatus').textContent = '';
      });
      control.addEventListener('keydown', event => {
        const next = { ArrowRight: Math.min(index + 1, part.positions.length - 1),
          ArrowLeft: Math.max(index - 1, 0), Home: 0, End: part.positions.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault(); activeLetter = next;
        const controls = $$('#composePreview button');
        controls.forEach((button, i) => { button.tabIndex = i === next ? 0 : -1; });
        controls[next].focus();
      });
      target.append(control); start = position + 1;
    });
    target.append(document.createTextNode(state.input.text.slice(start, part.end)));
    $('#composePaging').hidden = part.pages < 2;
    $('#composePrevious').disabled = composePage === 0;
    $('#composeNext').disabled = composePage === part.pages - 1;
    $('#composePageInfo').textContent = t('pageInfo', {
      first: part.offset + 1, last: part.offset + part.positions.length, total: part.total
    });
  }
  function render() { renderAnalysis(); renderGenerated(); renderComposer(); $('#copyStatus').textContent = ''; }
  function change(key, value) { store.set(key, value); render(); }
  async function copyText(text) {
    const revision = `${store.read().revision}/${editor.read().revision}/${uiRevision}`;
    let key = 'copied';
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard');
      await navigator.clipboard.writeText(text);
    } catch (_) { key = 'copyFailed'; }
    if (revision === `${store.read().revision}/${editor.read().revision}/${uiRevision}`) $('#copyStatus').textContent = t(key);
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
  $('#languageToggle').hidden = false;
  function editDraft(field, value) {
    editor.set(field, value); composePage = 0; activeLetter = 0; renderComposer(); $('#copyStatus').textContent = '';
  }
  $('#composeText').addEventListener('compositionstart', () => { composing = true; uiRevision++; renderComposer(); });
  $('#composeText').addEventListener('compositionend', event => { composing = false; editDraft('text', event.target.value); });
  $('#composeText').addEventListener('input', event => {
    if (!event.isComposing && !composing) editDraft('text', event.target.value);
  });
  $('#composeYear').addEventListener('input', event => editDraft('year', event.target.value));
  $('#composeUndo').addEventListener('click', () => {
    editor.undo(); composePage = 0; syncEditorInputs(); renderComposer(); $('#copyStatus').textContent = '';
  });
  $('#composeClear').addEventListener('click', () => {
    editor.clear(); composePage = 0; syncEditorInputs(); renderComposer(); $('#copyStatus').textContent = ''; $('#composeText').focus();
  });
  $('#composeCopy').addEventListener('click', () => { if (!composing) copyText(editor.read().input.text); });
  $('#composeMemoCopy').addEventListener('click', () => {
    if (editor.read().result && !composing) {
      $('#composeMemoDetails').open = true; copyText($('#composeMemo').value);
    }
  });
  for (const [id, offset] of [['composePrevious', -1], ['composeNext', 1]]) {
    $('#' + id).addEventListener('click', () => {
      composePage += offset; activeLetter = 0; renderComposer(); $('#composePreview button')?.focus();
    });
  }
  localize();
})();
