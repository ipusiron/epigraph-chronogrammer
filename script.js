// ====== Roman numeral helpers ======
const ROMAN_VALUES = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
const ROMAN_KEYS = Object.keys(ROMAN_VALUES);

// Convert integer year to canonical Roman numeral (subtractive notation)
function intToRoman(num){
  if(num <= 0) return "";
  const map = [
    { val:1000, sym:"M" },
    { val:900,  sym:"CM" },
    { val:500,  sym:"D" },
    { val:400,  sym:"CD" },
    { val:100,  sym:"C" },
    { val:90,   sym:"XC" },
    { val:50,   sym:"L" },
    { val:40,   sym:"XL" },
    { val:10,   sym:"X" },
    { val:9,    sym:"IX" },
    { val:5,    sym:"V" },
    { val:4,    sym:"IV" },
    { val:1,    sym:"I" },
  ];
  let res = "";
  for(const {val, sym} of map){
    while(num >= val){
      res += sym;
      num -= val;
    }
  }
  return res;
}

// Count letters of a string (only ROMAN_KEYS by default if filter=true)
function countLetters(str, filterToRoman=true){
  const counts = {};
  for(const ch of str){
    if(filterToRoman && !ROMAN_KEYS.includes(ch)) continue;
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

// Check if romanStr can be formed from available roman letter counts
// mode: 'subset' (default) allows partial use, 'exact' requires all letters to be used
function canFormFromCounts(romanStr, availableCounts, mode='subset'){
  const need = countLetters(romanStr, false);

  // Check if we have enough of each needed letter
  for(const k in need){
    if(!availableCounts[k] || availableCounts[k] < need[k]) return false;
  }

  // If exact mode, check that all available letters are used
  if(mode === 'exact'){
    for(const k in availableCounts){
      if(availableCounts[k] !== (need[k] || 0)) return false;
    }
  }

  return true;
}

// ====== Extraction and Highlight ======
// Extraction modes: 'all', 'uppercase', 'positional'
function extractRomanLetters(text, mode='all'){
  const letters = [];
  const lines = text.split('\n');

  if(mode === 'positional'){
    // Position-dependent: extract from line start, line end, first char, last char
    for(let i = 0; i < lines.length; i++){
      const line = lines[i].trim();
      if(!line) continue;

      // First character of line
      const first = line[0];
      if(first && ROMAN_KEYS.includes(first.toUpperCase())){
        letters.push(first.toUpperCase());
      }

      // Last character of line
      const last = line[line.length - 1];
      if(last && ROMAN_KEYS.includes(last.toUpperCase()) && line.length > 1){
        letters.push(last.toUpperCase());
      }
    }

    // First character of entire text
    const firstChar = text.trim()[0];
    if(firstChar && ROMAN_KEYS.includes(firstChar.toUpperCase())){
      if(!letters.includes(firstChar.toUpperCase())){
        letters.unshift(firstChar.toUpperCase());
      }
    }

    // Last character of entire text
    const lastChar = text.trim()[text.trim().length - 1];
    if(lastChar && ROMAN_KEYS.includes(lastChar.toUpperCase())){
      if(!letters.includes(lastChar.toUpperCase())){
        letters.push(lastChar.toUpperCase());
      }
    }
  } else if(mode === 'uppercase'){
    // Uppercase only
    for(const ch of text){
      if(ROMAN_KEYS.includes(ch) && ch === ch.toUpperCase()){
        letters.push(ch);
      }
    }
  } else {
    // All letters (default)
    for(const ch of text){
      const upper = ch.toUpperCase();
      if(ROMAN_KEYS.includes(upper)){
        letters.push(upper);
      }
    }
  }

  return letters;
}

function highlightRomanInText(text, mode='all'){
  const html = [];
  const lines = text.split('\n');

  if(mode === 'positional'){
    // Highlight positional characters
    for(let lineIdx = 0; lineIdx < lines.length; lineIdx++){
      const line = lines[lineIdx];
      for(let i = 0; i < line.length; i++){
        const ch = line[i];
        const isFirst = (i === 0 && line.trim().length > 0 && line.trim()[0] === ch);
        const trimmed = line.trim();
        const isLast = (trimmed.length > 1 && ch === trimmed[trimmed.length - 1] && i === line.lastIndexOf(trimmed[trimmed.length - 1]));
        const isRoman = ROMAN_KEYS.includes(ch.toUpperCase());

        if(isRoman && (isFirst || isLast)){
          html.push(`<span class="hl">${escapeHtml(ch)}</span>`);
        } else {
          html.push(escapeHtml(ch));
        }
      }
      if(lineIdx < lines.length - 1) html.push('\n');
    }
  } else if(mode === 'uppercase'){
    // Highlight uppercase Roman numerals only
    for(const ch of text){
      const isRoman = ROMAN_KEYS.includes(ch);
      if(isRoman && ch === ch.toUpperCase()){
        html.push(`<span class="hl">${escapeHtml(ch)}</span>`);
      } else {
        html.push(escapeHtml(ch));
      }
    }
  } else {
    // Highlight all Roman numerals
    for(const ch of text){
      const key = ch.toUpperCase();
      const isRoman = ROMAN_KEYS.includes(key);
      if(isRoman){
        html.push(`<span class="hl">${escapeHtml(ch)}</span>`);
      } else {
        html.push(escapeHtml(ch));
      }
    }
  }

  return html.join("");
}

function escapeHtml(s){
  return s.replace(/&/g,"&amp;")
          .replace(/</g,"&lt;")
          .replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;")
          .replace(/'/g,"&#x27;")
          .replace(/\//g,"&#x2F;");
}

// ====== Sum (historical chronogram) ======
// mode: 'addition' (default) - simple sum, 'subtraction' - apply roman numeral subtraction rules
function sumRomanLetters(letters, mode='addition'){
  let sum = 0;
  const steps = [];

  if(mode === 'subtraction'){
    // Apply subtractive notation rules (IV=4, IX=9, XL=40, XC=90, CD=400, CM=900)
    for(let i = 0; i < letters.length; i++){
      const current = ROMAN_VALUES[letters[i]] || 0;
      const next = i + 1 < letters.length ? (ROMAN_VALUES[letters[i+1]] || 0) : 0;

      if(current < next){
        // Subtraction case: smaller value before larger
        sum -= current;
        steps.push(`${letters[i]}=-${current}`);
      } else {
        // Addition case
        sum += current;
        steps.push(`${letters[i]}=+${current}`);
      }
    }
  } else {
    // Simple addition (historical chronogram method)
    for(const ch of letters){
      const v = ROMAN_VALUES[ch] || 0;
      sum += v;
      steps.push(`${ch}=${v}`);
    }
  }

  return { sum, steps };
}

// ====== Anagram search ======
function findAnagramYears(availableCounts, minYear, maxYear, maxShow=10, mode='subset'){
  const found = [];
  for(let y = Math.max(1, minYear); y <= Math.max(minYear, maxYear); y++){
    const roman = intToRoman(y);
    if(!roman) continue;
    if(canFormFromCounts(roman, availableCounts, mode)){
      found.push({ year:y, roman });
      if(found.length >= maxShow) break;
    }
  }
  return found;
}

// ====== UI bindings ======
const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>document.querySelectorAll(sel);

// Toast notification helper
function showToast(message, duration=2000){
  let toast = $('#toast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=>{
    toast.classList.remove('show');
  }, duration);
}

// Theme toggle
const themeToggle = $('#themeToggle');
const themeIcon = $('#themeIcon');
const themeLabel = $('#themeLabel');

// Load saved theme or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.dataset.theme = savedTheme;
updateThemeButton(savedTheme);

function updateThemeButton(theme){
  if(theme === 'light'){
    themeIcon.textContent = '🌙';
  } else {
    themeIcon.textContent = '☀️';
  }
}

themeToggle.addEventListener('click', ()=>{
  const currentTheme = document.body.dataset.theme;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
});

// Tabs
$$('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    $$('.panel').forEach(p=>p.classList.remove('active'));
    $('#panel-'+tab).classList.add('active');
  });
});

