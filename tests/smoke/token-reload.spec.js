// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Reload with a participant link. The page strips ?t= from the address bar and keeps the token in memory, so a reload,
 * a phone browser restoring a background tab, or reopening from tab history used to lose it and show the public start
 * screen. The token is now also kept in sessionStorage for that tab only (never localStorage, never the visible URL),
 * resumed on a token-less load, and cleared on submit, on the completed screen and on an invalid token.
 * Every API is stubbed in the browser; no real token, no real survey data. SMOKE_HTML_EXT=1 requests the .html files.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const survey = html ? '/research/index.html' : '/take-part';
const KEY = 'tg-research-token';

const ROUTES = [['owner invite', 'owner_invite', 'synthetic-owner-token'], ['public participant', 'public_self_service', 'synthetic-public-token']];
const answered = (n) => { const out = {}; for (let i = 1; i <= n; i++) out['d' + i] = { contribution: 3, conditions: 3 }; return out; };
const savedState = (domains) => ({
  instrumentVersion: 'phase3-v4-2026-09-13-paired',
  consent: { takingPart: true, contactStudyEmails: false, quoteAnonymously: true, quoteByName: false },
  context: { role: '', discipline: '', teamResponsibility: '', orgSize: '' },
  pairResponses: answered(domains),
  startedAt: '2026-10-01T09:00:00.000Z',
});
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Stubs every API. `lookup` is the lookup response body; returns the tokens it was asked about and any other API calls. */
async function stub(context, lookup, { publicStart = true } = {}) {
  const lookups = [], other = [];
  await context.route('https://plausible.io/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await context.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/research-lookup')) { lookups.push(url.searchParams.get('t')); return json(route, lookup); }
    if (url.pathname.endsWith('/research-public-start') && route.request().method() === 'GET') return json(route, { enabled: publicStart });
    other.push(route.request().method() + ' ' + url.pathname);
    return json(route, { success: true });
  });
  return { lookups, other };
}
const token = (page) => page.evaluate((k) => sessionStorage.getItem(k), KEY);
const active = (page) => page.locator('.screen.active');

for (const [label, origin, tok] of ROUTES) {
  test(`${label}: reload mid-survey resumes the survey, not the public start screen`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const calls = await stub(context, { valid: true, completed: false, name: 'Test', hasEmail: false, origin, savedState: savedState(3) });
    await page.goto(`${survey}?t=${tok}`);
    await expect(active(page)).toHaveAttribute('id', 'screen-pairs');
    expect(page.url()).not.toContain('t=');
    await page.reload();
    await expect(active(page)).toHaveAttribute('id', 'screen-pairs');
    expect(calls.lookups).toEqual([tok, tok]);
    expect(page.url()).not.toContain('t=');
    expect(await page.evaluate(() => Object.keys(localStorage).length)).toBe(0);   // never localStorage
    await context.close();
  });
}

test('reload on the consent screen (no saved answers yet) stays on consent', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const calls = await stub(context, { valid: true, completed: false, name: 'Test', hasEmail: false, origin: 'owner_invite' });
  await page.goto(`${survey}?t=synthetic-owner-token`);
  await expect(active(page)).toHaveAttribute('id', 'screen-consent');
  await page.reload();
  await expect(active(page)).toHaveAttribute('id', 'screen-consent');
  expect(calls.lookups).toEqual(['synthetic-owner-token', 'synthetic-owner-token']);
  await context.close();
});

test('a new participant link replaces the stored token', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const calls = await stub(context, { valid: true, completed: false, name: 'Test', hasEmail: false, origin: 'owner_invite' });
  await page.goto(`${survey}?t=synthetic-first`);
  await page.goto(`${survey}?t=synthetic-second`);
  await page.reload();
  expect(calls.lookups).toEqual(['synthetic-first', 'synthetic-second', 'synthetic-second']);
  await context.close();
});

