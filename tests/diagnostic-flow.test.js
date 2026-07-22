#!/usr/bin/env node
/**
 * Regression test for diagnostic/index.html's core user flow:
 * begin assessment -> answer 25 questions -> see results -> submit email
 * capture form.
 *
 * WHY THIS EXISTS (read before deleting or skipping it):
 * Sprint 5's "remove team mode" cleanup (commit ec8418a) deleted the
 * team-code/team-name UI elements from this page but left several
 * `document.getElementById(...)` references to them in the JavaScript.
 * The one inside submitCapture() — `getElementById('cap-team').value` —
 * threw a TypeError the instant a real visitor clicked "Send my results",
 * before the request to /api/submit was even sent, outside the function's
 * own try/catch. No error message, no network request, nothing visible.
 * This was completely undetected by four sprints of code-review-based QA
 * because nothing in that review process actually *ran* the page. It was
 * found only when a human reported the survey as broken and someone tried
 * it by hand — see decision-log.md row 15 (dated 2026-07-19).
 *
 * This script loads the real page script (not a copy, not a rewrite) into
 * a minimal mocked DOM/window/fetch and actually executes it, the same way
 * a browser would, to catch this whole class of bug (a JS reference to a
 * DOM element that doesn't exist) without needing a real browser. Run it:
 *
 *   node tests/diagnostic-flow.test.js
 *
 * Exit code 0 = pass, non-zero = fail. Intended to run every sprint before
 * any change to diagnostic/index.html is considered verified, and in CI
 * on every push (see .github/workflows/).
 *
 * This is NOT a substitute for the real-browser smoke test in
 * .github/workflows/diagnostic-smoke-test.yml — this catches "does the
 * script even run without crashing", the smoke test catches "does the
 * live, deployed site actually work". Both exist because each catches
 * things the other can't: this one runs on every sprint with no network
 * dependency; the smoke test only runs against a real deployed URL.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE_PATH = path.join(__dirname, '..', 'diagnostic', 'index.html');

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Minimal DOM mock ────────────────────────────────────────────────────
// Real element IDs that actually exist in diagnostic/index.html's capture
// card and survey intro. Anything NOT in this set returns null from
// getElementById, exactly like a real browser — which is the whole point:
// it forces every reference to a since-removed element to surface here
// instead of in production.
const REAL_IDS = new Set([
  'cap-email', 'consent-results', 'consent-findings', 'consent-contribute',
  'capture-error', 'capture-confirm', 'capture-btn',
  'country-select', 'sector-select',
  'survey-content', 'answered-count', 'progress-bar',
  'results-content', 'main-nav',
]);

function makeElement(id) {
  return {
    id,
    value: '',
    checked: id === 'consent-results',
    textContent: '',
    innerHTML: '',
    style: {},
    disabled: false,
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    addEventListener() {},
    setAttribute() {},
    querySelectorAll() { return []; },
  };
}

function buildContext() {
  let fetchCalledWith = null;
  const plausibleEvents = [];

  const activeIds = new Set(REAL_IDS);
  const elementCache = new Map(); // real DOM returns the SAME node on repeated
  // getElementById(id) calls; caching here so state changes (e.g. .value,
  // .textContent set by the page script) are visible to assertions below,
  // instead of silently vanishing into a throwaway object each call.

  const mockDocument = {
    body: { style: {} },
    getElementById(id) {
      if (!activeIds.has(id)) return null;
      if (!elementCache.has(id)) elementCache.set(id, makeElement(id));
      return elementCache.get(id);
    },
    querySelector(sel) {
      if (sel === '.page.active') return { id: 'page-0' };
      if (sel === '.overall-pct') return { textContent: '' };
      return null;
    },
    querySelectorAll() { return []; },
    createElement() { return makeElement('x'); },
    addEventListener() {},
  };

  const ctx = {
    document: mockDocument,
    window: {
      location: { search: '', href: 'https://turbulentground.com/diagnostic' },
      storage: { get: async () => null, set: async () => {} },
      addEventListener() {},
      scrollY: 0,
      scrollTo() {},
    },
    URLSearchParams,
    navigator: { clipboard: { writeText: async () => {} } },
    plausible: (name) => { plausibleEvents.push(name); },
    fetch: async (url, opts) => {
      fetchCalledWith = { url, opts };
      return { ok: true, json: async () => ({ status: 'verification_sent' }) };
    },
    console,
    setTimeout,
    Math,
    Date,
    JSON,
    Object,
    Array,
    Promise,
  };
  vm.createContext(ctx);
  return { ctx, getFetchCalledWith: () => fetchCalledWith, getPlausibleEvents: () => plausibleEvents, activeIds };
}

async function run() {
  console.log('diagnostic-flow.test.js — loading real page script from diagnostic/index.html\n');

  const html = fs.readFileSync(PAGE_PATH, 'utf8');
  // The page now has more than one bare <script>...</script> block (Sprint 7
  // added a small error-telemetry snippet right after the Plausible tag, in
  // <head>, ahead of the actual page-logic script further down). Don't just
  // grab the first bare <script> match — find the one that actually defines
  // the survey flow, identified by a distinctive anchor string.
  const scriptBlocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const scriptSrc = scriptBlocks.find(s => s.includes('function startSurvey'));
  if (!scriptSrc) {
    console.log(`  FAIL  could not find the page-logic <script> block (checked ${scriptBlocks.length} bare <script> blocks) in diagnostic/index.html`);
    process.exit(1);
  }

  // Also assert the render-blocking @import regression (Sprint 7) hasn't
  // crept back in, since this file already touches font-loading.
  check(
    'no CSS @import remains (Sprint 7 render-blocking-CSS fix)',
    !html.includes('@import url'),
    'found an @import — this reintroduces the render-blocking font-loading pattern fixed in Sprint 7'
  );

  // Every bare <script> block on the page (including the small Sprint 7
  // error-telemetry snippet, which isn't otherwise exercised by this test)
  // must at least be syntactically valid — cheap, catches hand-edit typos
  // across all seven pages that carry this snippet.
  let allScriptsParse = true;
  let badScriptIndex = -1;
  scriptBlocks.forEach((s, i) => {
    try { new Function(s); } catch (e) { allScriptsParse = false; if (badScriptIndex === -1) badScriptIndex = i; }
  });
  check(`all ${scriptBlocks.length} inline <script> block(s) are syntactically valid`, allScriptsParse, badScriptIndex >= 0 ? `block #${badScriptIndex} failed to parse` : '');

  const { ctx, getFetchCalledWith, getPlausibleEvents } = buildContext();

  try {
    vm.runInContext(scriptSrc, ctx);
  } catch (e) {
    check('page script loads without throwing', false, e.message);
    process.exit(1);
  }
  check('page script loads without throwing', true);

  // ── Scenario 1: visiting via an old team-invite link (?code=...) ───────
  console.log('\nScenario: setMode(\'team\') — simulates a visit via an old ?code= team-invite link');
  try {
    ctx.setMode('team');
    check('setMode(\'team\') does not throw', true);
  } catch (e) {
    check('setMode(\'team\') does not throw', false, e.message);
  }

  // ── Scenario 2: the actual reported bug — full survey + submit ─────────
  console.log('\nScenario: full flow — begin assessment, answer 25 questions, submit, capture email');
  try {
    ctx.startSurvey();
    check('startSurvey() does not throw', true);
  } catch (e) {
    check('startSurvey() does not throw', false, e.message);
    process.exit(1);
  }

  for (let fi = 0; fi < 5; fi++) {
    for (let qi = 0; qi < 5; qi++) {
      ctx.recordAnswer(`q_${fi}_${qi}`, 3, fi, qi);
    }
  }
  // `answers` is a top-level `let` in the page script — vm.runInContext
  // does not expose `let`/`const` bindings as properties of the context
  // object (only `var` and function declarations get that), so we check
  // the DOM side effect recordAnswer() produces instead of the binding
  // itself. This mirrors what a real test would observe anyway.
  // Real DOM auto-stringifies anything assigned to .textContent; this mock
  // doesn't, so cast before comparing (the page assigns a number here).
  const answeredCount = String(ctx.document.getElementById('answered-count').textContent);
  check('all 25 answers recorded', answeredCount === '25', `answered-count shows "${answeredCount}"`);

  try {
    ctx.submitSurvey();
    check('submitSurvey() does not throw', true);
  } catch (e) {
    check('submitSurvey() does not throw', false, e.message);
    process.exit(1);
  }

  // renderResults() is async and inserts the capture-card HTML after an
  // await — give it real event-loop turns rather than assuming it's
  // synchronous (this mirrors a real user, who always takes at least a
  // moment before reaching for the email field).
  let waited = 0;
  while (!ctx.document.getElementById('cap-email') && waited < 3000) {
    await wait(50);
    waited += 50;
  }
  const captureCardPresent = !!ctx.document.getElementById('cap-email');
  check('capture card (cap-email field) renders after submitSurvey()', captureCardPresent, `waited ${waited}ms`);
  if (!captureCardPresent) process.exit(1);

  ctx.document.getElementById('cap-email').value = 'test@example.com';

  try {
    await ctx.submitCapture();
    const called = getFetchCalledWith();
    check('submitCapture() reaches fetch(/api/submit) without throwing', !!called);
    if (called) {
      const body = JSON.parse(called.opts.body);
      check('payload.email is correct', body.email === 'test@example.com', body.email);
      check('payload.team_name is a string, not a crash (regression check for the cap-team bug)', typeof body.team_name === 'string', typeof body.team_name);
      check('payload.respondent_name is a string', typeof body.respondent_name === 'string', typeof body.respondent_name);
    }
    check('\'Diagnostic: Email Submitted\' event fires on successful submit', getPlausibleEvents().includes('Diagnostic: Email Submitted'), getPlausibleEvents().join(','));
  } catch (e) {
    check('submitCapture() reaches fetch(/api/submit) without throwing', false, e.message);
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
