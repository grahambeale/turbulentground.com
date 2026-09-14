import assert from 'node:assert/strict';
import { computeStatementBenchmark, benchmarkProvenance, CROSS_VERSION_GROUPS } from '../api/_research-benchmarks.js';
import { buildEmailHtml } from '../api/research-results-email.js';

const v3='phase3-v3-2026-09-08',v4='phase3-v4-2026-09-13-paired';
const fields=(token,version=v4,pairs={d1:{contribution:4,conditions:2}})=>({
  flduL4PmBEfH9rLpz:token,fldHJ4KNzMbpzdob6:version,fld8sYjswX21vvVXz:'2026-09-14',
  fldc1EMbDAHAO99Av:true,fldvxb2mrIYVKLGVM:JSON.stringify(pairs)});
const make=(n,v=v4)=>Array.from({length:n},(_,i)=>({fields:fields(`${v}-${i}`,v)}));
let b=computeStatementBenchmark(make(14),v4);assert.equal(b.domains.d1.contribution,null);assert.equal(b.availability.d1.contribution.n,14);
b=computeStatementBenchmark(make(15),v4,'2026-09-14T12:00:00Z');assert.equal(b.domains.d1.contribution.mean,4);assert.equal(b.domains.d1.contribution.n,15);
const fourteen=make(14),skip={fields:fields('skip',v4,{d1:{contribution:'skip',conditions:2}})};
b=computeStatementBenchmark([...fourteen,skip],v4);assert.equal(b.domains.d1.contribution,null);assert.equal(b.domains.d1.conditions.n,15);
const html=buildEmailHtml('',{d1:{contribution:3,conditions:4}},b,'synthetic-preview',v4);
assert(html.includes('Benchmark: 2.0 / 5'));assert(html.includes('We do not have a benchmark for this score yet.'));assert(!html.includes('Above benchmark'));assert(!html.includes('benchmarkMean'));
for(const value of ['not_applicable',0,6,3.5,'4',null]){
  b=computeStatementBenchmark([...fourteen,{fields:fields('invalid',v4,{d1:{contribution:value}})}],v4);
  assert.equal(b.domains.d1.contribution,null);
}
const invalid=make(4);delete invalid[0].fields.fld8sYjswX21vvVXz;invalid[1].fields.fldc1EMbDAHAO99Av=false;invalid[2].fields.fldvxb2mrIYVKLGVM='{';delete invalid[3].fields.flduL4PmBEfH9rLpz;
b=computeStatementBenchmark([...fourteen,...invalid,...make(15,v3),{fields:fields('unknown','future')}],v4);assert.equal(b.domains.d1.contribution,null);
const fifteen=make(15);b=computeStatementBenchmark([...fifteen,fifteen[0]],v4);assert.equal(b.availability.d1.contribution.n,14);
b=computeStatementBenchmark([...fifteen,{fields:fields(fifteen[0].fields.flduL4PmBEfH9rLpz,v3)}],v4);assert.equal(b.availability.d1.contribution.n,14);
assert.deepEqual(CROSS_VERSION_GROUPS,[]);assert.throws(()=>computeStatementBenchmark([], 'future'));
b=computeStatementBenchmark(make(15),v4,'2026-09-14T12:00:00Z');const provenance=benchmarkProvenance(b);
assert.equal(provenance.computedAt,'2026-09-14T12:00:00Z');assert.equal(provenance.minimumObservations,15);assert.deepEqual(provenance.statements.d1.contribution.versions,[v4]);assert(!JSON.stringify(provenance).includes('synthetic-preview'));
console.log('PASS: statement floor, partial availability, skips and invalid values, completed-only, duplicate exclusion, unknown versions, changed/context-uncertain version isolation, provenance and results rendering');
