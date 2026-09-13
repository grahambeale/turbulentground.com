import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {INSTRUMENTS,LEGACY_VERSION,PAIRED_VERSION} from '../api/_research-instruments.js';
import {buildEmailHtml} from '../api/research-results-email.js';
for(const [version,file] of [[LEGACY_VERSION,'legacy-v3.html'],[PAIRED_VERSION,'index.html']]){
 const html=fs.readFileSync(new URL('../research/'+file,import.meta.url),'utf8');
 const start=html.indexOf('var DOMAINS = ')+14,end=html.indexOf(';',start);
 const actual=JSON.parse(JSON.stringify(vm.runInNewContext('('+html.slice(start,end)+')')));
 assert.deepEqual(INSTRUMENTS[version],actual.map(d=>({key:d.key,name:d.name,statements:[d.s1,d.s2].map(s=>({text:s.text,field:s.field}))})));
}
const pairs=Object.fromEntries(INSTRUMENTS[PAIRED_VERSION].map(d=>[d.key,{contribution:4,conditions:2}]));
pairs.d1.conditions='not_applicable';pairs.d2.contribution='skip';delete pairs.d12.conditions;
const bench={cohortSize:15,domains:Object.fromEntries(Object.keys(pairs).map(k=>[k,{contribution:{mean:3.1,n:15},conditions:{mean:2.2,n:14}}]))};
const html=buildEmailHtml('<Synthetic>',pairs,bench,'fictional',PAIRED_VERSION);
for(const d of INSTRUMENTS[PAIRED_VERSION])for(const s of d.statements)assert(html.includes(s.text));
assert(html.includes('&lt;Synthetic&gt;'));assert(!html.includes('<Synthetic>'));
assert(html.includes('Current study benchmark 3.1 / 5'));assert(!html.includes('Current study benchmark 2.2 / 5'));
assert(html.includes('Your answer: Not applicable'));assert(html.includes('Your answer: Prefer not to say'));assert(html.includes('Your answer: Not answered'));
assert(!html.includes('Your contribution</'));assert(!html.includes('Conditions around you</'));assert(!html.includes('Highest-rated personal-practice'));
assert(!html.includes('n=15'));assert(!html.includes('n=14'));
assert(html.indexOf('When AI saves me time, I use that time to improve my work.')<html.indexOf('When AI saves me time, I keep some of that time free from work.'));
assert(html.includes('Your answer: 2 / 5'));assert(html.includes('Your answer: 4 / 5'));
const own=buildEmailHtml('',pairs,{cohortSize:14,domains:bench.domains},'fictional',PAIRED_VERSION);assert(!own.includes('Current study benchmark 3.1'));assert(own.includes('own answers only'));
const old=buildEmailHtml('',pairs,{cohortSize:0,domains:null},'fictional',LEGACY_VERSION);
assert(old.includes("My organisation trusts me to decide when to rely on AI output."));assert(!old.includes('I can decide when to use AI in my work.'));
assert.throws(()=>buildEmailHtml('',pairs,bench,'fictional','unknown'));
console.log('PASS: exact frozen version wording and storage mapping, v4 statement-specific interpretation, per-item benchmark floor, safe own-answer fallback, distinct missingness and escaped names');
