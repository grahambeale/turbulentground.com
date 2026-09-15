import{createHash}from'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function normaliseGmail(message){
 const headers=message.payload?.headers||[],get=name=>headers.filter(h=>h.name?.toLowerCase()===name).map(h=>h.value||'').join(', ');
 const labels=message.label_ids||[];
 if(labels.some(l=>['SENT','DRAFT','SPAM','TRASH'].includes(l)))return{disposition:'Ignore',reason:'Excluded mailbox state'};
 if(!/(?:^|[\s<,;])feedback@turbulentground\.com(?:$|[\s>,;])/i.test(get('to')+' '+get('cc')))return{disposition:'Ignore',reason:'Not addressed to feedback inbox'};
 if(get('auto-submitted')&&!/^no$/i.test(get('auto-submitted').trim()))return{disposition:'Ignore',reason:'Automated message; avoid receipt loops'};
 const texts=[],attachments=[];
 function visit(part){if(!part)return;if(part.filename||part.body?.attachment_id)attachments.push(part.filename||'attachment');if(part.mime_type==='text/plain'&&typeof part.body?.content==='string')texts.push(part.body.content);for(const child of part.parts||[])visit(child)}visit(message.payload);
 const original=texts.join('\n').replace(/\r\n/g,'\n');
 const cutoff=original.search(/^(?:On .+ wrote:|>+|[- ]*Original Message[- ]*|Begin forwarded message:)/m);
 const newText=(cutoff>=0?original.slice(0,cutoff):original).trim();
 const messageId=get('message-id').trim();const epoch=Number(message.internal_date);const receivedAt=Number.isFinite(epoch)&&epoch>0?new Date(epoch).toISOString():null;
 const reasons=[];if(!messageId)reasons.push('Missing Message-ID; duplicate copy handling needs review');if(!receivedAt)reasons.push('Missing received date');if(!newText)reasons.push('No unambiguous new plain-text feedback');if(attachments.length)reasons.push('Attachments require separate review');if(!message.id)reasons.push('Missing Gmail ID');
 return{disposition:reasons.length?'Needs review':'Ready',reasons,source:{id:'EMAIL-'+hash(messageId||('grahams-gmail-account:'+message.id)).slice(0,24).toUpperCase(),gmailMessageId:message.id,providerMessageId:messageId,receivedAt,text:newText,originalText:original,channel:'Email',stage:'Results email reply',attachmentsPresent:attachments.length>0}};
}
