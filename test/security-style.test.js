'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
test('CSP permits only local executable resources and blocks connections', () => {
  const html = read('index.html');
  assert.match(html, /default-src 'none'; script-src 'self'; style-src 'self'/);
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval|frame-ancestors|\son\w+\s*=/);
  for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(link[0], /rel="noopener noreferrer"/);
  for (const src of html.matchAll(/<script src="([^"]+)"/g)) assert.ok(!src[1].includes(':'), src[1]);
});
test('Hidden elements, mobile inputs and focus are explicitly styled', () => {
  const css = read('style.css');
  assert.match(css, /\[hidden\]\s*\{ display: none !important;/);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height: 44px/);
  assert.doesNotMatch(css, /\.tooltip|\.sidebar|\.box-toggle/);
});
function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
for (const theme of ['light', 'dark']) test(`${theme} text and interactive color contrast is at least 4.5:1`, () => {
  const css = read('style.css');
  const block = theme === 'light' ? css.split(':root[data-theme=')[0] : css.split(':root[data-theme="dark"]')[1].split('}')[0];
  const colors = Object.fromEntries([...block.matchAll(/--([\w-]+): (#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));
  for (const [fg, bg] of [['text', 'surface'], ['muted', 'bg'], ['accent', 'surface'], ['on-accent', 'accent'], ['mark-text', 'mark'], ['notice-text', 'notice'], ['error', 'surface']]) {
    const a = luminance(colors[fg]), b = luminance(colors[bg]);
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    assert.ok(ratio >= 4.5, `${fg}/${bg}: ${ratio}`);
  }
});
