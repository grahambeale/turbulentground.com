// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * The orange stroke around the active /privacy tab must run up its left side,
 * across its top and down its right side, but NOT along its bottom: the
 * row's 1px baseline is hidden under the active tab (67d1f7d, "Remove active
 * privacy tab baseline"). This reads real pixels under each active tab, at two
 * device pixel ratios, so a sub-pixel misalignment or a CSS change that lets
 * the baseline show through fails here.
 *
 * Runs against SMOKE_TEST_BASE_URL (default production); set SMOKE_HTML_EXT=1
 * for a static server without clean URLs.
 */
const url = process.env.SMOKE_HTML_EXT ? '/privacy.html' : '/privacy';

for (const [width, dpr] of [[390, 3], [390, 2], [1280, 1], [1280, 2]]) {
  test(`active privacy tab has no bottom stroke at ${width}px, DPR ${dpr}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: dpr, isMobile: width < 700 });
    const page = await context.newPage();
    await page.goto(url);
    const count = await page.locator('.privacy-contents button').count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      await page.evaluate((i) => {
        document.documentElement.style.scrollBehavior = 'auto';
        /** @type {HTMLElement} */ (document.querySelectorAll('.privacy-contents button')[i]).click();
        document.querySelector('.privacy-contents button[aria-selected="true"]')?.scrollIntoView({ block: 'center', inline: 'center' });
      }, i);
      await page.waitForTimeout(150);
      const g = await page.evaluate(() => {
        const r = document.querySelector('.privacy-contents button[aria-selected="true"]').getBoundingClientRect();
        return { x: r.left, w: r.width, bottom: r.bottom };
      });
      // A band from just above the tab's bottom edge to just below it, inset from the side strokes.
      const clip = { x: Math.max(0, Math.floor(g.x) + 14), y: Math.floor(g.bottom) - 5, width: Math.max(4, Math.floor(g.w) - 28), height: 8 };
      const b64 = (await page.screenshot({ clip })).toString('base64');
      const orange = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let k = 0; k < d.length; k += 4) if (d[k] > 120 && d[k + 1] < 150 && d[k + 2] < 90 && d[k] - d[k + 2] > 70) n++;
        return n;
      }, b64);
      expect(orange, `orange pixels under active tab #${i}`).toBe(0);
    }
    await context.close();
  });
}
