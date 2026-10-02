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
 * Reading comfort below 640px (Graham, 2 Oct 2026): body copy is at least 20px
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
    test(`body text is >=20px with line-height <=1.65 at ${width}px: ${name}`, async ({ browser }) => {
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
      expect(m.fs, 'font size').toBeGreaterThanOrEqual(20);
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

/**
 * Graham's rule (2 Oct 2026): below 640px NO visible text is under 18px on the
 * article template, /privacy, /learnings, /about and the /take-part intro.
 * Counts every visible text node, plus text inputs and buttons that show text,
 * in each page's states (every privacy tab, the open transcript, the open mobile
 * menu). Text that is hidden (zero size, opacity 0, clipped, aria-hidden decoration)
 * is ignored.
 */
const scanSmallText = (floor) => {
  const out = [];
  const label = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '');
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const ac = getComputedStyle(a);
      if (ac.display === 'none' || ac.visibility === 'hidden' || parseFloat(ac.opacity) === 0) return false;
      if (ac.overflow !== 'visible' || ac.overflowX !== 'visible') {
        const ar = a.getBoundingClientRect();
        if (ar.width < 1 || ar.height < 1) return false;
      }
    }
    return !e.closest('[hidden]');
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const text = (t.textContent || '').trim();
    const e = t.parentElement;
    if (!text || !e || e.closest('script,style,noscript,svg,.feedback-sr') || !visible(e)) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < floor) out.push(`${label(e)} ${fs.toFixed(1)}px "${text.slice(0, 30)}"`);
  }
  document.querySelectorAll('input[type=text],input[type=email],input[type=search],input:not([type]),textarea,select,button').forEach((e) => {
    if (!visible(e) || (e.tagName === 'BUTTON' && !(e.textContent || '').trim()) || e.closest('#feedback-launch')) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < floor) out.push(`CONTROL ${label(e)} ${fs.toFixed(1)}px`);
  });
  return out;
};

for (const width of [320, 390, 480, 640]) {
  for (const [name, clean, file] of READ_PAGES) {
    test(`no visible text under 18px at ${width}px: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      await page.waitForTimeout(400);
      const found = [];
      if (name === 'privacy') {
        const n = await page.locator('.privacy-contents button').count();
        for (let i = 0; i < n; i++) {
          await page.evaluate((i) => {
            document.documentElement.style.scrollBehavior = 'auto';
            /** @type {HTMLElement} */ (document.querySelectorAll('.privacy-contents button')[i]).click();
          }, i);
          await page.waitForTimeout(120);
          found.push(...(await page.evaluate(scanSmallText, 18)).map((x) => `[tab ${i}] ${x}`));
        }
      } else {
        if (name === 'take-part') await page.evaluate(() => { const d = document.querySelector('.transcript-toggle'); if (d) /** @type {HTMLDetailsElement} */ (d).open = true; });
        found.push(...(await page.evaluate(scanSmallText, 18)));
      }
      if (name === 'article') {
        await page.evaluate(() => /** @type {HTMLElement} */ (document.querySelector('.nav-toggle')).click());
        await page.waitForTimeout(500);
        found.push(...(await page.evaluate(scanSmallText, 18)).map((x) => `[menu open] ${x}`));
      }
      expect(found, 'visible text under 18px').toEqual([]);
      await context.close();
    });
  }
}

const ARTICLES = ['analytics-data-mean-what-you-think', 'chatgpt-starts-this-week', 'eleven-sprints-in', 'how-does-an-ai-team-miss-a-failure-this-big', 'make-my-ai-team-take-risks', 'seven-copies-of-the-rules', 'signals-added-to-the-pile', 'the-silent-veto', 'what-zero-intervention-actually-means', 'zero-humans-in-the-loop'];
test('no visible text under 18px at 390px: all ten articles', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
  const found = [];
  for (const slug of ARTICLES) {
    const page = await context.newPage();
    await page.goto(`/learnings/${slug}${html ? '.html' : ''}`);
    await page.waitForTimeout(250);
    found.push(...(await page.evaluate(scanSmallText, 18)).map((x) => `[${slug}] ${x}`));
    await page.close();
  }
  expect(found, 'visible text under 18px').toEqual([]);
  await context.close();
});

/**
 * The bigger phone type must never make a page scroll sideways (the 20px card
 * link on /about once did at 320px). Same pages as the type-scale tests.
 */
for (const width of [320, 360, 390]) {
  for (const [name, clean, file] of READ_PAGES) {
    test(`no sideways scroll at ${width}px: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(m.sw, 'scrollWidth vs viewport').toBeLessThanOrEqual(m.cw);
      await context.close();
    });
  }
}

