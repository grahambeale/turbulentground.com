#!/usr/bin/env node
// Verifies styles/tokens.css for BOTH themes and exits non-zero on any
// failure, so it can run in `npm run build` and fail loudly.
//
//   node scripts/audit/check-contrast.mjs
//
// Checks:
// 1. Every colour token defined in :root is also defined in
//    [data-theme="light"] (the system stays theme-ready).
// 2. Required text/background pairs meet WCAG 2.2 AA in each theme.
//    Translucent tokens are composited onto their stated background first.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(path.join(root, 'styles/tokens.css'), 'utf8');

function block(selector) {
  const i = css.indexOf(selector + ' {');
  if (i === -1) throw new Error(`tokens.css: missing ${selector} block`);
  const body = css.slice(i, css.indexOf('\n}', i));
  const out = {};
  for (const [, name, val] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[name] = val.trim();
  return out;
}

const dark = block(':root');
const light = { ...dark, ...block('[data-theme="light"]') };
const lightOwn = block('[data-theme="light"]');

function parse(v) {
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  m = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  return null;
}
const over = (fg, bg) => fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3]));
function lum([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum, note]
const PAIRS = [
  ...['--ink', '--ink-mid', '--muted', '--orange-lt'].flatMap(fg =>
    ['--bg', '--bg-2', '--bg-warm', '--surface'].map(bg => [fg, bg, 4.5, 'text'])),
  ['--on-accent', '--orange-btn', 4.5, 'button text'],
  ['--on-accent', '--orange-hover', 4.5, 'button text, hover'],
  ['--focus-ring', '--bg', 3, 'focus indicator'],
  ['--focus-ring', '--surface', 3, 'focus indicator'],
  ['--orange', '--bg', 3, 'accent graphics and large text'],
  ['--border-emphasis', '--bg', 1.5, 'emphasis rule (decorative floor)'],
];

let failures = 0;
const colourTokens = Object.keys(dark).filter(k => parse(dark[k]));
for (const k of colourTokens) {
  if (!(k in lightOwn)) { console.error(`FAIL theme-ready: ${k} has no light value`); failures++; }
}

for (const [name, t] of [['dark', dark], ['light', light]]) {
  for (const [fgName, bgName, min, note] of PAIRS) {
    const bg = parse(t[bgName]); const fg = parse(t[fgName]);
    if (!bg || !fg) { console.error(`FAIL ${name}: cannot parse ${fgName} or ${bgName}`); failures++; continue; }
    const r = ratio(over(fg, bg), bg.slice(0, 3));
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`${ok ? 'pass' : 'FAIL'} ${name.padEnd(5)} ${fgName} on ${bgName}: ${r.toFixed(2)} (min ${min}, ${note})`);
  }
}

if (failures) { console.error(`\n[contrast] ${failures} failure(s).`); process.exit(1); }
console.log(`\n[contrast] all checks passed for dark and light (${colourTokens.length} colour tokens).`);
