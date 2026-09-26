import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import referralHandler from '../lib/research-phase31/referral-issue.js';

const html = await readFile(new URL('../research/index.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../research/referral-sharing.js', import.meta.url), 'utf8');
const inviteHandler = await readFile(new URL('../api/research-invite.js', import.meta.url), 'utf8');
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.match(html, /id="referral-sharing"[^>]+hidden/);
assert.match(html, /tg:research-submitted/);
assert.match(script, /fetch\('\/api\/research-referral-issue'\)/);
assert.match(script, /if\(!config\.enabled\)return null/);
assert.match(script, /api\/research-referral-issue/);
assert.match(html, /These details stay in this browser/);
assert.doesNotMatch(script, /localStorage|sessionStorage|indexedDB|sendBeacon/);
assert.match(inviteHandler, /"referral-issue": referralIssue/);
assert.ok(vercel.rewrites.some((rule)=>rule.source==='/api/research-referral-issue'&&rule.destination==='/api/research-invite?phase31=referral-issue'));

function response(){const res={code:0,body:null};res.status=(code)=>{res.code=code;return res};res.json=(body)=>{res.body=body;return res};return res}
delete process.env.RESEARCH_SHARING_UI_ENABLED;
let res=response();await referralHandler({method:'GET'},res);
assert.deepEqual({code:res.code,body:res.body},{code:200,body:{enabled:false}});
process.env.RESEARCH_SHARING_UI_ENABLED='true';
res=response();await referralHandler({method:'GET'},res);
assert.deepEqual({code:res.code,body:res.body},{code:200,body:{enabled:true}});
console.log('Phase 3.1 sharing integration safety checks passed.');
