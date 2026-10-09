"""Compose interaction checks shared by the HTTP, file and public matrix."""

def check_composer(page):
    original_analysis = page.locator('#inputText').input_value()
    page.locator('#tab-compose').click()
    assert page.locator('#panel-compose').is_visible()
    assert not page.locator('#panel-analyze').is_visible()
    page.locator('#composeText').fill('MMVI')
    page.locator('#composeYear').fill('2024')
    assert '2006' in page.locator('#composeStatus').inner_text()
    assert '18' in page.locator('#composeStatus').inner_text()
    assert 'X + V + I + I + I' in page.locator('#composeHint').inner_text()
    first = page.locator('#composePreview button').first
    first.focus()
    page.keyboard.press('Space')
    assert page.locator('#composeText').input_value() == 'mMVI'
    assert page.locator('#composePreview button').first.get_attribute('aria-pressed') == 'false'
    assert page.locator('#composePreview button').first.evaluate('(e)=>e===document.activeElement')
    page.locator('#composeUndo').click()
    assert page.locator('#composeText').input_value() == 'MMVI'
    page.locator('#composeText').fill('MML')
    assert '26' in page.locator('#composeStatus').inner_text()
    assert page.locator('#composeHint').inner_text() == ''
    page.locator('#composeYear').fill('2e3')
    assert page.locator('#composeYear').get_attribute('aria-invalid') == 'true'
    assert page.locator('#composeMemoCopy').is_disabled()
    assert page.locator('#composeMemo').input_value() == ''
    page.locator('#composeUndo').click()
    assert page.locator('#composeYear').input_value() == '2024'
    page.locator('#composeText').fill('MMVI')
    page.locator('#composeMemoCopy').click()
    expected = page.locator('#composeMemo').input_value()
    page.wait_for_function('text => window.lastCopied === text', arg=expected)
    assert '2006' in expected and '2024' in expected and 'MMVI' in expected
    page.locator('#languageToggle').click()
    assert page.locator('#composeText').input_value() == 'MMVI'
    assert '2006' in page.locator('#composeStatus').inner_text()
    assert page.locator('#composeMemo').input_value() != expected
    page.locator('#languageToggle').click()
    assert page.locator('#composeMemo').input_value() == expected
    assert page.locator('#inputText').input_value() == original_analysis

    # Replace requires confirmation; Cancel must leave both inputs untouched.
    page.locator('#tab-generate').click()
    page.locator('#yearToMake').fill('2024')
    page.locator('#makeChronogramBtn').click()
    example = page.locator('.sample-text').first.text_content()
    page.once('dialog', lambda dialog: dialog.dismiss())
    page.locator('[data-destination="compose"]').first.click()
    assert page.locator('#panel-generate').is_visible()
    assert page.locator('#composeText').input_value() == 'MMVI'
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('[data-destination="compose"]').first.click()
    assert page.locator('#panel-compose').is_visible()
    assert page.locator('#composeText').input_value() == example
    assert page.locator('#composeYear').input_value() == '2024'
    assert '2024' in page.locator('#composeStatus').inner_text()
    assert page.locator('#inputText').input_value() == original_analysis
    page.locator('#composeUndo').click()
    assert page.locator('#composeText').input_value() == 'MMVI'
    page.locator('#tab-generate').click()
    page.once('dialog', lambda dialog: dialog.dismiss())
    page.locator('[data-destination="analyze"]').first.click()
    assert page.locator('#inputText').input_value() == original_analysis
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('[data-destination="analyze"]').first.click()
    assert page.locator('#inputText').input_value() == example
    assert page.locator('input[name="extractionMode"][value="uppercase"]').is_checked()
    assert not page.locator('#analysisResults').is_visible()
    page.locator('#analyzeBtn').click()
    assert '2024' in page.locator('#sumTotal').inner_text()
    page.locator('#tab-compose').click()
    page.locator('#composeClear').click()
    assert page.locator('#composeUndo').is_disabled()
    page.locator('#languageToggle').click()
    assert page.locator('#composeMemo').input_value() == ''
    assert page.locator('#composePreview').inner_text() == ''
    page.locator('#languageToggle').click()
    assert page.locator('#inputText').input_value() == example
    # Leave a non-empty representative state for responsive checks.
    page.locator('#composeText').fill('MMVI')