/**
 * Batch 2 (homepage, /writing, /care-capital, /research/privacy) follows the same
 * rule below 640px: body 20px at <=1.65, nothing visible under 18px, no sideways
 * scroll. /research/privacy redirects to /privacy#participation, so it is checked
 * with scripts off (the no-script fallback is the page a visitor can see).
 */
const BATCH2 = [
  // name, clean URL, static file, body-text selector, scripts on?
  ['home', '/', '/index.html', '.lede', true],
  ['writing', '/writing', '/writing.html', '.phase-desc', true],
  ['care-capital', '/care-capital', '/care-capital.html', 'main p:not([class]):not([style*="font-size"])', true],
  ['research-privacy', '/research/privacy', '/research/privacy.html', 'main p', false],
];

/** Walks the page so scroll-driven content (the homepage scenes) is laid out. */
async function walk(page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
}

for (const width of [320, 390, 480, 640]) {
  for (const [name, clean, file, , js] of BATCH2) {
    test(`no visible text under 18px at ${width}px: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: true, hasTouch: true, javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      await page.waitForTimeout(500);
      if (js) await walk(page);
      const found = await page.evaluate(scanSmallText, 18);
      expect(found, 'visible text under 18px').toEqual([]);
      await context.close();
    });
  }
}

for (const width of [320, 390]) {
  for (const [name, clean, file, sel, js] of BATCH2) {
    test(`body text is >=20px with line-height <=1.65 at ${width}px: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: true, hasTouch: true, javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      await page.waitForTimeout(400);
      const m = await page.evaluate((sel) => {
        const el = [...document.querySelectorAll(sel)].find((e) => e instanceof HTMLElement && e.offsetParent && (e.textContent || '').trim().length > 40);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        return { fs, ratio: cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs };
      }, sel);
      expect(m, `a visible paragraph matching ${sel}`).not.toBeNull();
      expect(m.fs).toBeGreaterThanOrEqual(20);
      expect(m.ratio).toBeLessThanOrEqual(1.65);
      await context.close();
    });
  }
}