test('a fresh visit with no link and nothing stored shows the public start screen', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const calls = await stub(context, { valid: true });
  await page.goto(survey);
  await expect(active(page)).toHaveAttribute('id', 'screen-public-start');
  expect(calls.lookups).toEqual([]);
  await context.close();
});

test('the token stays in sessionStorage only for this tab: a new tab does not inherit it', async ({ browser }) => {
  const context = await browser.newContext();
  const calls = await stub(context, { valid: true, completed: false, name: 'Test', hasEmail: false, origin: 'owner_invite' });
  const first = await context.newPage();
  await first.goto(`${survey}?t=synthetic-owner-token`);
  expect(await token(first)).toBe('synthetic-owner-token');
  const second = await context.newPage();
  await second.goto(survey);
  await expect(active(second)).toHaveAttribute('id', 'screen-public-start');
  expect(calls.lookups).toEqual(['synthetic-owner-token']);
  await context.close();
});

test('the completed screen clears the token: a reload then shows the public start screen', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await stub(context, { valid: true, completed: true });
  await page.goto(`${survey}?t=synthetic-owner-token`);
  await expect(active(page)).toHaveAttribute('id', 'screen-completed');
  expect(await token(page)).toBeNull();
  await page.reload();
  await expect(active(page)).toHaveAttribute('id', 'screen-public-start');
  await context.close();
});

test('an invalid token is not kept: a reload does not retry it', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const calls = await stub(context, { valid: false });
  await page.goto(`${survey}?t=synthetic-bad-token`);
  await expect(active(page)).toHaveAttribute('id', 'screen-invalid');
  expect(await token(page)).toBeNull();
  await page.reload();
  await expect(active(page)).toHaveAttribute('id', 'screen-public-start');
  expect(calls.lookups).toEqual(['synthetic-bad-token']);
  await context.close();
});

test('submitting clears the token: a reload after the thank-you screen does not reopen the survey', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const calls = await stub(context, { valid: true, completed: false, name: 'Test', hasEmail: true, origin: 'public_self_service', savedState: savedState(12) });
  await page.goto(`${survey}?t=synthetic-public-token`);
  await expect(active(page)).toHaveAttribute('id', 'screen-pairs');
  expect(await token(page)).toBe('synthetic-public-token');
  await page.locator('#submit-btn').click();
  await expect(active(page)).toHaveAttribute('id', 'screen-done');
  expect(calls.other).toContain('POST /api/research-submit');
  expect(await token(page)).toBeNull();
  await page.reload();
  await expect(active(page)).toHaveAttribute('id', 'screen-public-start');
  await context.close();
});

test('review previews never use a stored token (no lookup, no writes)', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const calls = await stub(context, { valid: true, completed: false, origin: 'owner_invite', savedState: savedState(3) });
  await page.addInitScript((k) => sessionStorage.setItem(k, 'synthetic-owner-token'), KEY);
  await page.goto(`${survey}?preview=ux-review&stage=completion&pk=71890dda2c5d486b8925d282ba29d62bafd59568`);
  await expect(active(page)).toHaveAttribute('id', 'screen-done');
  await page.waitForTimeout(500);
  expect(calls.lookups).toEqual([]);
  expect(calls.other).toEqual([]);
  await context.close();
});

test('the public start screen tells people who already started how to carry on', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await stub(context, { valid: true });
  await page.goto(survey);
  await expect(page.locator('#screen-public-start')).toContainText('Already started? Enter the same email address and I’ll send your link again.');
  await context.close();
});

test('a failed lookup (network trouble) keeps the token so a reload can retry', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await context.route('https://plausible.io/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await context.route('**/api/research-lookup**', (r) => r.abort());
  await page.goto(`${survey}?t=synthetic-owner-token`);
  await expect(active(page)).toHaveAttribute('id', 'screen-invalid');
  expect(await token(page)).toBe('synthetic-owner-token');
  await context.close();
});
