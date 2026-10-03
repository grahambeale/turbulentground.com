// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * The survey records which layout the participant saw and a coarse viewport bucket (phone <640px, tablet 640-1023px,
 * desktop >=1024px) with every save. research/openspec/changes/survey-mobile-type-scale (approved 3 Oct 2026).
 * The API is mocked in the browser: nothing is sent anywhere and no real token is used.
 * Runs against SMOKE_TEST_BASE_URL; SMOKE_HTML_EXT=1 requests the .html file.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const entry = (html ? '/research/index.html' : '/take-part') + '?t=synthetic-presentation-test';
const CASES = [[320, 'phone'], [390, 'phone'], [639, 'phone'], [640, 'tablet'], [1023, 'tablet'], [1024, 'desktop'], [1440, 'desktop']];

for (const [width, bucket] of CASES) {
  test(`the first save carries presentation.version and viewportBucket "${bucket}" at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    /** @type {any[]} */
    const saves = [];
    await page.route('**/api/research-lookup**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, completed: false, name: 'Test', hasEmail: false }) }));
    await page.route('**/api/research-save-progress', async (route) => {
      saves.push(JSON.parse(route.request().postData() || '{}'));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.goto(entry);
    await page.locator('#consent-taking-part').check();
    await page.locator('#consent-continue').click();
    await expect.poll(() => saves.length).toBeGreaterThan(0);
    const declared = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--presentation-version').trim());
    expect(declared).toMatch(/^[a-z0-9-]+$/);
    expect(saves[0].presentation).toEqual({ version: declared, viewportBucket: bucket });
    expect(JSON.stringify(saves[0])).not.toMatch(/innerWidth|userAgent|screen/i);   // nothing finer than the bucket
    await context.close();
  });
}
