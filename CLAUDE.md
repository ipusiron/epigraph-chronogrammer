# Development guidance

## Purpose and limits

Epigraph Chronogrammer is a dependency-free, static educational tool. Selected ASCII Roman numeral letters are added without subtraction. It does not determine historical dates, authenticity or authorship, and it is not encryption, a signature or a data-leak detector.

- `core.js`: DOM-free extraction positions, counts, additive sum, conventional/additive representations, puzzle search, template generation. Exports CommonJS for Node and `ChronogramCore` for classic browser scripts.
- `state.js`: Input state and result invalidation. Editing text, mode, range or puzzle matching clears analysis; editing a year clears generated examples. Clear removes text and analysis state.
- `script.js`: DOM rendering and events. Use text nodes, not HTML parsing, for input and generated output.
- `preferences.js`: Runs in the head before CSS. Language priority is query, saved preference, browser. Theme priority is saved preference, OS. Storage is optional and may throw.
- `messages.js`: All Japanese/English UI prose. Keep keys and placeholder names in sync. User-provided text and the language selector's native name are not translated.
- `style.css`: Mobile-first light/dark themes, explicit hidden handling and focus states.
- `test/`: Node tests plus optional Python/Playwright browser regression script.

## Calculation contracts

- Extraction modes: `uppercase` (default), `all`, `positional` (trimmed first/last character per line, once for a one-character line).
- Only ASCII I V X L C D M and their lowercase forms are recognized. No implicit U/V, J/I, full-width or Unicode numeral normalization.
- Input limit: 10,000 UTF-16 code units. Preserve original input and highlight the same positions that are counted.
- Years: ASCII decimal integers 1–9999; reject fractions, exponential notation and reversed ranges. Do not silently truncate, substitute defaults or swap bounds.
- Conventional Roman numerals use the usual subtractive pairs. Above 3999, repeating M is this tool's extension, not a universal historical standard.
- Chronogram sums never subtract. `IV` therefore sums to 6. Generation for 2024 uses additive `MMXXIIII`, not conventional `MMXXIV`.
- The anagram puzzle constructs conventional Roman years using some/all available letters. It is not historical dating. Count all matches but display at most 12.
- Generated text uses fixed educational templates, not an LLM. Reanalyze every result using uppercase-only extraction. If templates lack letters, return an explicitly labeled explanatory sequence, not a purported natural sentence.

## Verification

Run `npm test` with Node.js 22 or later. No npm install is needed. CI runs on push and pull_request with read-only contents permission.

The generator test covers all years 1–9999 and independently sums the output characters. Preserve expected values; do not weaken tests to pass. README samples and headings must match across Japanese and English.

If Python Playwright and Chromium are already available, run:

```sh
python test/browser.py --layout --bilingual
```

This starts a temporary loopback HTTP server, also checks file URLs, and closes it on completion. It checks both languages/themes at widths 320, 390 and 1280, including invalid inputs, clear/edit state, XSS text rendering, clipboard handling, keyboard tabs and blocked storage. `--public` instead checks the published page. Do not claim Safari or physical-device coverage from Chromium emulation.

Before publishing, inspect Japanese and English screenshots, run all tests, check the diff, then verify CI, Pages and published file hashes against Git blobs. Do not change `.claude/`, local settings or unrelated work.

## Privacy and deployment

Only theme and language preferences are stored. Do not save or send input/results. Clipboard contents are not erased by Clear. Keep scripts classic/CommonJS-compatible for file URLs, with no runtime CDN dependencies.

GitHub Pages serves the repository root with `.nojekyll`. `.htaccess` is optional Apache configuration and has no effect on Pages. A meta CSP cannot enforce `frame-ancestors`; do not claim otherwise.

## Documentation

Keep README.md's metadata, series identity and links. README.en.md must fully correspond in headings, examples, values and limitations. Public documentation describes current behavior, not the history of corrections. Changes to the workflow belong in PRs and work records.
