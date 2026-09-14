import { INSTRUMENTS } from './_research-instruments.js';

export const BENCHMARK_MIN_COHORT = 15;
export const BENCHMARK_POLICY_ID = 'statement-benchmark-v1-2026-09-14';

// Revision-1 audit: V3/V4 explanatory text and presentation order changed.
// Exact statement text alone is insufficient. No cross-version group enabled.
export const CROSS_VERSION_GROUPS = Object.freeze([]);

export function computeStatementBenchmark(records, targetVersion, computedAt = new Date().toISOString()) {
  if (!Object.hasOwn(INSTRUMENTS, targetVersion)) throw new Error('Unknown questionnaire version');
  const byToken = new Map();
  for (const record of records) {
    const f = record.fields || {};
    if (!f.fld8sYjswX21vvVXz || f.fldc1EMbDAHAO99Av !== true ||
        !Object.hasOwn(INSTRUMENTS, f.fldHJ4KNzMbpzdob6) ||
        typeof f.flduL4PmBEfH9rLpz !== 'string' || !f.flduL4PmBEfH9rLpz.trim()) continue;
    const token = f.flduL4PmBEfH9rLpz.trim();
    const group = byToken.get(token) || [];
    group.push(record); byToken.set(token, group);
  }
  // Ambiguous duplicate completions are excluded rather than choosing scores.
  const unique = [...byToken.values()].filter(g => g.length === 1).map(g => g[0]);
  const eligible = [];
  for (const record of unique) {
    if (record.fields.fldHJ4KNzMbpzdob6 !== targetVersion) continue;
    try {
      const pairs = JSON.parse(record.fields.fldvxb2mrIYVKLGVM || '{}');
      if (pairs && typeof pairs === 'object' && !Array.isArray(pairs)) eligible.push(pairs);
    } catch { /* A malformed response supplies no comparison observations. */ }
  }
  const domains = {}, availability = {};
  for (const domain of INSTRUMENTS[targetVersion]) {
    domains[domain.key] = {}; availability[domain.key] = {};
    for (const statement of domain.statements) {
      const values = eligible.map(p => p[domain.key]?.[statement.field])
        .filter(v => Number.isInteger(v) && v >= 1 && v <= 5);
      const n = values.length;
      const versions = n ? [targetVersion] : [];
      domains[domain.key][statement.field] = n >= BENCHMARK_MIN_COHORT
        ? { mean: values.reduce((a, b) => a + b, 0) / n, n, versions } : null;
      availability[domain.key][statement.field] = { n, versions,
        state: n >= BENCHMARK_MIN_COHORT ? 'available' : 'building' };
    }
  }
  return { cohortSize: eligible.length, domains, availability, policyId: BENCHMARK_POLICY_ID, computedAt };
}

export function benchmarkProvenance(benchmark) {
  return { policyId: benchmark.policyId, computedAt: benchmark.computedAt,
    minimumObservations: BENCHMARK_MIN_COHORT, statements: benchmark.availability };
}
