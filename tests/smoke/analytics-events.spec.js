// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Plausible funnel events (tracking only). Plausible and every API are stubbed in the browser: nothing is sent to real
 * analytics and no real token is used. Events are kept in sessionStorage so they survive navigation, in call order.
 *
 *  1. Event ORDER by route. Invitation: Invite Validated -> Consent Completed. Public: Public Start Viewed -> Consent
 *     Completed, and Invite Validated NEVER fires (it used to fire after Consent Completed and label public
 *     participants as invited, which broke Plausible's sequential "Study completion" funnel).
 *  2. The homepage CTA event ('Homepage Research CTA Clicked', prop position) is sent BEFORE the page navigates, even if
 *     Plausible never calls back; new-tab and modified clicks are not delayed.
 * Runs against SMOKE_TEST_BASE_URL; SMOKE_HTML_EXT=1 requests the .html files.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const survey = html ? '/research/index.html' : '/take-part';
const home = html ? '/index.html' : '/';

/** Records every plausible(name, opts) call, in order, in sessionStorage; optionally calls back after `callbackMs`. */
const stub = (callbackMs, loaded = true) => `
  window.plausible = function (name, opts) {
    var log = JSON.parse(sessionStorage.getItem('__ev') || '[]');
    log.push({ name: name, props: (opts && opts.props) || null, t: Date.now() });
    sessionStorage.setItem('__ev', JSON.stringify(log));
    if (opts && typeof opts.callback === 'function' && ${callbackMs} >= 0) setTimeout(opts.callback, ${callbackMs});
  };
  ${loaded ? 'window.plausible.l = true; window.plausible.v = 36;' : ''}   // the real script sets these once it has loaded`;
const events = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('__ev') || '[]'));
const names = async (page) => (await events(page)).map((e) => e.name).filter((n) => /^Research: (Invite Validated|Public Start Viewed|Consent Completed)$/.test(n));

