// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * "About" is in the shared navigation, after the existing links and before the
 * Take part button, in both the desktop bar and the mobile menu. The survey
 * pages keep their deliberately stripped nav (no links).
 *
 * Runs against SMOKE_TEST_BASE_URL (default production); set SMOKE_HTML_EXT=1 for
 * a static server without clean URLs.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const url = (clean, file) => (html ? file : clean);
const PAGES = [
  ['home', '/', '/index.html', ['Learnings', 'About']],
  ['learnings', '/learnings', '/learnings/index.html', ['Home', 'Learnings', 'About']],
  ['article', '/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html', ['Home', 'Learnings', 'About']],
  ['privacy', '/privacy', '/privacy.html', ['Home', 'Learnings', 'About']],
  ['about', '/about', '/about.html', ['Home', 'Learnings', 'About']],
];

for (const [name, clean, file, expected] of PAGES) {
  test(`desktop nav lists ${expected.join(', ')} then the CTA: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url(clean, file));
    const links = await page.locator('.nav-links .nav-link').allTextContents();
    expect(links.map((t) => t.trim())).toEqual(expected);
    const hrefs = await page.locator('.nav-links .nav-link').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs[hrefs.length - 1]).toBe('/about');
    // The About link comes before the Take part button in DOM order.
    const order = await page.evaluate(() => {
      const about = document.querySelector('.nav-links a[href="/about"]');
      const cta = document.querySelector('.nav-links .nav-btn');
      return about && cta ? !!(about.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(order, 'About precedes the Take part button').toBe(true);
  });

  test(`mobile menu lists About: ${name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(url(clean, file));
    await page.locator('#nav-toggle').click();
    await page.waitForTimeout(500);
    const items = await page.locator('#mobile-menu a:not(.mobile-menu-btn)').allTextContents();
    expect(items.map((t) => t.trim())).toEqual(expected);
    await expect(page.locator('#mobile-menu a[href="/about"]')).toBeVisible();
    await context.close();
  });
}

test('/about marks About as the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url('/about', '/about.html'));
  await expect(page.locator('.nav-links a[href="/about"]')).toHaveClass(/active/);
});

// The extra link must not crowd the bar: no wrapping or sideways scroll just above
// the 720px breakpoint where the full bar first appears.
for (const width of [721, 760, 800, 860, 900, 1024, 1280]) {
  test(`desktop nav fits on one line at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(url('/learnings', '/learnings/index.html'));
    const m = await page.evaluate(() => {
      const nav = document.querySelector('.nav');
      const links = document.querySelector('.nav-links');
      const logo = document.querySelector('.nav-logo');
      const centres = [...document.querySelectorAll('.nav-links .nav-link, .nav-links .nav-btn')].map((e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
      return {
        sw: document.documentElement.scrollWidth, vw: window.innerWidth,
        navH: nav.getBoundingClientRect().height,
        oneRow: Math.max(...centres) - Math.min(...centres) < 3,
        gap: links.getBoundingClientRect().left - logo.getBoundingClientRect().right,
        linksRight: links.getBoundingClientRect().right,
      };
    });
    expect(m.sw, 'no sideways scroll').toBeLessThanOrEqual(m.vw);
    expect(m.oneRow, 'links on one row').toBe(true);
    expect(m.gap, 'space between logo and links').toBeGreaterThanOrEqual(8);
    expect(m.linksRight, 'links end inside the viewport with padding').toBeLessThanOrEqual(m.vw - 16);
  });
}

test('survey pages keep their stripped nav (no About)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url('/take-part', '/research/index.html'));
  await expect(page.locator('.nav-links')).toHaveCount(0);
});
