// Main-site feedback capture (adopted from the Phase 3 research widget,
// 29 Sep 2026). Writes to the same Airtable feedback table as research
// feedback so there is one inbox, distinguished by Channel = "Main site"
// and Stage = "site:<path>". Research triage should reroute these rather
// than treat them as research-project work (see research/agent-workflow.md).
// Fails loudly: every failure returns an explicit error and the widget keeps
// the visitor's draft.
import { createHash } from 'node:crypto';
const BASE='app7dKDinTjxczEfD',TABLE='tblgNzJHlurSlPGL9';
const F={id:'fldODy3mOhqL995KL',text:'fldGDnpHWaR3K8liK',channel:'fldA2YfDmo2PeMf4S',stage:'fldCMmg1EGpixD2PH',version:'fldnyOtEivKnWxC2Z',received:'fld6h68jiX8nQFyFQ'};
export const SITE_FEEDBACK_VERSION='main-site-2026-09-29';

export function prepareSiteSubmission(data,now=Date.now()){
 if(!data||typeof data.submissionId!=='string'||!/^[a-f0-9-]{36}$/i.test(data.submissionId))throw Error('Invalid submission ID');
 if(typeof data.feedback!=='string'||!data.feedback.trim()||data.feedback.length>5000)throw Error('Enter feedback of up to 5000 characters');
 if(typeof data.page!=='string'||!/^\/[A-Za-z0-9\-._/]{0,160}$/.test(data.page)||data.page.includes('..'))throw Error('Invalid page');
 if(data.page.startsWith('/research'))throw Error('Use the research feedback button on study pages');
 const received=Date.parse(data.submittedAt);if(!Number.isFinite(received)||received>now+300000||received<now-86400000)throw Error('Please refresh the submission time and retry');
 const canonical={submissionId:data.submissionId,feedback:data.feedback,page:data.page,submittedAt:new Date(received).toISOString()};
 const id='SITE-'+createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0,32).toUpperCase();
 return{id,fields:{[F.id]:id,[F.text]:canonical.feedback,[F.channel]:'Main site',[F.stage]:'site:'+canonical.page,[F.version]:SITE_FEEDBACK_VERSION,[F.received]:canonical.submittedAt}};
}

export default async function saveSiteSubmission(req,res,data){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(process.env.SITE_FEEDBACK_CAPTURE_ENABLED!=='true'&&process.env.VERCEL_ENV!=='production')return res.status(503).json({error:'Feedback capture is not enabled on this deployment'});
 const origin=req.headers?.origin,host=req.headers?.host;if(origin&&host){try{if(new URL(origin).host!==host)return res.status(403).json({error:'Invalid request origin'})}catch{return res.status(403).json({error:'Invalid request origin'})}}
 let prepared;try{prepared=prepareSiteSubmission(data)}catch(e){return res.status(400).json({error:e.message})}
 const token=process.env.AIRTABLE_RESEARCH_TOKEN;if(!token)return res.status(503).json({error:'Feedback capture is unavailable'});
 const endpoint=`https://api.airtable.com/v0/${BASE}/${TABLE}`,headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 let stage='read',upstreamStatus=null;
 try{
  const query=new URLSearchParams({filterByFormula:`{Submission ID}='${prepared.id}'`,maxRecords:'2','fields[]':F.id});
  const existing=await fetch(endpoint+'?'+query,{headers});upstreamStatus=existing.status;if(!existing.ok)throw Error('Read failed');const found=await existing.json();
  if(!Array.isArray(found.records)||found.records.length>1)return res.status(409).json({error:'Feedback needs manual verification; your draft is preserved'});
  if(found.records.length===1)return res.status(200).json({saved:true,submissionId:prepared.id});
  stage='write';upstreamStatus=null;
  const write=await fetch(endpoint,{method:'PATCH',headers,body:JSON.stringify({performUpsert:{fieldsToMergeOn:[F.id]},records:[{fields:prepared.fields}]})});upstreamStatus=write.status;if(!write.ok)throw Error('Write failed');
  const saved=await write.json();if(!saved.records?.some(r=>r.fields?.[F.id]===prepared.id||r.fields?.['Submission ID']===prepared.id))throw Error('Unverified save');
  return res.status(201).json({saved:true,submissionId:prepared.id});
 }catch{console.error('site-feedback-save-failed',JSON.stringify({stage,upstreamStatus}));return res.status(502).json({error:'Could not save feedback. Your draft is still here; please retry.'})}
}
