import assert from 'node:assert/strict';
import submit from '../api/research-submit.js';
import save from '../api/research-save-progress.js';
import results from '../api/research-results-email.js';
const v3='phase3-v3-2026-09-08',v4='phase3-v4-2026-09-13-paired';
const oldFetch=global.fetch,oldEnv={...process.env};
process.env.AIRTABLE_RESEARCH_TOKEN='synthetic';process.env.RESEND_API_KEY='synthetic';process.env.RESEND_FROM='test@example.com';
const pairResponses=Object.fromEntries(Array.from({length:12},(_,i)=>['d'+(i+1),{contribution:4,conditions:2,contribution_context:'Synthetic note'}]));
const response=()=>({_status:200,status(s){this._status=s;return this;},setHeader(){},json(b){this.body=b;return this;}});
async function request(handler,version,existingVersion,legacy=false,rationaleVersion,existingRationale){
const calls=[];global.fetch=async(url,options={})=>{calls.push({url:String(url),options});let records=[];if(!options.method){if(String(url).includes('tblwpricYYzx4rmiR'))records=[{id:'identity',fields:{fldEhm06lLDvEeF6q:'Sent'}}];else if(existingVersion!==undefined)records=[{id:'response',fields:{fldHJ4KNzMbpzdob6:existingVersion,fldW2IulhhJHIdIjV:existingRationale}}];}return {ok:true,json:async()=>({records}),text:async()=>''};};
const res=response();await handler({method:'POST',body:{token:'synthetic',consent:{takingPart:true},pairResponses,...(!legacy?{instrumentVersion:version}:{}),...(rationaleVersion!==undefined?{rationaleVersion}:{})}},res);return {res,writes:calls.filter(c=>c.options.method),calls};}
try {
for(const handler of [save,submit]){
let r=await request(handler,v4,undefined);assert.equal(r.res._status,200);const write=r.writes.find(c=>c.url.includes('tblL9mf8VfAmbhuG7'));const body=JSON.parse(write.options.body);assert.equal((body.fields||body.records[0].fields).fldHJ4KNzMbpzdob6,v4);
assert.equal((body.fields||body.records[0].fields).fldW2IulhhJHIdIjV,'phase3-rationale-v1.0-2026-08-28');
r=await request(handler,v4,v4,false,'unreleased-rationale');assert.equal(r.res._status,400);assert.equal(r.writes.length,0);
r=await request(handler,v4,v4,false,undefined,'different-saved-rationale');assert.equal(r.res._status,409);assert.equal(r.writes.length,0);
r=await request(handler,v4,v4,false,'phase3-rationale-v1.0-2026-08-28','phase3-rationale-v1.0-2026-08-28');assert.equal(r.res._status,200);
r=await request(handler,v4,v3);assert.equal(r.res._status,409);assert.equal(r.writes.length,0);
r=await request(handler,v4,null);assert.equal(r.res._status,409);assert.equal(r.writes.length,0);
r=await request(handler,'unsupported',undefined);assert.equal(r.res._status,400);assert.equal(r.calls.length,0);
r=await request(handler,null,v3,true);assert.equal(r.res._status,200);
r=await request(handler,null,v4,true);assert.equal(r.res._status,409);assert.equal(r.writes.length,0);
}
let sends=[],auditPatches=[],version=v3,cohortCalls=0,compatibleCount=15;
global.fetch=async(url,options={})=>{
const u=String(url);if(u.includes('api.resend.com')){sends.push(JSON.parse(options.body));return {ok:true,json:async()=>({})};}
if(options.method){auditPatches.push(JSON.parse(options.body));return {ok:true,json:async()=>({})};}
if(u.includes('tblwpricYYzx4rmiR'))return {ok:true,json:async()=>({records:[{id:'identity',fields:{fldEhm06lLDvEeF6q:'Completed',fldePJtCCYwLsmNjp:'synthetic@example.com'}}]})};
if(u.includes('filterByFormula'))return {ok:true,json:async()=>({records:[{id:'response',fields:{fldHJ4KNzMbpzdob6:version,fldvxb2mrIYVKLGVM:JSON.stringify(pairResponses)}}]})};
cohortCalls++;assert(u.includes('fldHJ4KNzMbpzdob6'));
let recordSerial=0;
const make=(v,n)=>({fields:{flduL4PmBEfH9rLpz:`synthetic-cohort-${++recordSerial}`,fldHJ4KNzMbpzdob6:v,fld8sYjswX21vvVXz:'2026-09-13',fldc1EMbDAHAO99Av:true,fldvxb2mrIYVKLGVM:JSON.stringify({d1:{contribution:n,conditions:n}})}});
const incomplete=make(v4,1);delete incomplete.fields.fld8sYjswX21vvVXz;
const ineligible=make(v4,1);ineligible.fields.fldc1EMbDAHAO99Av=false;
const corrupt=make(v4,1);corrupt.fields.fldvxb2mrIYVKLGVM='{';
return {ok:true,json:async()=>({records:Array.from({length:15},()=>make(v3,2)).concat(Array.from({length:compatibleCount},()=>make(v4,5)),Array.from({length:15},()=>incomplete),Array.from({length:15},()=>ineligible),[corrupt,make(null,1)])})};
};
let res=response();await results({method:'POST',body:{token:'synthetic'}},res);assert.equal(res._status,200);assert(sends[0].html.includes('Current study benchmark 2.0 / 5'));assert(!sends[0].html.includes('Current study benchmark 5.0 / 5'));
version=v4;res=response();await results({method:'POST',body:{token:'synthetic2'}},res);assert.equal(res._status,200);assert.equal(sends.length,2);assert.equal(cohortCalls,2);assert(sends[1].html.includes('Benchmark: 5.0 / 5'));assert(!sends[1].html.includes('Current study benchmark 2.0 / 5'));assert(sends[1].html.includes(v4));assert(sends[1].html.includes('I can decide when to use AI in my work.'));assert(!sends[1].html.includes("I'm comfortable explaining how I use AI at work."));
compatibleCount=14;res=response();await results({method:'POST',body:{token:'synthetic-own'}},res);assert.equal(res._status,200);assert.equal(sends.length,3);assert(sends[2].html.includes('own answers only'));assert(!sends[2].html.includes('Benchmark: 5.0'));assert(!sends[2].html.includes('Current study benchmark 2.0'));
assert.equal(auditPatches.length,3);for(const patch of auditPatches){const provenance=JSON.parse(patch.fields.fldmEbpMqwAWUWv7l);assert.equal(provenance.policyId,'statement-benchmark-v1-2026-09-14');assert.equal(provenance.minimumObservations,15);assert(provenance.computedAt);}
version='unknown';res=response();await results({method:'POST',body:{token:'synthetic3'}},res);assert.equal(res._status,409);assert.equal(sends.length,3);assert.equal(cohortCalls,3);
console.log('PASS: version stamping; mismatch/unknown rejects before writes; legacy clients preserved; both versions render their wording and isolate same-version benchmarks; unknown results withheld');
}finally{global.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in oldEnv))delete process.env[k];Object.assign(process.env,oldEnv);}
