// Shared validation logic for the Phase 3 research API routes.
//
// Vercel ignores files/directories under /api whose name starts with an
// underscore when generating routes, so this file is never itself
// deployed as an endpoint — it's purely an import target. Kept minimal
// and deliberately NOT a general "research API utils" grab-bag: the
// standalone-per-route convention established across this build
// (api/research-submit.js, api/research-lookup.js,
// api/research-capture-email.js all duplicate their own Identity-lookup
// code rather than share it) is intentional, so a bug or change in one
// route's Airtable-calling code can't silently affect another. This file
// exists only because validatePairResponses() specifically was called
// out to be shared rather than duplicated a third time.

export const DOMAIN_KEYS = ["d1","d2","d3","d4","d5","d6","d7","d8","d9","d10","d11","d12"];
export const VALID_VALUES = new Set([1, 2, 3, 4, 5, "skip", "not_applicable"]);

export function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Accepts partial objects — a domain key or a contribution/conditions key
// within it may simply be absent (unanswered so far). That's valid for
// both a partial save and a final submission; the completion floor is
// what distinguishes "enough answered" from "not enough", not this
// function.
export function validatePairResponses(pairResponses) {
  if (!isPlainObject(pairResponses)) return "pairResponses must be an object";
  for (const [key, pair] of Object.entries(pairResponses)) {
    if (!DOMAIN_KEYS.includes(key)) return `unknown domain key: ${key}`;
    if (!isPlainObject(pair)) return `domain ${key} must be an object`;
    for (const stmt of ["contribution", "conditions"]) {
      if (!(stmt in pair)) continue; // a statement key may be omitted, not every domain need have both
      if (!VALID_VALUES.has(pair[stmt])) {
        return `domain ${key}.${stmt} must be 1-5, "skip", or "not_applicable", got ${JSON.stringify(pair[stmt])}`;
      }
    }
  }
  return null;
}
