// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Footer decisions (Graham, 2 Oct 2026). The homepage footer is trimmed to a closing
 * line, About / Privacy / Graham's LinkedIn and one final line, with no mention of the
 * AI experiment and no YouTube link; each row is a single line at 320/375/390px.
 * The AI-experiment disclosure must stay on the pages the AI team built: the footer
 * note on /about, /writing, /learnings and every article, and the
 * "not by the AI team" note on articles. Runs against SMOKE_TEST_BASE_URL;
 * SMOKE_HTML_EXT=1 requests the .html files for a static server.
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
const url = (clean, file) => (html ? file : clean);

test('homepage footer text and links are exactly the approved set', async ({ page }) => {
  await gotoStyled(page, url('/', '/index.html'));
  const f = page.locator('footer');
  await expect(f.locator('.footer-lead')).toHaveText('Run by Graham Beale.');
  await expect(f.locator('.footer-link')).toHaveText(['About', 'Privacy', 'Graham’s LinkedIn']);
  await expect(f.locator('.footer-note')).toHaveText('Independent · ICO registered · © 2026 Turbulent Ground');
  const text = (await f.innerText()).toLowerCase();
  for (const banned of ['youtube', 'experiment', 'ai product team', 'ai team']) expect(text).not.toContain(banned);
});

for (const width of [320, 375, 390]) {
  test(`homepage footer rows are single lines at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await gotoStyled(page, url('/', '/index.html'));
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('footer .footer-brand, footer .footer-lead, footer .footer-link, footer .footer-part')].map((e) => {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
        return { text: (e.textContent || '').trim(), lines: Math.round(r.height / lh), right: r.right, fs: parseFloat(cs.fontSize) };
      }));
    expect(rows.length).toBeGreaterThanOrEqual(7);
    for (const r of rows) {
      expect(r.lines, `"${r.text}" wraps`).toBe(1);
      expect(r.right, `"${r.text}" overflows`).toBeLessThanOrEqual(width);
      expect(r.fs, `"${r.text}" under 18px`).toBeGreaterThanOrEqual(18);
    }
  });
}

const DISCLOSURE_PAGES = [
  ['/about', '/about.html'],
  ['/learnings', '/learnings/index.html'],
  ['/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'],
];
if (html) DISCLOSURE_PAGES.push(['/writing', '/writing.html']);   // production redirects /writing to LinkedIn

for (const [clean, file] of DISCLOSURE_PAGES) {
  test(`footer says who runs the site and how it began: ${clean}`, async ({ page }) => {
    await page.goto(url(clean, file));
    const note = page.locator('footer .footer-note');
    await expect(note).toContainText('Built and run by Graham Beale. Began as an AI product team experiment, July 2026.');
    // The AI product team phases are closed (Oct 2026): nothing may describe the experiment as current.
    const text = (await note.innerText()).toLowerCase();
    for (const stale of ['sprint 1', 'live experiment', 'originally built']) expect(text).not.toContain(stale);
  });
}

// The AI team phases are closed (Oct 2026). Article chrome and the "New here?" boxes must not describe the experiment as
// running now. The founding article's own body (its "Start here." box) is kept unchanged as a historical record, under a
// dated status note, so it is the one place the old wording is allowed.
const ARTICLE_SLUGS = fs.readdirSync(path.join(__dirname, '..', '..', 'learnings'))
  .filter((f) => f.endsWith('.html') && f !== 'index.html' && !f.startsWith('_')).map((f) => f.replace(/\.html$/, ''));
for (const slug of ARTICLE_SLUGS) {
  test(`no present-tense experiment wording in the article chrome: ${slug}`, async ({ page }) => {
    await page.goto(url(`/learnings/${slug}`, `/learnings/${slug}.html`));
    const checked = [await page.locator('.disclosure-note').innerText()];
    if (slug !== 'zero-humans-in-the-loop') checked.push(...(await page.locator('.cold-open').allInnerTexts()));
    for (const text of checked) {
      for (const stale of ['makes autonomously', 'ongoing experiment']) expect(text.toLowerCase(), `${slug}: "${stale}"`).not.toContain(stale);
    }
  });
}

test('articles keep the human-authorship disclosure note', async ({ page }) => {
  await page.goto(url('/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'));
  await expect(page.locator('.disclosure-note')).toContainText('not by the AI team');
});
