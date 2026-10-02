// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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

for (const width of [320, 375, 390, 480, 481, 720]) {
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
        const strap = document.querySelector('.nav-strapline');
        return {
          strapShown: !!strap && getComputedStyle(strap).display !== 'none',
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
      if (width <= 480) expect(m.strapShown, 'strapline is hidden at 480px and below').toBe(false);
      if (m.toggle) {
        expect(m.toggle.right, 'menu button must be on screen').toBeLessThanOrEqual(m.vw);
        expect(m.logo.right, 'logo must not overlap the menu button').toBeLessThanOrEqual(m.toggle.left + 1);
      }
      await context.close();
    });
  }
}

/**
 * Alignment: the nav's left edge (logo mark when the header is full, wordmark
 * when it has compacted on scroll) and its menu button's right edge must line
 * up with the page's content edges, in both states. Added after the compacted
 * header's logo stayed indented from the content (the collapsed mark left its
 * gap behind) and the nav gutter did not follow each page's own gutter.
 */
// The no-record review mode shows the real start screen without the API.
const reviewKey = /RESTRAINED_PREVIEW_KEY\s*=\s*'([0-9a-f]+)'/.exec(
  fs.readFileSync(path.join(__dirname, '..', '..', 'research', 'index.html'), 'utf8')
)[1];
const ALIGN_PAGES = [
  ['home', '/', '/index.html', '.hero h1'],
  ['article', '/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html', 'article h1, h1'],
  ['take-part', `/take-part?preview=public-start&pk=${reviewKey}`, `/research/index.html?preview=public-start&pk=${reviewKey}`, '#screen-public-start h1'],
  ['privacy', '/privacy', '/privacy.html', 'h1'],
  ['learnings', '/learnings', '/learnings/index.html', 'h1'],
];

for (const width of [320, 375, 390, 480, 720]) {
  for (const [name, clean, file, anchor] of ALIGN_PAGES) {
    for (const state of ['default', 'scrolled']) {
      test(`nav aligns with content at ${width}px (${state}): ${name}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        await page.goto(html ? file : clean);
        await page.waitForSelector(anchor, { state: 'visible' });
        if (state === 'scrolled') {
          await page.evaluate(() => { document.body.style.minHeight = '3000px'; window.scrollTo(0, 600); });
          await page.waitForFunction(() => document.querySelector('.nav')?.classList.contains('scrolled'));
          await page.waitForTimeout(700); // let the header's 0.4s compaction finish
        }
        const m = await page.evaluate(({ anchor, state }) => {
          const r = (e) => e.getBoundingClientRect();
          const content = r(document.querySelector(anchor));
          const logoEdge = state === 'scrolled'
            ? r(document.querySelector('.nav-wordmark')).left
            : r(document.querySelector('.nav-logo-mark svg')).left;
          const bars = document.querySelector('.nav-toggle span');
          const toggle = document.querySelector('.nav-toggle');
          const toggleShown = !!toggle && getComputedStyle(toggle).display !== 'none';
          return { contentLeft: content.left, contentRight: content.right, logoEdge, barsRight: toggleShown && bars ? r(bars).right : null };
        }, { anchor, state });
        expect(Math.abs(m.logoEdge - m.contentLeft), `logo left ${m.logoEdge} vs content left ${m.contentLeft}`).toBeLessThanOrEqual(1);
        if (m.barsRight !== null) {
          expect(Math.abs(m.barsRight - m.contentRight), `menu right ${m.barsRight} vs content right ${m.contentRight}`).toBeLessThanOrEqual(1);
        }
        await context.close();
      });
    }
  }
}

/**
 * Reading comfort below 640px (Graham, 2 Oct 2026): body copy is at least 18px
 * with a line-height of at most 1.65, on the article template, /privacy,
 * /learnings, /about and the /take-part intro.
 */
const READ_PAGES = [
  ['article', '/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html', '.reading-copy p'],
  ['privacy', '/privacy', '/privacy.html', '.reading-copy p'],
  ['learnings', '/learnings', '/learnings/index.html', '.reading-copy .intro'],
  ['about', '/about', '/about.html', '.narrative p'],
  ['take-part', `/take-part?preview=public-start&pk=${reviewKey}`, `/research/index.html?preview=public-start&pk=${reviewKey}`, '#screen-public-start p'],
];
for (const width of [320, 390, 640]) {
  for (const [name, clean, file, sel] of READ_PAGES) {
    test(`body text is >=18px with line-height <=1.65 at ${width}px: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      const m = await page.evaluate((sel) => {
        const el = [...document.querySelectorAll(sel)].find((e) => e instanceof HTMLElement && e.offsetParent && (e.textContent || '').trim().length > 40);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        return { fs, ratio: cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs };
      }, sel);
      expect(m, `a visible paragraph matching ${sel}`).not.toBeNull();
      expect(m.fs, 'font size').toBeGreaterThanOrEqual(18);
      expect(m.ratio, 'line-height / font-size').toBeLessThanOrEqual(1.65);
      await context.close();
    });
  }
}

// At 720px and below the article hero starts below the transparent header, so the
// header's rule never crosses the picture or its baked-in masthead text.
for (const width of [320, 390, 640, 720]) {
  test(`article hero starts below the header at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(html ? '/learnings/zero-humans-in-the-loop.html' : '/learnings/zero-humans-in-the-loop');
    const m = await page.evaluate(() => ({
      navBottom: document.querySelector('.nav').getBoundingClientRect().bottom,
      heroTop: document.querySelector('.hero-image').getBoundingClientRect().top,
    }));
    expect(m.heroTop, `hero top ${m.heroTop} vs header bottom ${m.navBottom}`).toBeGreaterThanOrEqual(m.navBottom - 1);
    await context.close();
  });
}
