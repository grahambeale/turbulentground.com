import { INSTRUMENTS } from './_research-instruments.js';

// Two gates, deliberately separate (decision log 2026-10-27, benchmark compatibility revision 2, D3).
// BENCHMARK_MIN_COHORT is the per-statement observation floor: a statement mean is computed only when at least this
// many valid 1 to 5 answers exist. BENCHMARK_ANNOUNCE_MIN_PARTICIPANTS is the pre-registered participant gate: no
// participant is shown any mean until the pooled cohort has this many distinct completions, even where a statement
// already clears the observation floor.
export const BENCHMARK_MIN_COHORT = 15;
export const BENCHMARK_ANNOUNCE_MIN_PARTICIPANTS = 30;
export const BENCHMARK_POLICY_ID = 'statement-benchmark-v2-2026-10-27';

// Revision-1 audit: V3/V4 explanatory text and presentation order changed.
// Exact statement text alone is insufficient. V1 to V3 remain unpooled.
//
// Decision log 2026-10-27 (revision 2, D1): V4 and V5 are pooled. All 24 statement texts, domain keys, storage
// fields, scale and order are identical; V5 only adds optional help text, collapsed behind a toggle. Equivalence is
// assumed on design grounds, not demonstrated. Reversal criterion, pre-committed: when V4 and V5 each have at least
// 15 completions, if more than 4 of 24 statements differ in mean by over 0.5, this group is removed, the benchmark
// is recomputed on V5 alone and every participant who received a pooled comparison is told.
export const CROSS_VERSION_GROUPS = Object.freeze([
  Object.freeze(['phase3-v4-2026-09-13-paired', 'phase3-v5-2026-09-25-examples']),
]);

export function pooledVersions(targetVersion) {
  const group = CROSS_VERSION_GROUPS.find(g => g.includes(targetVersion));
  return group ? [...group] : [targetVersion];
}

// options (a bare string is still accepted as computedAt):
//   computedAt         provenance timestamp
//   excludedRecordIds  Set of Responses record ids from research/excluded-responses.json (D2). Skipped before dedupe.
//   allowedTokens      Set of tokens that have an Identity row (D2 orphan guard). Other tokens are skipped before
//                      dedupe. Omitted means no token filtering.
//   retakeTokens       Set of tokens whose Identity origin is retake. Disclosure only (retakeCount); retakes count in
//                      the cohort like any other response.
export function computeStatementBenchmark(records, targetVersion, options = {}) {
  const opts = typeof options === 'string' ? { computedAt: options } : (options || {});
  const computedAt = opts.computedAt || new Date().toISOString();
  const excludedIds = opts.excludedRecordIds instanceof Set ? opts.excludedRecordIds : null;
  const allowedTokens = opts.allowedTokens instanceof Set ? opts.allowedTokens : null;
  const retakeTokens = opts.retakeTokens instanceof Set ? opts.retakeTokens : new Set();
  if (!Object.hasOwn(INSTRUMENTS, targetVersion)) throw new Error('Unknown questionnaire version');
  const versions = pooledVersions(targetVersion);
  const byToken = new Map();
  let excludedByList = 0, excludedOrphans = 0;
  for (const record of records) {
    if (excludedIds && excludedIds.has(record.id)) { excludedByList++; continue; }
    const f = record.fields || {};
    if (!f.fld8sYjswX21vvVXz || f.fldc1EMbDAHAO99Av !== true ||
        !Object.hasOwn(INSTRUMENTS, f.fldHJ4KNzMbpzdob6) ||
        typeof f.flduL4PmBEfH9rLpz !== 'string' || !f.flduL4PmBEfH9rLpz.trim()) continue;
    const token = f.flduL4PmBEfH9rLpz.trim();
    if (allowedTokens && !allowedTokens.has(token)) { excludedOrphans++; continue; }
    const group = byToken.get(token) || [];
    group.push(record); byToken.set(token, group);
  }
  // Ambiguous duplicate completions are excluded rather than choosing scores.
  const unique = [...byToken.values()].filter(g => g.length === 1).map(g => g[0]);
  const eligible = [];
  const present = new Set();
  let retakeCount = 0;
  for (const record of unique) {
    const version = record.fields.fldHJ4KNzMbpzdob6;
    if (!versions.includes(version)) continue;
    try {
      const pairs = JSON.parse(record.fields.fldvxb2mrIYVKLGVM || '{}');
      if (pairs && typeof pairs === 'object' && !Array.isArray(pairs)) {
        eligible.push(pairs);
        present.add(version);
        if (retakeTokens.has(record.fields.flduL4PmBEfH9rLpz.trim())) retakeCount++;
      }
    } catch { /* A malformed response supplies no comparison observations. */ }
  }
  const versionsPresent = versions.filter(v => present.has(v));
  const domains = {}, availability = {};
  for (const domain of INSTRUMENTS[targetVersion]) {
    domains[domain.key] = {}; availability[domain.key] = {};
    for (const statement of domain.statements) {
      const values = eligible.map(p => p[domain.key]?.[statement.field])
        .filter(v => Number.isInteger(v) && v >= 1 && v <= 5);
      const n = values.length;
      const statementVersions = n ? versionsPresent : [];
      domains[domain.key][statement.field] = n >= BENCHMARK_MIN_COHORT
        ? { mean: values.reduce((a, b) => a + b, 0) / n, n, versions: statementVersions } : null;
      availability[domain.key][statement.field] = { n, versions: statementVersions,
        state: n >= BENCHMARK_MIN_COHORT ? 'available' : 'building' };
    }
  }
  return {
    cohortSize: eligible.length,
    announceGate: BENCHMARK_ANNOUNCE_MIN_PARTICIPANTS,
    announced: eligible.length >= BENCHMARK_ANNOUNCE_MIN_PARTICIPANTS,
    pooledVersions: versions, versionsPresent, retakeCount, excludedByList, excludedOrphans,
    domains, availability, policyId: BENCHMARK_POLICY_ID, computedAt,
  };
}

export function benchmarkProvenance(benchmark) {
  return { policyId: benchmark.policyId, computedAt: benchmark.computedAt,
    minimumObservations: BENCHMARK_MIN_COHORT, announceGate: benchmark.announceGate,
    cohortSize: benchmark.cohortSize, pooledVersions: benchmark.pooledVersions,
    retakeCount: benchmark.retakeCount, statements: benchmark.availability };
}
