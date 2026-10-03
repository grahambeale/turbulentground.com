// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Footer decisions (Graham, 2 Oct 2026). The homepage footer is trimmed to a closing
 * line, About / Privacy / Graham's LinkedIn and one final line, with no mention of the
 * AI experiment and no YouTube link; each row is a single line at 320/375/390px.
 * The AI-experiment disclosure must stay on the pages the AI team built: the footer
 * note on /about, /writing, /care-capital, /learnings and every article, and the
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
  ['/care-capital', '/care-capital.html'],
  ['/learnings', '/learnings/index.html'],
  ['/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'],
];
if (html) DISCLOSURE_PAGES.push(['/writing', '/writing.html']);   // production redirects /writing to LinkedIn

for (const [clean, file] of DISCLOSURE_PAGES) {
  test(`AI-experiment disclosure stays in the footer: ${clean}`, async ({ page }) => {
    await page.goto(url(clean, file));
    await expect(page.locator('footer .footer-note')).toContainText('AI product team from Sprint 1');
    await expect(page.locator('footer .footer-note')).toContainText('live experiment');
  });
}

test('articles keep the human-authorship disclosure note', async ({ page }) => {
  await page.goto(url('/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'));
  await expect(page.locator('.disclosure-note')).toContainText('not by the AI team');
});
