// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * The survey phone type scale (research/openspec/changes/survey-mobile-type-scale, revision 2, approved 3 Oct 2026),
 * below 640px: tappable text 20px, body text 20px at 1.55, supporting text 18px, nothing else under 18px.
 * EXCEPTION, asserted explicitly: the response area (1-5 buttons, scale end labels, "Not applicable" / "Prefer not to say")
 * is not restyled, stays under 18px on purpose, and "Not applicable" stays on one line. Also: no sideways scroll, and the
 * declared presentation version is the restyle below 640px and the baseline from 640px up.
 * Uses the no-record review mode (API calls aborted). Runs against SMOKE_TEST_BASE_URL; SMOKE_HTML_EXT=1 for a static server.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const reviewKey = /RESTRAINED_PREVIEW_KEY\s*=\s*'([0-9a-f]+)'/.exec(
  fs.readFileSync(path.join(__dirname, '..', '..', 'research', 'index.html'), 'utf8'))[1];
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'survey-baseline.json'), 'utf8'));
const STAGES = ['consent', 'profile', 'questions', 'final-question', 'submit', 'completion'];
const RESPONSE_AREA = '.scale-btn, .scale-labels, .scale-skip';

const measure = (RESP) => {
  const out = { under18: [], tappableUnder20: [], bodyWrong: [], overflowX: document.documentElement.scrollWidth - window.innerWidth, resp: {} };
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width >= 1 && r.height >= 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && !e.closest('[hidden]'); };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    const tx = (t.textContent || '').trim(); const e = t.parentElement;
    if (!tx || !e || e.closest('script,style,svg,noscript,nav,.mobile-menu,footer,#feedback-launch,dialog,.visually-hidden') || !vis(e) || e.closest(RESP)) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 17.95) out.under18.push(`${e.tagName.toLowerCase()}|${tx.slice(0, 24)}: ${fs.toFixed(1)}`);
  }
  const need = (sel, min, bucket) => document.querySelectorAll(sel).forEach((e) => {
    if (!vis(e)) return;
    const cs = getComputedStyle(e); const fs = parseFloat(cs.fontSize);
    if (fs < min - 0.05) out[bucket].push(`${sel}: ${fs.toFixed(1)}`);
    if (bucket === 'bodyWrong') { const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs; if (lh < 1.5 || lh > 1.6) out.bodyWrong.push(`${sel}: line-height ${lh.toFixed(2)}`); }
  });
  for (const s of ['.video-thumb-label', '.transcript-toggle summary', '#screen-consent .check-row label', '#screen-done .check-row label', '#screen-context .choice-option label',
    '.survey-back', '.statement-help-toggle', '#consent-continue', '#screen-context .btn', '.statement-context-continue', '#submit-btn', '#referral-copy-link', '#referral-more-toggle', '#stay-involved-button']) need(s, 20, 'tappableUnder20');
  for (const s of ['#screen-consent .transcript-body', '#screen-done .transcript-body', '#screen-done .referral-sharing > p', '#screen-done .stay-involved > p', '#open-comment-fieldset .field > label', '.statement-help']) need(s, 20, 'bodyWrong');
  const r = (e) => { const b = e.getBoundingClientRect(); return { fs: parseFloat(getComputedStyle(e).fontSize), w: Math.round(b.width), h: Math.round(b.height) }; };
  const shown = (e) => /** @type {HTMLElement} */ (e).offsetParent !== null;   // same visibility test as survey-frozen.spec.js
  const btn = [...document.querySelectorAll('.scale-btn')].find(shown); if (btn) out.resp.btn = r(btn);
  const lab = [...document.querySelectorAll('.scale-labels span')].find(shown); if (lab) out.resp.label = r(lab);
  const na = [...document.querySelectorAll('.scale-skip')].find((b) => /not applicable/i.test(b.textContent || '') && shown(b)); if (na) out.resp.na = r(na);
  out.version = getComputedStyle(document.documentElement).getPropertyValue('--presentation-version').trim();
  return out;
};

for (const width of [320, 375, 390, 639]) {
  for (const stage of STAGES) {
    test(`survey phone type scale at ${width}px: ${stage}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.route('**/api/**', (r) => r.abort());
      await page.goto(`${html ? '/research/index.html' : '/take-part'}?preview=ux-review&pk=${reviewKey}&stage=${stage}`);
      await page.waitForTimeout(900);
      const m = await page.evaluate(measure, RESPONSE_AREA);
      expect(m.under18, 'visible text under 18px outside the response area').toEqual([]);
      expect(m.tappableUnder20, 'tappable text under 20px').toEqual([]);
      expect(m.bodyWrong, 'body text not 20px at about 1.55').toEqual([]);
      expect(m.overflowX, 'sideways scroll').toBeLessThanOrEqual(0);
      expect(m.version).toBe('phone-type-scale-2026-10');
      if (stage === 'questions' || stage === 'final-question') {
        // The response area is identical with the restyle switched OFF: disable the restyle's @media rule in the browser and
        // measure again. This holds at every width, whatever the existing responsive sizes of the buttons are.
        expect(m.resp.btn && m.resp.label && m.resp.na, 'response area found').toBeTruthy();
        const off = await page.evaluate((fn) => {
          for (const sheet of [...document.styleSheets]) {
            let rules; try { rules = [...sheet.cssRules]; } catch { continue; }
            for (const rule of rules) if (rule instanceof CSSMediaRule && rule.cssText.includes('phone-type-scale-2026-10')) rule.media.mediaText = 'not all';
          }
          // eslint-disable-next-line no-new-func
          return new Function('RESP', `return (${fn})(RESP)`)('.scale-btn, .scale-labels, .scale-skip');
        }, measure.toString());
        expect(m.resp, 'response area sizes with the restyle on vs off').toEqual(off.resp);
        expect(off.version, 'switching the rule off really removed it').toBe('baseline-2026-10');
        expect(m.resp.na.h, '"Not applicable" stays on one line').toBeLessThanOrEqual(46);
        expect(m.resp.na.fs).toBeCloseTo(16.6, 0);
        expect(m.resp.label.fs).toBeCloseTo(17.1, 0);
        const frozen = baseline[`${width}|${stage}`];   // widths 320 and 390 are also frozen byte for byte by survey-frozen.spec.js
        if (frozen) expect(`${m.resp.btn.w}x${m.resp.btn.h}`).toBe(frozen['control#0 button.scale-btn']);
      }
      await context.close();
    });
  }
}

for (const width of [640, 1024]) {
  test(`from 640px up the survey keeps the baseline presentation version (${width}px)`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.route('**/api/**', (r) => r.abort());
    await page.goto(`${html ? '/research/index.html' : '/take-part'}?preview=ux-review&pk=${reviewKey}&stage=consent`);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--presentation-version').trim())).toBe('baseline-2026-10');
    await context.close();
  });
}
