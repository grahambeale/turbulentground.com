// Called by verified ingestion after durable capture. No sends during previews.
export async function sendFeedbackReceipt({email,submissionId},fetchImpl=fetch){
 if(process.env.RESEARCH_FEEDBACK_RECEIPTS_ENABLED!=='true')return{sent:false,disabled:true};
 if(typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>320||!/^SUB-[A-F0-9]{32}$/.test(submissionId))throw Error('Invalid receipt request');
 if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM)throw Error('Receipt delivery unavailable');
 const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`research-feedback-receipt-${submissionId}`},body:JSON.stringify({from:process.env.RESEND_FROM,to:[email],reply_to:'feedback@turbulentground.com',subject:'Thank you for your research feedback',text:'Thank you for taking the time to share your feedback. I have received it and will use it to help improve the research experience and questions.\n\nThis is a receipt, rather than a promise that a particular change will be made.\n\nGraham'})});
 if(!response.ok)throw Error('Receipt delivery failed');const result=await response.json();if(!result.id)throw Error('Receipt delivery unverified');return{sent:true,providerId:result.id};
}
