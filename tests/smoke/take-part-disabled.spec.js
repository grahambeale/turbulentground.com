// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * /take-part when the public-start switch is off (/api/research-public-start returns
 * enabled:false). Preview hosts (*.vercel.app) say the switch is off there; production
 * says the study is not taking responses and links home. When the switch is on, or the
 * lookup fails, nothing changes: start screen / the existing invalid-link screen.
 * The API is mocked in the browser, so this never touches real data. The preview host
 * is simulated by routing a *.vercel.app origin to the server under test.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const base = (process.env.SMOKE_TEST_BASE_URL || 'https://www.turbulentground.com').replace(/\/$/, '');
const entry = html ? '/research/index.html' : '/take-part';
const mockApi = (page, body, status = 200) =>
  page.route('**/api/research-public-start', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }));

test('production host, switch off: plain notice with a link home', async ({ page }) => {
  await mockApi(page, { enabled: false });
  await page.goto(entry);
  const live = page.locator('#disabled-live');
  await expect(live).toBeVisible();
  await expect(live).toContainText("The study isn't taking new responses right now.");
  await expect(live).toContainText('Thank you for your interest.');
  await expect(live.getByRole('link', { name: 'Back to the homepage' })).toHaveAttribute('href', '/');
  await expect(page.locator('#disabled-preview')).toBeHidden();
  await expect(page.locator('#screen-invalid')).not.toHaveClass(/active/);
});

test('preview host (*.vercel.app), switch off: says entry is switched off here', async ({ page, request }) => {
  const host = 'https://tg-preview-test.vercel.app';
  await page.route(`${host}/**`, async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/api/research-public-start') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: false }) });
    }
    const path = u.pathname === '/take-part' ? '/research/index.html' : u.pathname;
    const r = await request.get(base + path + u.search);
    return route.fulfill({ response: r });
  });
  await page.goto(`${host}${html ? '/research/index.html' : '/take-part'}`);
  const preview = page.locator('#disabled-preview');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('Preview build: survey entry is switched off here.');
  await expect(preview).toContainText('It works on the live site.');
  await expect(page.locator('#disabled-live')).toBeHidden();
});

test('switch on: the start screen, unchanged', async ({ page }) => {
  await mockApi(page, { enabled: true });
  await page.goto(entry);
  await expect(page.locator('#screen-public-start')).toHaveClass(/active/);
  await expect(page.locator('#screen-disabled')).not.toHaveClass(/active/);
  await expect(page.locator('#public-start-submit')).toBeVisible();
});

test('lookup failure: still the existing invalid-link screen', async ({ page }) => {
  await mockApi(page, { error: 'boom' }, 500);
  await page.goto(entry);
  await expect(page.locator('#screen-invalid h1')).toHaveText("This link isn't valid.");
  await expect(page.locator('#screen-disabled')).not.toHaveClass(/active/);
});
