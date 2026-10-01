import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const config = JSON.parse(read("vercel.json"));
const rewrite = config.rewrites.find(item => item.source === "/take-part");

assert.deepEqual(rewrite, { source: "/take-part", destination: "/research/index.html" });

const participant = read("research/index.html");
assert.match(participant, /<title>Take part \| Turbulent Ground<\/title>/);
assert.match(participant, /<link rel="canonical" href="https:\/\/www\.turbulentground\.com\/take-part">/);
assert.match(participant, /<meta name="robots" content="noindex, nofollow">/);
assert.match(participant, /\/research\/media\//);
assert.match(participant, /\/research\/privacy/);
assert.match(participant, /\/research\/legacy-v3\.html/);

const emitters = [
  "api/research-invite.js",
  "lib/research-phase31/public-start.js",
  "lib/research-phase31/incomplete-maintenance.js",
  "lib/research-phase31/referral-issue.js",
  "scripts/generate-invite.mjs",
];
for (const path of emitters) {
  const source = read(path);
  assert.match(source, /\/take-part(?:\?|`|\")/, `${path} should emit the canonical participant route`);
  assert.doesNotMatch(source, /\/research\?[tr]=/, `${path} should not emit a new legacy participant link`);
}

const homepage = read("index.html");
assert.match(homepage, /href="\/take-part"/);
assert.doesNotMatch(homepage, /href="\/research"/);

console.log("Phase 4 route and shell contract: PASS");