// Collapsible sidebar boxes (mobile)
$$('.box-toggle').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.dataset.box;
    const content = $(`[data-content="${id}"]`);
    btn.classList.toggle('open');
    content.classList.toggle('collapsed');
  });
});

// Year range presets
$$('.preset-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const [min, max] = btn.dataset.range.split(',').map(Number);
    $('#minYear').value = min;
    $('#maxYear').value = max;
    showToast(`範囲を${min}–${max}に設定しました`);
  });
});

// Example text presets
$$('.example-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const text = btn.dataset.text;
    $('#inputText').value = text;

    // Auto-select "大文字のみ" mode for these examples
    const uppercaseRadio = document.querySelector('input[name="extractionMode"][value="uppercase"]');
    if(uppercaseRadio) uppercaseRadio.checked = true;

    showToast(`例文を入力しました`);

    // Update button states after setting example
    updateButtonStates();
  });
});

// Accordion in study tab
$$('.accordion-header').forEach(header=>{
  header.addEventListener('click', ()=>{
    const section = header.dataset.section;
    const content = $(`[data-content="${section}"]`);
    const isOpen = header.classList.contains('open');

    // Toggle this section
    header.classList.toggle('open');
    content.classList.toggle('open');
  });
});

// No result mode toggle needed - both results shown simultaneously

