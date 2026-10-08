// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Phase 2 decommission (8 Oct 2026): the Care Capital diagnostic and framework pages are retired. Each old URL is a
 * permanent redirect (308) that is asserted here without following it. /diagnostic.html and /care-capital.html first go
 * to the clean URL (cleanUrls) and then on, so those are checked hop by hop. A static server has no vercel.json
 * redirects, so this runs against a deployment only (skipped when SMOKE_HTML_EXT=1).
 */
const html = !!process.env.SMOKE_HTML_EXT;
const base = (process.env.SMOKE_TEST_BASE_URL || 'https://www.turbulentground.com').replace(/\/$/, '');
const pathOf = (loc) => new URL(loc, base).pathname;

for (const [from, to] of [['/diagnostic', '/'], ['/care-capital', '/about']]) {
  test(`${from} is a permanent redirect to ${to}`, async ({ request }) => {
    test.skip(html, 'a static server has no vercel.json redirects');
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(pathOf(res.headers().location)).toBe(to);
  });

  test(`${from}.html reaches ${to} by permanent redirects`, async ({ request }) => {
    test.skip(html, 'a static server has no vercel.json redirects');
    let url = from + '.html';
    for (let hop = 0; hop < 3 && pathOf(url) !== to; hop++) {
      const res = await request.get(url, { maxRedirects: 0 });
      expect(res.status(), url).toBe(308);
      url = res.headers().location;
    }
    expect(pathOf(url)).toBe(to);
  });
}

test('the retired pages and API routes are gone, not served', async ({ request }) => {
  test.skip(html, 'a static server has no vercel.json routing');
  for (const p of ['/diagnostic/index.html', '/api/submit', '/api/verify']) {
    const res = await request.get(p, { maxRedirects: 0 });
    expect([308, 404], `${p} -> ${res.status()}`).toContain(res.status());
  }
});
