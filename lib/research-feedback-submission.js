import { createHash } from 'node:crypto';
const BASE='app7dKDinTjxczEfD',TABLE='tblgNzJHlurSlPGL9';
const F={id:'fldODy3mOhqL995KL',text:'fldGDnpHWaR3K8liK',channel:'fldA2YfDmo2PeMf4S',stage:'fldCMmg1EGpixD2PH',version:'fldnyOtEivKnWxC2Z',received:'fld6h68jiX8nQFyFQ'};
export function prepareSubmission(data,now=Date.now()){
 if(!data||typeof data.submissionId!=='string'||!/^[a-f0-9-]{36}$/i.test(data.submissionId))throw Error('Invalid submission ID');
 if(typeof data.feedback!=='string'||!data.feedback.trim()||data.feedback.length>5000)throw Error('Enter feedback of up to 5000 characters');
 if(typeof data.stage!=='string'||!/^screen-[a-z-]{1,60}$/.test(data.stage))throw Error('Invalid feedback stage');
 if(data.instrumentVersion!=='phase3-v4-2026-09-13-paired')throw Error('Unsupported questionnaire version');
 if(!Array.isArray(data.statementIndices)||data.statementIndices.length>2||data.statementIndices.some(i=>!Number.isInteger(i)||i<0||i>=24))throw Error('Invalid statement context');
 const received=Date.parse(data.submittedAt);if(!Number.isFinite(received)||received>now+300000||received<now-86400000)throw Error('Please refresh the submission time and retry');
 const canonical={submissionId:data.submissionId,feedback:data.feedback,stage:data.stage,statementIndices:[...new Set(data.statementIndices)].sort((a,b)=>a-b),instrumentVersion:data.instrumentVersion,submittedAt:new Date(received).toISOString()};
 const id='SUB-'+createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0,32).toUpperCase();
 return{id,fields:{[F.id]:id,[F.text]:canonical.feedback,[F.channel]:'Web',[F.stage]:canonical.stage+(canonical.statementIndices.length?' | statements '+canonical.statementIndices.join(','):''),[F.version]:canonical.instrumentVersion,[F.received]:canonical.submittedAt}};
}
export default async function saveSubmission(req,res,data){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(process.env.RESEARCH_FEEDBACK_CAPTURE_ENABLED!=='true'&&process.env.VERCEL_ENV!=='production'&&!(process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_GIT_COMMIT_REF==='codex/feedback-capture-preview'))return res.status(503).json({error:'Feedback capture is not enabled yet'});
 const origin=req.headers?.origin,host=req.headers?.host;if(origin&&host){try{if(new URL(origin).host!==host)return res.status(403).json({error:'Invalid request origin'})}catch{return res.status(403).json({error:'Invalid request origin'})}}
 let prepared;try{prepared=prepareSubmission(data)}catch(e){return res.status(400).json({error:e.message})}
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
 }catch{console.error('research-feedback-save-failed',JSON.stringify({stage,upstreamStatus}));return res.status(502).json({error:'Could not save feedback. Your draft is still here; please retry.'})}
}
