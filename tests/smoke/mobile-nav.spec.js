// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Mobile navigation must stay usable at phone widths. Added after the shared
 * nav's nowrap strapline plus 48px side padding made the logo block 382px wide
 * at 375px, pushing the menu button off the right edge on every page.
 *
 * Runs against SMOKE_TEST_BASE_URL (default production). For a static server
 * without clean URLs, set SMOKE_HTML_EXT=1 to request the .html files.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const PAGES = [
  ['/', '/index.html'],
  ['/take-part', '/research/index.html'],
  ['/privacy', '/privacy.html'],
  ['/learnings', '/learnings/index.html'],
  ['/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'],
];

for (const width of [320, 375, 390]) {
  for (const [clean, file] of PAGES) {
    test(`nav fits at ${width}px: ${clean}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      const m = await page.evaluate(() => {
        const r = (e) => { const b = e.getBoundingClientRect(); return { left: b.left, right: b.right }; };
        const toggle = document.querySelector('.nav-toggle');
        const toggleShown = !!toggle && getComputedStyle(toggle).display !== 'none';
        const wm = /** @type {HTMLElement} */ (document.querySelector('.nav-wordmark'));
        return {
          vw: window.innerWidth,
          scrollW: document.documentElement.scrollWidth,
          logo: r(document.querySelector('.nav-logo')),
          wordmark: r(wm),
          wordmarkClipped: wm.scrollWidth > wm.clientWidth,
          toggle: toggleShown ? r(toggle) : null,
        };
      });
      expect(m.scrollW, 'page must not scroll sideways').toBeLessThanOrEqual(m.vw);
      expect(m.wordmark.right, 'wordmark must be on screen').toBeLessThanOrEqual(m.vw);
      expect(m.wordmarkClipped).toBe(false);
      if (m.toggle) {
        expect(m.toggle.right, 'menu button must be on screen').toBeLessThanOrEqual(m.vw);
        expect(m.logo.right, 'logo must not overlap the menu button').toBeLessThanOrEqual(m.toggle.left + 1);
      }
      await context.close();
    });
  }
}
