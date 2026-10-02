// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * The research survey after the start screen (consent, context, the 24 statements,
 * results/completion) is a measurement instrument. Its presentation changes only
 * through a methodology-reviewed proposal (research/openspec/changes/
 * survey-mobile-type-scale). This test freezes it below 640px: every measured text
 * size, line-height and response-control size, and the page's top padding, must equal
 * tests/smoke/survey-baseline.json, captured from main (4d7ad1c) before the phone type
 * scale work. The start screen is deliberately NOT frozen (it is the /take-part intro).
 *
 * To change the survey on purpose, get the proposal approved, then regenerate the
 * baseline in the same commit and say so in the commit message.
 *
 * Runs against SMOKE_TEST_BASE_URL (default production); set SMOKE_HTML_EXT=1 for a
 * static server without clean URLs. Uses the existing no-record review mode, so no
 * participant record or API write is involved (API calls are aborted).
 */
const html = !!process.env.SMOKE_HTML_EXT;
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'survey-baseline.json'), 'utf8'));
const reviewKey = /RESTRAINED_PREVIEW_KEY\s*=\s*'([0-9a-f]+)'/.exec(
  fs.readFileSync(path.join(__dirname, '..', '..', 'research', 'index.html'), 'utf8')
)[1];

const scan = () => {
  /** @type {Record<string,string>} */
  const m = {};
  const sel = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (e.id ? '#' + e.id : '');
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const ac = getComputedStyle(a);
      if (ac.display === 'none' || ac.visibility === 'hidden') return false;
      if (ac.overflow !== 'visible') { const ar = a.getBoundingClientRect(); if (ar.width < 1 || ar.height < 1) return false; }
    }
    return !e.closest('[hidden]');
  };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    const tx = (t.textContent || '').trim();
    const e = t.parentElement;
    if (!tx || !e || e.closest('script,style,svg,noscript,.feedback-sr,nav,.mobile-menu,footer,#feedback-launch,dialog') || !vis(e)) continue;
    const cs = getComputedStyle(e);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs;
    const k = sel(e) + '|' + tx.slice(0, 24);
    if (!(k in m)) m[k] = fs.toFixed(1) + '/' + lh.toFixed(2);
  }
  [...document.querySelectorAll('.scale-btn,.scale-skip')].filter((b) => /** @type {HTMLElement} */ (b).offsetParent).slice(0, 8).forEach((b, i) => {
    const r = b.getBoundingClientRect();
    m['control#' + i + ' ' + sel(b)] = Math.round(r.width) + 'x' + Math.round(r.height);
  });
  m['body padding-top'] = getComputedStyle(document.body).paddingTop;
  return m;
};

for (const key of Object.keys(baseline)) {
  const [w, stage] = key.split('|');
  test(`survey screen "${stage}" is unchanged at ${w}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: Number(w), height: 900 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.route('**/api/**', (r) => r.abort());
    const base = html ? '/research/index.html' : '/take-part';
    await page.goto(`${base}?preview=ux-review&pk=${reviewKey}&stage=${stage}`);
    await page.waitForTimeout(900);
    const now = await page.evaluate(scan);
    const changed = Object.keys(baseline[key]).filter((k) => baseline[key][k] !== now[k]).map((k) => `${k}: ${baseline[key][k]} -> ${now[k]}`);
    const added = Object.keys(now).filter((k) => !(k in baseline[key]));
    expect(changed, 'survey measurements that changed').toEqual([]);
    expect(added, 'new survey measurements').toEqual([]);
    await context.close();
  });
}
