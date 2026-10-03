// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Every internal link on the covered pages must resolve: 200, or an intended redirect
 * (cleanUrls, vercel.json redirects, the /writing redirect to LinkedIn). Added after a
 * report that "Take part" returned 404 on a phone: nothing was broken, but nothing
 * would have caught it if it had been. Includes every "Take part" CTA and nav link.
 *
 * Runs against SMOKE_TEST_BASE_URL (default production). With SMOKE_HTML_EXT=1 the
 * target is a plain static server that does not apply vercel.json, so links are
 * resolved here with the same rules (rewrites, redirects, cleanUrls) before requesting.
 * API routes and external links are not followed.
 */
const html = !!process.env.SMOKE_HTML_EXT;
const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'vercel.json'), 'utf8'));
const rewrites = new Map((vercel.rewrites || []).map((r) => [r.source, r.destination]));
const redirects = new Map((vercel.redirects || []).map((r) => [r.source, r.destination]));

const PAGES = [
  ['/', '/index.html'],
  ['/about', '/about.html'],
  ['/care-capital', '/care-capital.html'],
  ['/privacy', '/privacy.html'],
  ['/learnings', '/learnings/index.html'],
  ['/take-part', '/research/index.html'],
  ['/research/privacy', '/research/privacy.html'],
  ['/learnings/make-my-ai-team-take-risks', '/learnings/make-my-ai-team-take-risks.html'],
  ['/learnings/chatgpt-starts-this-week', '/learnings/chatgpt-starts-this-week.html'],
  ['/learnings/seven-copies-of-the-rules', '/learnings/seven-copies-of-the-rules.html'],
  ['/learnings/signals-added-to-the-pile', '/learnings/signals-added-to-the-pile.html'],
  ['/learnings/eleven-sprints-in', '/learnings/eleven-sprints-in.html'],
  ['/learnings/how-does-an-ai-team-miss-a-failure-this-big', '/learnings/how-does-an-ai-team-miss-a-failure-this-big.html'],
  ['/learnings/the-silent-veto', '/learnings/the-silent-veto.html'],
  ['/learnings/what-zero-intervention-actually-means', '/learnings/what-zero-intervention-actually-means.html'],
  ['/learnings/analytics-data-mean-what-you-think', '/learnings/analytics-data-mean-what-you-think.html'],
  ['/learnings/zero-humans-in-the-loop', '/learnings/zero-humans-in-the-loop.html'],
];
if (html) PAGES.push(['/writing', '/writing.html']);   // production redirects /writing to LinkedIn

/** Candidate static files for an internal path, applying vercel.json like Vercel does. */
function candidates(p) {
  const clean = p.replace(/\.html$/, '');
  if (redirects.has(p) || redirects.has(clean)) {
    const to = redirects.get(p) || redirects.get(clean);
    return /^https?:/.test(to) ? [] : candidates(to);   // an external redirect (e.g. /writing) is intended
  }
  if (rewrites.has(p) || rewrites.has(clean)) return candidates(rewrites.get(p) || rewrites.get(clean).split('?')[0]);
  if (/\.[a-z0-9]+$/i.test(p) && !p.endsWith('.html')) return [p];
  return [clean + '.html', clean + '/index.html', p];
}

for (const [clean, file] of PAGES) {
  test(`every internal link resolves: ${clean}`, async ({ page, request }) => {
    await page.goto(html ? file : clean);
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')].map((a) => /** @type {HTMLAnchorElement} */ (a).href));
    const anchors = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h && h.length > 1 && !document.getElementById(h.slice(1))));
    expect(anchors, `in-page anchors on ${clean} with no target element`).toEqual([]);
    const origin = new URL(page.url()).origin;
    const targets = new Set();
    for (const h of hrefs) {
      const u = new URL(h);
      if (u.origin !== origin || /^\/(api|_vercel)\//.test(u.pathname)) continue;
      targets.add(u.pathname);
    }
    if (clean !== '/research/privacy') expect(targets.size).toBeGreaterThan(0);   // that page is a redirect shell
    for (const p of targets) {
      if (html) {
        const results = [];
        const list = candidates(p);
        let ok = list.length === 0;
        for (const c of list) {
          const r = await request.get(origin + c);
          results.push(`${c} ${r.status()}`);
          if (r.status() === 200) { ok = true; break; }
        }
        expect(ok, `${p} on ${clean} does not resolve (${results.join(', ')})`).toBe(true);
      } else {
        const r = await request.get(origin + p, { maxRedirects: 0 });
        const s = r.status();
        const good = s === 200 || ([301, 302, 307, 308].includes(s) && !!r.headers()['location']);
        expect(good, `${p} on ${clean} returned ${s}`).toBe(true);
      }
    }
  });
}

test('every Take part link goes to /take-part, which renders the study page (start screen or, on previews, the invalid-link message)', async ({ page }) => {
  await page.goto(html ? '/index.html' : '/');
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a')].filter((a) => /take part|put your experience|go on the record/i.test(a.textContent || '')).map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) expect(['/take-part', '#join']).toContain(h);   // #join scrolls to the closing CTA on the same page
  expect(hrefs).toContain('/take-part');
  await page.goto(html ? '/research/index.html' : '/take-part');
  await expect(page).toHaveTitle(/Take part/);
});