async function prepare(context, { origin, publicStart = false, callbackMs = 20, loaded = true } = {}) {
  await context.addInitScript(stub(callbackMs, loaded));
  await context.route('https://plausible.io/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await context.route('**/api/research-public-start', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: publicStart }) }));
  await context.route('**/api/research-lookup**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, completed: false, name: 'Test', hasEmail: false, origin }) }));
  await context.route('**/api/research-save-progress', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
}
/** Records, per click, whether any handler cancelled the default navigation (read after navigation from sessionStorage). */
const watchDefaultPrevented = (context) => context.addInitScript(`
  document.addEventListener('click', function (e) { sessionStorage.setItem('__dp', String(e.defaultPrevented)); });`);
const defaultWasPrevented = (page) => page.evaluate(() => sessionStorage.getItem('__dp') === 'true');

async function agreeAndContinue(page) {
  await page.locator('#consent-taking-part').check();
  await page.locator('#consent-continue').click();
  await expect(page.locator('#screen-context')).toHaveClass(/active/);
}

test('invitation route: Invite Validated comes before Consent Completed, and no Public Start Viewed', async ({ browser }) => {
  const context = await browser.newContext();
  await prepare(context, { origin: 'owner_invite' });
  const page = await context.newPage();
  await page.goto(`${survey}?t=synthetic-invite`);
  await expect(page.locator('#screen-consent')).toHaveClass(/active/);
  expect(await names(page)).toEqual(['Research: Invite Validated']);
  await agreeAndContinue(page);
  expect(await names(page)).toEqual(['Research: Invite Validated', 'Research: Consent Completed']);
  await context.close();
});

test('public route: Public Start Viewed, then Consent Completed; Invite Validated never fires', async ({ browser }) => {
  const context = await browser.newContext();
  await prepare(context, { origin: 'public_self_service', publicStart: true });
  const page = await context.newPage();
  await page.goto(survey);   // no token: the public start screen
  await expect(page.locator('#screen-public-start')).toHaveClass(/active/);
  expect(await names(page)).toEqual(['Research: Public Start Viewed']);
  // What the start form does on success: remember the consent, then continue with the new token. Done directly so no form data is posted.
  await page.evaluate(() => sessionStorage.setItem('tg-public-start-consent', JSON.stringify({ takingPart: true, contactStudyEmails: false })));
  await page.goto(`${survey}?t=synthetic-public`);
  await expect(page.locator('#screen-context')).toHaveClass(/active/);   // consent was carried over: straight to the profile screen
  expect(await names(page)).toEqual(['Research: Public Start Viewed', 'Research: Consent Completed']);
  await context.close();
});

test('a returning public participant (no start screen in this visit) is not labelled as invited', async ({ browser }) => {
  const context = await browser.newContext();
  await prepare(context, { origin: 'public_self_service' });
  const page = await context.newPage();
  await page.goto(`${survey}?t=synthetic-public-return`);
  await expect(page.locator('#screen-consent')).toHaveClass(/active/);
  expect(await names(page)).toEqual([]);
  await agreeAndContinue(page);
  expect(await names(page)).toEqual(['Research: Consent Completed']);
  await context.close();
});

test('homepage CTA, Plausible loaded: the event is sent and navigation is NOT held (the real script uses keepalive)', async ({ browser }) => {
  const context = await browser.newContext();
  await prepare(context, { callbackMs: -1, loaded: true });   // never calls back: proves the click does not wait for it
  await watchDefaultPrevented(context);
  const page = await context.newPage();
  await page.goto(home);
  const hero = page.locator('a[data-research-cta="hero"]').first();
  await hero.scrollIntoViewIfNeeded();
  const clicked = Date.now();
  await Promise.all([page.waitForURL(/take-part|research\/index/), hero.click()]);
  const navigated = Date.now();
  const ev = (await events(page)).find((e) => e.name === 'Homepage Research CTA Clicked');
  expect(ev, 'the event was sent before the page unloaded').toBeTruthy();
  expect(ev.props).toEqual({ position: 'hero' });
  expect(await defaultWasPrevented(page), 'the click is not cancelled and re-issued later: the browser navigates at once').toBe(false);
  await context.close();
});

for (const [label, cb, atLeast] of [['Plausible calls back quickly', 40, 0], ['Plausible never calls back (blocked or slow)', -1, 250]]) {
  test(`homepage CTA, Plausible NOT yet loaded (a queued call would be lost on unload): held for the callback or 300ms, ${label}`, async ({ browser }) => {
    const context = await browser.newContext();
    await prepare(context, { callbackMs: cb, loaded: false });
    await watchDefaultPrevented(context);
    const page = await context.newPage();
    await page.goto(home);
    const hero = page.locator('a[data-research-cta="hero"]').first();
    await hero.scrollIntoViewIfNeeded();
    const clicked = Date.now();
    await Promise.all([page.waitForURL(/take-part|research\/index/), hero.click()]);
    const navigated = Date.now();
    const ev = (await events(page)).find((e) => e.name === 'Homepage Research CTA Clicked');
    expect(ev, 'the CTA event was recorded before the page unloaded').toBeTruthy();
    expect(ev.props).toEqual({ position: 'hero' });
    expect(ev.t, 'recorded at the click, before navigation').toBeLessThanOrEqual(navigated);
    expect(await defaultWasPrevented(page), 'the navigation was held (cancelled, then performed from the callback or the 300ms fallback)').toBe(true);
    expect(navigated - clicked, 'held no longer than the 300ms fallback plus load time').toBeLessThan(2500);
    expect(navigated - clicked).toBeGreaterThanOrEqual(atLeast);
    await context.close();
  });
}

test('homepage CTA: a ctrl-click (new tab) is not delayed or cancelled and still records the event', async ({ browser }) => {
  const context = await browser.newContext();
  await prepare(context, { callbackMs: -1 });
  const page = await context.newPage();
  await page.goto(home);
  const hero = page.locator('a[data-research-cta="hero"]').first();
  await hero.scrollIntoViewIfNeeded();
  const before = page.url();
  const [popup] = await Promise.all([context.waitForEvent('page'), hero.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] })]);
  await popup.close();
  expect(page.url(), 'this page stays where it is: the link opened in a new tab').toBe(before);
  expect((await events(page)).filter((e) => e.name === 'Homepage Research CTA Clicked'), 'the event is still recorded, once').toHaveLength(1);
  await context.close();
});
