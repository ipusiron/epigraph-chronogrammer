"""Browser regression checks. --layout adds responsive checks; --bilingual adds EN."""
import functools
import http.server
import json
from pathlib import Path
import sys
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'
urls = [base, (ROOT / 'index.html').as_uri()]
if '--public' in sys.argv:
    urls = ['https://ipusiron.github.io/epigraph-chronogrammer/']
languages = ['ja', 'en'] if '--bilingual' in sys.argv else ['ja']
widths = [320, 390, 1280] if '--layout' in sys.argv else [390]
results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for url in urls:
            for lang in languages:
                for theme in ['light', 'dark']:
                    for width in widths:
                        context = browser.new_context(viewport={'width': width, 'height': 900}, is_mobile=width < 600, color_scheme=theme)
                        context.add_init_script("""Object.defineProperty(navigator, 'clipboard', {value: {
                          writeText: async text => { window.lastCopied = text; }
                        }, configurable:true});""")
                        page = context.new_page()
                        errors = []
                        page.on('pageerror', lambda e: errors.append(str(e)))
                        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
                        page.goto(url + '?lang=' + lang)
                        page.locator('[data-text="franCIs goLDsMIth"]').click()
                        page.locator('#analyzeBtn').click()
                        assert '1652' in page.locator('#sumTotal').inner_text()
                        page.locator('#copyExtractBtn').click()
                        page.wait_for_function('window.lastCopied === "CILDMI"')
                        page.locator('#inputText').fill('I')
                        assert page.locator('#copyExtractBtn').is_disabled()
                        assert page.locator('#sumTotal').inner_text() == ''
                        page.locator('#inputText').fill('  M  ')
                        page.locator('input[value="positional"]').check()
                        page.locator('#analyzeBtn').click()
                        assert page.locator('#highlightView mark').count() == 1
                        page.locator('#clearInputBtn').click()
                        page.locator('#puzzleDetails summary').click()
                        page.locator('input[value="exact"]').check()
                        assert page.locator('#sumTotal').inner_text() == ''
                        page.locator('#inputText').fill('<img src=x onerror=alert(1)> M')
                        page.locator('input[value="uppercase"]').check()
                        page.locator('#analyzeBtn').click()
                        assert page.locator('#highlightView img').count() == 0
                        assert page.locator('#highlightView').inner_text() == '<img src=x onerror=alert(1)> M'
                        page.locator('#minYear').fill('2024.9')
                        page.locator('#analyzeBtn').click()
                        assert page.locator('#minYear').get_attribute('aria-invalid') == 'true'
                        assert page.locator('#copyExtractBtn').is_disabled()
                        page.locator('[data-century="19"]').click()
                        assert page.locator('#minYear').input_value() == '1801'
                        assert page.locator('#maxYear').input_value() == '1900'
                        page.locator('#tab-generate').click()
                        assert page.locator('#tab-generate').get_attribute('aria-selected') == 'true'
                        assert page.locator('#tab-analyze').get_attribute('aria-selected') == 'false'
                        page.locator('#yearToMake').fill('2024.9')
                        page.locator('#makeChronogramBtn').click()
                        assert page.locator('#yearToMake').get_attribute('aria-invalid') == 'true'
                        for year in [4, 2024, 9999]:
                            page.locator('#yearToMake').fill(str(year))
                            page.locator('#makeChronogramBtn').click()
                            sums = page.locator('.sample-text').evaluate_all('(els)=>els.map(e=>ChronogramCore.extract(e.textContent).sum)')
                            assert sums and all(s == year for s in sums)
                        page.locator('#copyGeneratedBtn').click()
                        page.wait_for_function('window.lastCopied.startsWith("example:")')
                        page.locator('#yearToMake').fill('2025')
                        assert page.locator('#copyGeneratedBtn').is_disabled()
                        assert page.locator('#generatedExamples').inner_text() == ''
                        if '--layout' in sys.argv:
                            for tab in ['analyze', 'generate', 'study']:
                                page.locator('#tab-' + tab).click()
                                page.locator('#panel-' + tab + ' details').evaluate_all('(els)=>els.forEach(e=>e.open=true)')
                                dims = page.evaluate('({inner:innerWidth, scroll:document.documentElement.scrollWidth})')
                                assert dims['inner'] == width and dims['scroll'] <= width, (lang, theme, tab, width, dims)
                            assert float(page.locator('#inputText').evaluate('(e)=>getComputedStyle(e).fontSize').replace('px','')) >= 16
                            page.locator('#tab-analyze').focus()
                            page.keyboard.press('ArrowRight')
                            assert page.locator('#tab-generate').evaluate('(e)=>e===document.activeElement')
                            page.keyboard.press('End')
                            assert page.locator('#tab-study').get_attribute('aria-selected') == 'true'
                        if '--bilingual' in sys.argv:
                            assert page.locator('html').get_attribute('lang') == lang
                            if lang == 'en':
                                residue = page.evaluate('''() => [...document.querySelectorAll('body *')].flatMap(e => {
                                  if (['SCRIPT','NOSCRIPT','TEXTAREA'].includes(e.tagName) || e.id === 'languageToggle') return [];
                                  return [...e.childNodes].filter(n=>n.nodeType===3 && /[\u3040-\u30ff\u3400-\u9fff]/.test(n.textContent)).map(n=>n.textContent);
                                })''')
                                assert not residue, residue
                        if '--bilingual' in sys.argv:
                            page.locator('#tab-analyze').click()
                            page.locator('[data-text="franCIs goLDsMIth"]').click()
                            page.locator('#analyzeBtn').click()
                            page.locator('#languageToggle').click()
                            assert page.locator('html').get_attribute('lang') != lang
                            assert '1652' in page.locator('#sumTotal').inner_text()
                            page.locator('#languageToggle').click()
                            assert page.locator('html').get_attribute('lang') == lang
                            assert page.locator('#extractedLetters').inner_text() == 'CILDMI'
                            page.evaluate("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async()=>{throw new Error('denied')}}})")
                            page.locator('#copyExtractBtn').click()
                            page.wait_for_function('document.querySelector("#copyStatus").textContent === ChronogramMessages[document.documentElement.lang].copyFailed')
                            page.locator('#inputText').fill('M' * 10000)
                            page.locator('#analyzeBtn').click()
                            assert '10000000' in page.locator('#sumTotal').inner_text()
                            assert page.locator('#highlightView mark').count() == 10000
                            page.locator('#clearInputBtn').click()
                            page.locator('#languageToggle').click()
                            assert page.locator('#sumTotal').inner_text() == ''
                            assert page.locator('#copyExtractBtn').is_disabled()
                        assert not errors, errors
                        results.append({'url':url, 'language':lang, 'theme':theme, 'width':width, 'errors':len(errors)})
                        context.close()
        context = browser.new_context()
        context.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new Error('blocked storage')}")
        page = context.new_page()
        page.goto(urls[0] + '?lang=ja')
        page.locator('#themeToggle').click()
        page.locator('#tab-generate').click()
        page.locator('#makeChronogramBtn').click()
        assert page.locator('.sample-text').count() > 0
        results.append({'storageUnavailable':'pass'})
        browser.close()
finally:
    server.shutdown()
print(json.dumps(results, indent=2))