// Update button states based on input and results
function updateButtonStates(){
  const text = $('#inputText').value || "";
  const hasInput = text.trim().length > 0;
  const hasResults = $('#extractedLetters').textContent.trim().length > 0 && $('#extractedLetters').textContent !== '（該当なし）';

  // Analyze and Clear buttons: enabled only if there's input
  $('#analyzeBtn').disabled = !hasInput;
  $('#clearInputBtn').disabled = !hasInput;

  // Copy Extract button: enabled only if there are results
  $('#copyExtractBtn').disabled = !hasResults;
}

// Initial state on page load
updateButtonStates();

// Update button states on input change
$('#inputText').addEventListener('input', updateButtonStates);

// Store extracted data for recomputation
let extractedData = {
  letters: [],
  counts: {},
  minYear: 1500,
  maxYear: 2100
};

// Main analysis function
function performAnalysis(){
  const text = $('#inputText').value || "";

  // Input validation: limit text length to prevent DoS
  const MAX_INPUT_LENGTH = 10000;
  if(text.length > MAX_INPUT_LENGTH){
    alert(`入力テキストが長すぎます。${MAX_INPUT_LENGTH}文字以内にしてください。`);
    return;
  }

  const mode = document.querySelector('input[name="extractionMode"]:checked').value;
  let minYear = parseInt($('#minYear').value,10);
  let maxYear = parseInt($('#maxYear').value,10);

  // Validate year ranges
  if(!Number.isFinite(minYear) || minYear < 1 || minYear > 9999) minYear = 1500;
  if(!Number.isFinite(maxYear) || maxYear < 1 || maxYear > 9999) maxYear = 2100;
  if(minYear > maxYear){ const t=minYear; minYear=maxYear; maxYear=t; $('#minYear').value=minYear; $('#maxYear').value=maxYear; }

  // Highlight in text
  $('#highlightView').innerHTML = highlightRomanInText(text, mode);

  // Extract sequence and counts
  const letters = extractRomanLetters(text, mode);
  $('#extractedLetters').textContent = letters.length ? letters.join(' ') : '（該当なし）';

  const counts = {};
  ROMAN_KEYS.forEach(k=>counts[k]=0);
  letters.forEach(ch=>counts[ch]++);
  const countsStr = ROMAN_KEYS.map(k=>`${k}:${counts[k]}`).join('  ');
  $('#letterCounts').textContent = countsStr;

  // Store extracted data for later recomputation
  extractedData = { letters, counts, minYear, maxYear };

  // Update results with current modes
  updateResults();

  // Update button states after analysis
  updateButtonStates();
}

