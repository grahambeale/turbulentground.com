import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const sha=value=>createHash('sha256').update(value).digest('hex');
const types=new Set(['Bug','Usability','Copy','Research method','Privacy','Accessibility','Feature idea','Positive feedback','Other']);
export function validateExtraction(source, extraction){
 if(!source||typeof source.id!=='string'||!source.id||typeof source.text!=='string'||!source.text.trim())throw Error('Invalid source');
 if(!extraction||extraction.sourceId!==source.id||extraction.sourceSha256!==sha(source.text)||!Array.isArray(extraction.issues))throw Error('Source mismatch');
 if(extraction.issues.length>20)throw Error('Excessive splitting requires human review');
 if(extraction.issues.length===0&&extraction.disposition!=='Needs review')throw Error('Do not silently discard sources');
 const keys=new Set();
 return extraction.issues.map(issue=>{
  if(typeof issue.key!=='string'||!/^[a-z0-9-]{1,80}$/.test(issue.key)||keys.has(issue.key))throw Error('Invalid or duplicate issue key');keys.add(issue.key);
  if(!types.has(issue.type)||typeof issue.summary!=='string'||!issue.summary.trim()||typeof issue.interpretation!=='string'||typeof issue.uncertainty!=='string')throw Error('Missing assessment');
  if(!Array.isArray(issue.excerpts)||!issue.excerpts.length||issue.excerpts.some(e=>typeof e!=='string'||!e.trim()||!source.text.includes(e)))throw Error('Excerpt must be verbatim source text');
  if(issue.decision||issue.releaseDecision||issue.status||issue.toolInstruction)throw Error('Extraction cannot grant authority');
  const date=source.receivedAt?.slice(0,10).replaceAll('-','');if(!/^\d{8}$/.test(date||''))throw Error('Invalid source date');
  const identity=sha(source.id+'\0'+issue.key).slice(0,16).toUpperCase();
  return{feedbackId:`FB-${date}-${identity}`,sourceId:source.id,issueKey:issue.key,sourceDetail:`source:${source.id}; issue:${issue.key}`,originalFeedback:issue.excerpts.join('\n\n'),type:issue.type,assessment:`${issue.summary}\n\nInterpretation: ${issue.interpretation}\n\nUncertainty: ${issue.uncertainty}`,grahamDecision:'Pending',releaseDecision:'Pending',status:'New'};
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const input=JSON.parse(readFileSync(process.argv[2],'utf8'));process.stdout.write(JSON.stringify(validateExtraction(input.source,input.extraction),null,2)+'\n');
}
