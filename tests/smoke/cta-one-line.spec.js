// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * CTA rule (Graham, 2 Oct 2026): every call to action fits on one line at 320px.
 * No CTA may wrap at 320, 375 or 390px, and none may run off the right edge.
 * Button text is at least 18px. Runs against SMOKE_TEST_BASE_URL (default
 * production); SMOKE_HTML_EXT=1 requests the .html files for a static server.
 * The survey itself (after the start screen) is frozen and not covered here.
 */
const html = !!process.env.SMOKE_HTML_EXT;

/**
 * Navigate and retry if a stylesheet failed to load. The local static servers used by
 * the smoke run can reset a connection under load (ERR_CONNECTION_RESET on
 * reading.css); the page then renders unstyled and these layout checks fail for a reason
 * that is not the site. A failed stylesheet request is retried, never counted as a result.
 */
async function gotoStyled(page, target) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let styleFailed = false;
    const onFail = (req) => { if (req.resourceType() === 'stylesheet') styleFailed = true; };
    page.on('requestfailed', onFail);
    await page.goto(target);
    page.off('requestfailed', onFail);
    if (!styleFailed) return;
  }
  throw new Error('stylesheet kept failing to load: ' + target);
}
const PAGES = [
  ['/', '/index.html'],
  ['/about', '/about.html'],
  ['/privacy', '/privacy.html'],
  ['/learnings', '/learnings/index.html'],
  ['/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'],
];
const CTA = 'a.btn, a.btn-primary, a.btn-ghost, a.item-cta, a.float-cta, a.cta-btn, .cta-row a, .mobile-menu-btn';

if (html) PAGES.push(['/writing', '/writing.html']);   // production redirects /writing to LinkedIn

for (const width of [320, 375, 390]) {
  for (const [clean, file] of PAGES) {
    test(`CTAs stay on one line at ${width}px: ${clean}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await gotoStyled(page, html ? file : clean);
      const toggle = page.locator('.nav-toggle');
      if (await toggle.isVisible()) await toggle.click();
      const found = await page.evaluate((sel) => {
        const out = [];
        for (const e of document.querySelectorAll(sel)) {
          const el = /** @type {HTMLElement} */ (e);
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0) continue;
          const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
          const inner = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
          out.push({ text: (el.textContent || '').replace(/\s+/g, ' ').trim(), lines: Math.round(inner / lh), right: r.right, fs: parseFloat(cs.fontSize) });
        }
        return out;
      }, CTA);
      for (const c of found) {
        expect(c.lines, `"${c.text}" wraps to ${c.lines} lines`).toBe(1);
        expect(c.right, `"${c.text}" runs past the right edge`).toBeLessThanOrEqual(width);
        expect(c.fs, `"${c.text}" text under 18px`).toBeGreaterThanOrEqual(18);
      }
    });
  }
}
