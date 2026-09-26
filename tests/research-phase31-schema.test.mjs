import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(await readFile(new URL("../research/versions/phase-3-1-schema-v1.json", import.meta.url), "utf8"));

assert.equal(manifest.baseId, "app7dKDinTjxczEfD");
assert.equal(manifest.existingTables.length, 2);
assert.deepEqual(manifest.newTables.map((table) => table.name), [
  "Research Referrals",
  "Research Acquisitions",
  "Research Recruitment Events",
  "Research Propositions"
]);
assert.ok(Object.values(manifest.featureFlags).every((value) => value === false));

const allFields = [
  ...manifest.existingTables.flatMap((table) => table.addFields),
  ...manifest.newTables.flatMap((table) => table.fields)
];
assert.ok(allFields.some((field) => field.name === "Incomplete Expires At"));
assert.ok(allFields.some((field) => field.name === "Incomplete Reminder Sent At"));
assert.ok(allFields.some((field) => field.name === "Referral ID"));
assert.ok(allFields.some((field) => field.name === "Attribution Status"));

for (const forbidden of ["Recipient Name", "Recipient Email", "Message Text", "Answer Data"]) {
  assert.ok(!allFields.some((field) => field.name === forbidden));
}

const result = spawnSync(process.execPath, [
  fileURLToPath(new URL("../scripts/research-phase31-schema.mjs", import.meta.url)),
  "--print-plan"
], { encoding: "utf8" });
assert.equal(result.status, 0, result.stderr);
const plan = JSON.parse(result.stdout);
assert.equal(plan.mode, "plan-only");
assert.ok(Object.values(plan.featureFlags).every((value) => value === false));

console.log("Phase 3.1 schema plan safety checks passed.");
