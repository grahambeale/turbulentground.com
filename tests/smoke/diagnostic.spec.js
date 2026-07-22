// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Real-browser smoke test for the diagnostic's core flow, run against the
 * LIVE deployed site (see .github/workflows/diagnostic-smoke-test.yml).
 *
 * This is the layer that actually proves the flow *physically works* —
 * tests/diagnostic-flow.test.js proves the script doesn't crash against a
 * mocked DOM, which is necessary but not sufficient; this drives a real
 * Chromium browser through the real page on the real deployed URL, the
 * same way a real visitor (or the person who found this bug, 2026-07-19)
 * would. See decision-log.md row 15 for why this exists.
 *
 * Uses the reserved SMOKE_TEST_EMAIL address (api/submit.js) so scheduled
 * runs don't send a real verification email or write a real Airtable row.
 */

const SMOKE_TEST_EMAIL = 'playwright-smoke-test@turbulentground.com';

test('diagnostic: begin, answer all 25 questions, submit, capture email', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/diagnostic');

  await page.getByRole('button', { name: /begin assessment/i }).click();

  // Answer all 25 questions. Each question is a row of five radio inputs
  // named q_<factorIndex>_<questionIndex>; select the middle option (3) for
  // each, matching real user interaction.
  //
  // Each input is deliberately visually-hidden (clip-rect pattern, 1x1px)
  // with a sibling .likert-circle providing the visible clickable surface —
  // a real visitor clicks the circle (or anywhere in the wrapping <label>),
  // which natively toggles the associated hidden input via standard
  // label-for-input semantics. A real mouse click never lands on the 1x1px
  // input itself. This test's first run (2026-07-22, GitHub Actions) tried
  // clicking the raw <input>, which Playwright resolves to a real, if
  // tiny, hit-test point — and that point was found by the browser's
  // elementFromPoint check to sometimes belong to a neighbouring
  // .likert-circle and sometimes to the fixed nav, depending on scroll
  // timing. That's Playwright's actionability check being (correctly)
  // stricter than the site needs to be for a real user, not necessarily a
  // real usability defect — clicking the label, as below, both matches
  // real interaction and avoids the near-zero-size target entirely.
  for (let fi = 0; fi < 5; fi++) {
    for (let qi = 0; qi < 5; qi++) {
      await page.locator(`label.likert-opt:has(input[name="q_${fi}_${qi}"][value="3"])`).click();
    }
  }

  await page.getByRole('button', { name: /see my results/i }).click();

  // Results page renders asynchronously (awaits a storage lookup before
  // inserting the capture card) — wait for the real element, don't assume
  // timing.
  const emailInput = page.locator('#cap-email');
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  await expect(page.locator('.overall-pct')).toBeVisible();

  await emailInput.fill(SMOKE_TEST_EMAIL);
  await expect(page.locator('#consent-results')).toBeChecked(); // checked by default

  await page.getByRole('button', { name: /send my results/i }).click();

  // The one assertion that directly targets the reported bug: a real
  // click on "Send my results" must produce a visible outcome (success
  // OR a real, informative error) — NOT silence. Silence is what a
  // client-side crash before fetch() looks like to a user.
  const confirmVisible = page.locator('#capture-confirm');
  await expect(confirmVisible).toBeVisible({ timeout: 15000 });
  await expect(confirmVisible).toContainText(/check your inbox/i);

  const errorVisible = await page.locator('#capture-error').isVisible();
  expect(errorVisible, 'capture-error should not be showing alongside a successful confirmation').toBe(false);

  // The real regression signal: no uncaught JS error anywhere during the
  // entire flow. This is deliberately broader than just testing the one
  // known bug — it catches the *next* dead DOM reference too.
  expect(pageErrors, `uncaught JS error(s) during the flow: ${pageErrors.join(' | ')}`).toEqual([]);
});

test('diagnostic page loads with no console errors on a bare visit', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  await page.goto('/diagnostic');
  await page.waitForLoadState('networkidle');
  expect(pageErrors, `uncaught JS error(s) on page load: ${pageErrors.join(' | ')}`).toEqual([]);
});