// Update results based on current mode settings
function updateResults(){
  const anagramMode = document.querySelector('input[name="anagramMode"]:checked').value;
  const { letters, counts, minYear, maxYear } = extractedData;

  // Show/hide mode selectors based on whether we have results
  const anagramModeSelector = document.querySelector('.card.result-card:nth-child(1) .radio-group');
  const sumResultsContainer = document.querySelectorAll('.card.result-card:nth-child(2) > div');

  if(letters.length === 0){
    // Hide mode selector and results for anagram
    if(anagramModeSelector) anagramModeSelector.style.display = 'none';
    $('#anagramSummary').textContent = '';
    $('#anagramCandidates').innerHTML = '';

    // Hide results for sum
    sumResultsContainer.forEach(el => {
      if(!el.tagName || el.querySelector('h3')) return; // Skip if it's the h3 title
      el.style.display = 'none';
    });
    $('#sumBreakdown').textContent = '';
    $('#sumTotal').textContent = '';
    $('#sumRoman').textContent = '';
    return;
  }

  // Show mode selector and results
  if(anagramModeSelector) anagramModeSelector.style.display = '';
  sumResultsContainer.forEach(el => {
    if(!el.tagName || el.querySelector('h3')) return;
    el.style.display = '';
  });

  // Sum method (addition only)
  const { sum, steps } = sumRomanLetters(letters, 'addition');
  $('#sumBreakdown').textContent = steps.join(' + ');
  $('#sumTotal').textContent = `合計 = ${sum}`;
  $('#sumRoman').textContent = `（ローマ数字換算） ${intToRoman(sum)}`;

  // Anagram method (with mode)
  const av = counts; // available counts
  const candidates = findAnagramYears(av, minYear, maxYear, 12, anagramMode);
  $('#anagramSummary').textContent = candidates.length
    ? `候補: ${candidates.length}件（表示上限12件）`
    : `候補なし（範囲: ${minYear}–${maxYear}）`;
  const box = $('#anagramCandidates');
  box.innerHTML = "";
  candidates.forEach(c=>{
    const tag = document.createElement('span');
    tag.className = 'tag good mono';
    tag.textContent = `${c.year} = ${c.roman}`;
    box.appendChild(tag);
  });
}

// Analyze button
$('#analyzeBtn').addEventListener('click', performAnalysis);

// Listen for mode changes and update results in real-time
document.querySelectorAll('input[name="anagramMode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if(extractedData.letters.length > 0){
      updateResults();
    }
  });
});

$('#copyExtractBtn').addEventListener('click', async ()=>{
  const txt = [
    $('#extractedLetters').textContent.trim(),
    $('#letterCounts').textContent.trim()
  ].filter(Boolean).join('\n');
  if(!txt){ showToast('コピーする内容がありません'); return; }
  try{
    await navigator.clipboard.writeText(txt);
    showToast('✓ コピーしました');
  }catch(e){
    console.warn(e);
    showToast('コピーに失敗しました');
  }
});

$('#clearInputBtn').addEventListener('click', ()=>{
  $('#inputText').value = '';
  $('#highlightView').innerHTML = '';
  $('#extractedLetters').textContent = '';
  $('#letterCounts').textContent = '';
  $('#sumBreakdown').textContent = '';
  $('#sumTotal').textContent = '';
  $('#sumRoman').textContent = '';
  $('#anagramSummary').textContent = '';
  $('#anagramCandidates').innerHTML = '';

  // Update button states after clearing
  updateButtonStates();
});

// Generate
$('#makeChronogramBtn').addEventListener('click', ()=>{
  const year = parseInt($('#yearToMake').value, 10);

  // Validate year input
  if(!Number.isFinite(year) || year <= 0 || year > 9999){
    alert('正しい年号（1〜9999の整数）を入力してください。');
    return;
  }
  const roman = intToRoman(year);
  $('#romanForYear').textContent = `Roman: ${roman}`;

  const examples = buildChronogramExamples(year, roman);
  const wrap = $('#generatedExamples');
  wrap.innerHTML = '';
  examples.forEach((ex, idx)=>{
    const card = document.createElement('div');
    card.className = 'gen-card';

    const textDiv = document.createElement('div');
    textDiv.className = 'gen-text';
    const title = document.createElement('h3');
    title.className = 'gen-title';
    title.textContent = `文例 ${idx+1}`;
    const body = document.createElement('p');
    body.className = 'gen-body';
    body.innerHTML = ex;
    textDiv.appendChild(title);
    textDiv.appendChild(body);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'gen-copy-btn';
    copyBtn.textContent = 'コピー';
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(body.textContent);
        showToast('✓ コピーしました');
      }catch(e){
        console.warn(e);
        showToast('コピーに失敗しました');
      }
    });

    card.appendChild(textDiv);
    card.appendChild(copyBtn);
    wrap.appendChild(card);
  });
});

