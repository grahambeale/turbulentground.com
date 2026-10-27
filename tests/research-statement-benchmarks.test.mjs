import assert from 'node:assert/strict';
import { computeStatementBenchmark, benchmarkProvenance, CROSS_VERSION_GROUPS } from '../api/_research-benchmarks.js';
import { buildEmailHtml } from '../api/research-results-email.js';

const v3='phase3-v3-2026-09-08',v4='phase3-v4-2026-09-13-paired',v5='phase3-v5-2026-09-25-examples';
const fields=(token,version=v4,pairs={d1:{contribution:4,conditions:2}})=>({
  flduL4PmBEfH9rLpz:token,fldHJ4KNzMbpzdob6:version,fld8sYjswX21vvVXz:'2026-09-14',
  fldc1EMbDAHAO99Av:true,fldvxb2mrIYVKLGVM:JSON.stringify(pairs)});
const make=(n,v=v4)=>Array.from({length:n},(_,i)=>({fields:fields(`${v}-${i}`,v)}));
let b=computeStatementBenchmark(make(14),v4);assert.equal(b.domains.d1.contribution,null);assert.equal(b.availability.d1.contribution.n,14);
b=computeStatementBenchmark(make(15),v4,'2026-09-14T12:00:00Z');assert.equal(b.domains.d1.contribution.mean,4);assert.equal(b.domains.d1.contribution.n,15);
const fourteen=make(14),skip={fields:fields('skip',v4,{d1:{contribution:'skip',conditions:2}})};
b=computeStatementBenchmark([...fourteen,skip],v4);assert.equal(b.domains.d1.contribution,null);assert.equal(b.domains.d1.conditions.n,15);
// Rendering above the 30-completion participant gate; the gate itself is covered in research-versioned-results.
const html=buildEmailHtml('',{d1:{contribution:3,conditions:4}},{...b,cohortSize:30},'synthetic-preview',v4);
assert(html.includes('Benchmark: 2.0 / 5'));assert(html.includes('We do not have a benchmark for this score yet.'));assert(!html.includes('Above benchmark'));assert(!html.includes('benchmarkMean'));
for(const value of ['not_applicable',0,6,3.5,'4',null]){
  b=computeStatementBenchmark([...fourteen,{fields:fields('invalid',v4,{d1:{contribution:value}})}],v4);
  assert.equal(b.domains.d1.contribution,null);
}
const invalid=make(4);delete invalid[0].fields.fld8sYjswX21vvVXz;invalid[1].fields.fldc1EMbDAHAO99Av=false;invalid[2].fields.fldvxb2mrIYVKLGVM='{';delete invalid[3].fields.flduL4PmBEfH9rLpz;
b=computeStatementBenchmark([...fourteen,...invalid,...make(15,v3),{fields:fields('unknown','future')}],v4);assert.equal(b.domains.d1.contribution,null);
const fifteen=make(15);b=computeStatementBenchmark([...fifteen,fifteen[0]],v4);assert.equal(b.availability.d1.contribution.n,14);
b=computeStatementBenchmark([...fifteen,{fields:fields(fifteen[0].fields.flduL4PmBEfH9rLpz,v3)}],v4);assert.equal(b.availability.d1.contribution.n,14);
assert.deepEqual(CROSS_VERSION_GROUPS.map(g=>[...g]),[[v4,v5]]);
// V4 and V5 pool for either target; V3 never does; versions lists what is actually present.
b=computeStatementBenchmark([...make(8,v4),...make(7,v5),...make(15,v3)],v5);assert.equal(b.cohortSize,15);assert.equal(b.domains.d1.contribution.n,15);
assert.deepEqual(b.domains.d1.contribution.versions,[v4,v5]);assert.deepEqual(b.versionsPresent,[v4,v5]);assert.deepEqual(b.pooledVersions,[v4,v5]);
assert.equal(computeStatementBenchmark([...make(8,v4),...make(7,v5)],v4).cohortSize,15);
b=computeStatementBenchmark(make(15,v5),v5);assert.deepEqual(b.domains.d1.contribution.versions,[v5]);
b=computeStatementBenchmark([...make(15,v3),...make(15,v4)],v3);assert.equal(b.cohortSize,15);assert.deepEqual(b.pooledVersions,[v3]);
// A token answered on both V4 and V5 is an ambiguous duplicate inside the pool and is excluded, as within one version.
const pooled=make(15,v4);b=computeStatementBenchmark([...pooled,{fields:fields(pooled[0].fields.flduL4PmBEfH9rLpz,v5)}],v5);assert.equal(b.cohortSize,14);
// Exclusion list and orphan guard (decision log 2026-10-27, D2), both applied before dedupe.
const withIds=make(16).map((r,i)=>({id:`recSynthetic${String(i).padStart(5,'0')}`,...r}));
b=computeStatementBenchmark(withIds,v4,{excludedRecordIds:new Set([withIds[0].id])});assert.equal(b.cohortSize,15);assert.equal(b.excludedByList,1);assert.equal(b.excludedOrphans,0);
const listed=withIds.slice(1).map(r=>r.fields.flduL4PmBEfH9rLpz);
b=computeStatementBenchmark(withIds,v4,{allowedTokens:new Set(listed)});assert.equal(b.cohortSize,15);assert.equal(b.excludedOrphans,1);assert.equal(b.excludedByList,0);
const dupe={id:'recSyntheticDupe1',fields:fields(withIds[1].fields.flduL4PmBEfH9rLpz)};
b=computeStatementBenchmark([...withIds,dupe],v4,{excludedRecordIds:new Set([dupe.id])});assert.equal(b.cohortSize,16,'an excluded record must not knock out its token as a duplicate');
b=computeStatementBenchmark(withIds,v4);assert.equal(b.cohortSize,16);assert.equal(b.excludedByList,0);assert.equal(b.excludedOrphans,0);
assert.deepEqual(computeStatementBenchmark(withIds,v4,{computedAt:'2026-10-27T00:00:00Z'}).domains,computeStatementBenchmark(withIds,v4,'2026-10-27T00:00:00Z').domains);
// Retakes count in the cohort once and are reported for disclosure.
b=computeStatementBenchmark(withIds,v4,{retakeTokens:new Set([withIds[2].fields.flduL4PmBEfH9rLpz,'not-a-completion'])});assert.equal(b.cohortSize,16);assert.equal(b.retakeCount,1);
assert.equal(b.announced,false);assert.equal(b.announceGate,30);assert.equal(computeStatementBenchmark(make(30),v4).announced,true);
assert.throws(()=>computeStatementBenchmark([], 'future'));
b=computeStatementBenchmark(make(15),v4,'2026-09-14T12:00:00Z');const provenance=benchmarkProvenance(b);
assert.equal(provenance.computedAt,'2026-09-14T12:00:00Z');assert.equal(provenance.policyId,'statement-benchmark-v2-2026-10-27');assert.equal(provenance.cohortSize,15);assert.equal(provenance.announceGate,30);assert.equal(provenance.retakeCount,0);assert.equal(provenance.minimumObservations,15);assert.deepEqual(provenance.statements.d1.contribution.versions,[v4]);assert(!JSON.stringify(provenance).includes('synthetic-preview'));
console.log('PASS: V4 and V5 pooled (V3 isolated), exclusion list and orphan guard before dedupe, retake count, participant gate flag, statement floor, partial availability, skips and invalid values, completed-only, duplicate exclusion, unknown versions, changed/context-uncertain version isolation, provenance and results rendering');