for (const width of [320, 360, 390]) {
  for (const [name, clean, file, , js] of BATCH2) {
    test(`no sideways scroll at ${width}px: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto(html ? file : clean);
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(m.sw, 'scrollWidth vs viewport').toBeLessThanOrEqual(m.cw);
      await context.close();
    });
  }
}

// The floating "Go on the record" button must not cover a homepage tile at the point
// where a scene is about to end (its tile grids reserve room for it).
for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  test(`homepage floating button clears the tiles at ${width}x${height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(html ? '/index.html' : '/');
    await page.waitForTimeout(2200);
    for (const id of ['pressure', 'people', 'desk']) {
      await page.evaluate((id) => {
        document.documentElement.style.scrollBehavior = 'auto';
        const r = document.getElementById(id).getBoundingClientRect();
        window.scrollBy(0, r.bottom - window.innerHeight);
      }, id);
      await page.waitForTimeout(3300);
      const m = await page.evaluate((id) => {
        const cta = document.getElementById('float-cta');
        const c = cta.getBoundingClientRect();
        const tiles = [...document.querySelectorAll(`#${id} .tile`)].map((t) => t.getBoundingClientRect());
        return { shown: cta.classList.contains('show'), lines: Math.round(c.height), overlaps: tiles.some((t) => !(t.right < c.left || t.left > c.right || t.bottom < c.top || t.top > c.bottom)) };
      }, id);
      expect(m.shown, `${id}: floating button visible`).toBe(true);
      expect(m.overlaps, `${id}: floating button covers a tile`).toBe(false);
    }
    await context.close();
  });
}

/**
 * Every HTML page in the repo is either covered by the phone type scale, exempt on
 * purpose (small text expected), deferred to a reviewed proposal, or a template. A
 * new page fails here until someone decides which. The exemptions are also listed in
 * the comment at the top of styles/reading.css.
 */
const COVERED = [
  'index.html', 'about.html', 'privacy.html', 'writing.html', 'care-capital.html', 'research/privacy.html',
  'learnings/index.html', 'learnings/analytics-data-mean-what-you-think.html', 'learnings/chatgpt-starts-this-week.html',
  'learnings/eleven-sprints-in.html', 'learnings/how-does-an-ai-team-miss-a-failure-this-big.html',
  'learnings/make-my-ai-team-take-risks.html', 'learnings/seven-copies-of-the-rules.html',
  'learnings/signals-added-to-the-pile.html', 'learnings/the-silent-veto.html',
  'learnings/what-zero-intervention-actually-means.html', 'learnings/zero-humans-in-the-loop.html',
];
const EXEMPT = [
  'diagnostic/index.html',                       // the diagnostic
  'admin/index.html',                            // Decap CMS
  'admin/invitations/index.html', 'research/admin-tools.html', 'research/admin.html', // admin pages
  'research/benchmark-preview.html', 'research/benchmark-preview/available.html', 'research/benchmark-preview/building.html',
  'research/benchmark-preview/partial.html', 'research/lifecycle-email-preview.html', 'research/purpose-preview.html',
  'research/referral-sharing-preview.html', 'research/return-link-email-preview.html', 'research/results-preview-v3.html',
  'research/results-preview-v4-own.html', 'research/results-preview-v4.html', 'research/ux-review.html', 'research/legacy-v3.html', // internal preview / email pages
];
// Only the start-screen intro is covered; the survey proper changes through a methodology-reviewed proposal.
const DEFERRED = ['research/index.html'];
const TEMPLATES = ['learnings/_article-template.html', 'partials/feedback.html', 'partials/footer.html', 'partials/nav.html'];

test('every HTML page is covered, exempt, deferred or a template (and the exemptions are recorded in reading.css)', async () => {
  const root = path.join(__dirname, '..', '..');
  const skip = new Set(['node_modules', '.git', 'test-results', '.vercel', 'openspec']);
  /** @type {string[]} */
  const found = [];
  const walkDir = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkDir(p);
      else if (e.name.endsWith('.html')) found.push(path.relative(root, p).split(path.sep).join('/'));
    }
  };
  walkDir(root);
  const known = new Set([...COVERED, ...EXEMPT, ...DEFERRED, ...TEMPLATES]);
  expect(found.filter((f) => !known.has(f)), 'pages not classified for the phone type scale').toEqual([]);
  expect([...known].filter((f) => !found.includes(f)), 'listed pages that no longer exist').toEqual([]);
  const readingCss = fs.readFileSync(path.join(root, 'styles', 'reading.css'), 'utf8');
  for (const needle of ['/diagnostic', '/admin/invitations', '/research/admin-tools', '/research/admin', 'Decap CMS', 'preview and email pages', 'DEFERRED']) {
    expect(readingCss, `reading.css comment mentions "${needle}"`).toContain(needle);
  }
});

// The homepage progress widget only appears once its API answers, so mock the counts
// (browser-only route; nothing is enabled or written anywhere) and check its text too.
for (const width of [320, 390]) {
  test(`homepage progress widget text is 20px with nothing under 18px at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.route('**/api/research-participation', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ completed: 12, milestone: 30 }) }));
    await page.goto(html ? '/index.html' : '/');
    await page.waitForSelector('#study-progress:not([hidden])', { timeout: 10000 });
    await walk(page);
    const fs = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#progress-text')).fontSize));
    expect(fs).toBeGreaterThanOrEqual(20);
    const found = await page.evaluate(scanSmallText, 18);
    expect(found, 'visible text under 18px with the progress widget showing').toEqual([]);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sw, 'sideways overflow').toBeLessThanOrEqual(0);
    await context.close();
  });
}