$('#copyGeneratedBtn').addEventListener('click', async ()=>{
  const nodes = Array.from(document.querySelectorAll('#generatedExamples .gen-body'));
  if(!nodes.length){ showToast('コピーする文例がありません'); return; }
  const text = nodes.map(n=>n.textContent).join('\n');
  try{
    await navigator.clipboard.writeText(text);
    showToast('✓ コピーしました');
  }catch(e){
    console.warn(e);
    showToast('コピーに失敗しました');
  }
});

// Build sample sentences (educational/simple)
function buildChronogramExamples(year, roman){
  // Disperse roman letters into words and mark them with <span class="hl">
  const mark = (s)=>s.split('').map(ch=>{
    if(ROMAN_KEYS.includes(ch)) return `<span class="hl">${ch}</span>`;
    return ch;
  }).join('');

  // More natural chronogram examples
  const examples = [];

  // Helper to distribute roman letters across a sentence template
  const distribute = (template) => {
    // Convert template to lowercase first
    const lowerTemplate = template.toLowerCase();
    const letters = roman.split('');
    const counts = {};
    letters.forEach(l => counts[l] = (counts[l] || 0) + 1);

    const needed = {...counts};
    const markedPositions = [];

    // Find positions where each letter appears and mark them
    for(const letter in needed){
      let count = needed[letter];
      const regex = new RegExp(letter.toLowerCase(), 'g');
      let match;
      const positions = [];
      while((match = regex.exec(lowerTemplate)) !== null){
        positions.push(match.index);
      }

      // Mark only the needed count of occurrences (from end to start)
      if(positions.length >= count){
        for(let i = positions.length - 1; i >= 0 && count > 0; i--){
          markedPositions.push({pos: positions[i], letter: letter.toUpperCase()});
          count--;
        }
      }
    }

    // Sort by position (descending) to insert from end
    markedPositions.sort((a, b) => b.pos - a.pos);

    let result = lowerTemplate;
    for(const {pos, letter} of markedPositions){
      const before = result.substring(0, pos);
      const after = result.substring(pos + 1);
      result = before + `<span class="hl">${letter}</span>` + after;
    }

    return result;
  };

  // Check if template has enough letters
  const checkAndDistribute = (template) => {
    const letters = roman.split('');
    const needed = {};
    letters.forEach(l => needed[l] = (needed[l] || 0) + 1);

    const available = {};
    for(const ch of template.toLowerCase()){
      if(ROMAN_KEYS.includes(ch.toUpperCase())){
        available[ch.toUpperCase()] = (available[ch.toUpperCase()] || 0) + 1;
      }
    }

    // Check if template has enough letters
    for(const letter in needed){
      if(!available[letter] || available[letter] < needed[letter]){
        return null; // Template doesn't have enough letters
      }
    }

    return distribute(template);
  };

  // Template pool for different patterns
  const templates = [
    'deo optimo maximo sacrum. vixit in pace, laboravit pro gloria dei.',
    'may the most gracious lord grant victory and prosperity to all nations in this divine age.',
    'in memoriam of those who served with valor, devotion and courage. their glorious legacy lives on.',
    'lord almighty, bless this sacred monument built in commemoration of your divine grace and eternal victory.',
    'this sacred chapel was erected in devotion to the almighty creator, may his divine light guide all nations.',
    'here lies a memorial to all devoted souls who lived with extraordinary courage, valor and conviction.',
    'constructed by royal decree, this magnificent edifice stands as a testament to divine providence and civic duty.'
  ];

  // Select templates that have enough letters
  let usedTemplates = [];
  for(const template of templates){
    const result = checkAndDistribute(template);
    if(result){
      usedTemplates.push(result);
      if(usedTemplates.length >= 3) break;
    }
  }

  // Add the templates
  usedTemplates.forEach(t => examples.push(t));

  // Simpler example with year reference
  examples.push(distribute(`this inscription commemorates the year ${year} represented as ${roman} in roman numerals`));

  // Japanese explanation
  examples.push(`西暦${year}年を示すクロノグラム：ローマ数字 ${mark(roman)} が文中に分散配置されています。`);

  return examples;
}
