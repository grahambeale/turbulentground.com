// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Thank-you screen, referral privacy note. At 641px and up it is one plain line under the link field and Copy link
 * button ("Privacy:" in weight 500, DM Sans 600 is not loaded; the rest 400; body size, muted colour, no box). Below that the
 * original callout stays, because the survey's phone presentation is frozen (survey-frozen.spec.js).
 * Uses the no-record review mode; API calls are aborted. SMOKE_HTML_EXT=1 requests the .html files.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const key = /RESTRAINED_PREVIEW_KEY\s*=\s*'([0-9a-f]+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'research', 'index.html'), 'utf8'))[1];
const url = `${html ? '/research/index.html' : '/take-part'}?preview=ux-review&stage=completion&pk=${key}`;
const LINE = 'Privacy: the link contains a random referral code, not your name, email, answers or results.';

async function open(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.route('**/api/**', (r) => r.abort());
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.locator('#referral-sharing')).toBeVisible();
  return { context, page };
}

for (const width of [641, 768, 1440]) {
  test(`${width}px: a plain privacy line sits directly under the link row, the callout is gone`, async ({ browser }) => {
    const { context, page } = await open(browser, width);
    const line = page.locator('.referral-privacy-line');
    await expect(line).toBeVisible();
    expect((await line.innerText()).replace(/\s+/g, ' ')).toBe(LINE);
    await expect(page.locator('.referral-privacy')).toBeHidden();
    const m = await page.evaluate(() => {
      const l = /** @type {HTMLElement} */ (document.querySelector('.referral-privacy-line'));
      const cs = getComputedStyle(l), sc = getComputedStyle(/** @type {Element} */ (l.querySelector('strong')));
      const row = /** @type {HTMLElement} */ (document.querySelector('.referral-link-row')).getBoundingClientRect();
      return {
        size: cs.fontSize, lh: cs.lineHeight, weight: cs.fontWeight, bg: cs.backgroundColor, border: cs.borderLeftWidth, pad: cs.paddingLeft,
        strong: sc.fontWeight, colour: cs.color, strongColour: sc.color, gap: Math.round(l.getBoundingClientRect().top - row.bottom),
      };
    });
    expect(m.size).toBe('18px');
    expect(m.lh).toBe('28.8px');
    expect(m.weight).toBe('400');
    expect(m.strong).toBe('500');
    expect(m.bg).toBe('rgba(0, 0, 0, 0)');
    expect(m.border).toBe('0px');
    expect(m.pad).toBe('0px');
    expect(m.strongColour).toBe(m.colour);
    expect(m.gap).toBeLessThanOrEqual(16);
    await context.close();
  });
}

for (const width of [320, 390, 640]) {
  test(`${width}px: the original callout is unchanged and the plain line is not shown`, async ({ browser }) => {
    const { context, page } = await open(browser, width);
    await expect(page.locator('.referral-privacy')).toBeVisible();
    await expect(page.locator('.referral-privacy')).toContainText('The link does not reveal anything about you.');
    await expect(page.locator('.referral-privacy-line')).toBeHidden();
    await context.close();
  });
}
