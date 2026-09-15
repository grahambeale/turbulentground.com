// Preview planner only: never writes to Airtable or deletes provider messages.
export function sixMonthExpiry(receivedAt) {
  const d=new Date(receivedAt);
  if(!Number.isFinite(d.valueOf()))throw Error('Valid received date required');
  const target=d.getUTCMonth()+6,year=d.getUTCFullYear()+Math.floor(target/12),month=target%12;
  const day=Math.min(d.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate());
  return new Date(Date.UTC(year,month,day,d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),d.getUTCMilliseconds())).toISOString();
}

export function planRetention({receivedAt,reviewedSynthesis,providerPolicyConfirmed=false},now=new Date().toISOString()) {
  const expiresAt=sixMonthExpiry(receivedAt),time=Date.parse(now);
  if(!Number.isFinite(time))throw Error('Valid current date required');
  const base={policyId:'feedback-source-retention-preview-v2',expiresAt,executionEnabled:false};
  if(time<Date.parse(expiresAt))return {...base,state:'Not due',actions:[]};
  if(!reviewedSynthesis?.anonymisationConfirmed||!reviewedSynthesis.reviewer||
      !reviewedSynthesis.reviewedAt||!Number.isFinite(Date.parse(reviewedSynthesis.reviewedAt))||
      typeof reviewedSynthesis.problem!=='string'||!reviewedSynthesis.problem.trim())
    return {...base,state:'Needs review',reason:'Review an identifying-detail-free synthesis before expiring original evidence',actions:[]};
  if(!providerPolicyConfirmed)return {...base,state:'Needs provider policy',reason:'Confirm Gmail, iCloud and Airtable history/backup limits before executing retention',actions:[]};
  return {...base,state:'Plan ready for release review',actions:[
    'Remove original source message, contacts and attachments',
    'Remove exact child excerpts and copied source text in assessments, proposals, review notes and checkpoints; preserve human decisions',
    'Apply the agreed Gmail/iCloud/provider-copy policy',
    'Retain only reviewed non-identifying synthesis and safe general stage/version, problem, uncertainty and resolution',
    'Mark original evidence expired; never describe the synthesis as verbatim evidence'
  ],excluded:['Research answers','Unrelated study records']};
}
