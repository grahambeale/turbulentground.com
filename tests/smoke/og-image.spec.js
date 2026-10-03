// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * FB-20261003-OG-IMAGE-RELATIVE. Every article's og:image must be an absolute https://www.turbulentground.com/... URL
 * and the image must be served (200, an image content type) by the site under test. The URL's path is requested on
 * SMOKE_TEST_BASE_URL, so this checks the deployed copy (and the local public/ in the pre-push hook) rather than whatever
 * production happens to hold. Runs against production by default; SMOKE_HTML_EXT=1 requests the .html files.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const base = (process.env.SMOKE_TEST_BASE_URL || 'https://www.turbulentground.com').replace(/\/$/, '');
const dir = path.join(__dirname, '..', '..', 'learnings');
const slugs = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html' && f !== '_article-template.html').map((f) => f.replace(/\.html$/, ''));

test('there are articles to check', () => expect(slugs.length).toBeGreaterThanOrEqual(10));

for (const slug of slugs) {
  test(`og:image is absolute and returns 200: ${slug}`, async ({ request }) => {
    const page = await request.get(`${base}/learnings/${slug}${html ? '.html' : ''}`);
    expect(page.status()).toBe(200);
    const m = (await page.text()).match(/<meta property="og:image" content="([^"]*)"/);
    expect(m, 'no og:image meta').toBeTruthy();
    const url = /** @type {RegExpMatchArray} */ (m)[1];
    expect(url).toMatch(/^https:\/\/www\.turbulentground\.com\/[A-Za-z0-9_\-./]+\.(png|jpe?g|webp)$/);
    const img = await request.get(base + new URL(url).pathname);
    expect(img.status(), `${url} on ${base}`).toBe(200);
    expect(img.headers()['content-type'] || '').toMatch(/^image\//);
  });
}
