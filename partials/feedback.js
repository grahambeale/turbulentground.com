<script>
/* Main-site feedback widget, adopted from the Phase 3 research widget.
   Saves to the shared feedback table via /api/research-invite
   (action: site-feedback-submission). Failures are shown to the visitor
   and the draft is kept; nothing fails silently. */
(function(){
  var launch=document.getElementById('feedback-launch'),panel=document.getElementById('feedback-panel');
  if(!launch||!panel||typeof panel.showModal!=='function')return;
  var message=document.getElementById('feedback-message'),receipt=document.getElementById('feedback-receipt'),
      compose=document.getElementById('feedback-compose'),success=document.getElementById('feedback-success'),
      send=document.getElementById('feedback-send'),error=document.getElementById('feedback-error');
  var reduced=function(){return matchMedia('(prefers-reduced-motion: reduce)').matches;};
  var submissionId=null,submittedAt=null,openedY=0,timer=null,confirmed=false,busy=false;
  function uuid(){ if(window.crypto&&crypto.randomUUID)return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);}); }
  function page(){ var p=location.pathname.replace(/\/+$/,'')||'/'; return p.replace(/[^A-Za-z0-9\-._/]/g,'').slice(0,160)||'/'; }
  launch.addEventListener('click',function(){
    clearTimeout(timer);openedY=scrollY;confirmed=false;busy=false;compose.hidden=false;success.hidden=true;
    panel.setAttribute('aria-labelledby','feedback-title');send.disabled=false;error.textContent='';
    submissionId=submissionId||uuid();
    panel.showModal();launch.classList.add('away');
    if(!reduced()&&panel.animate)panel.animate([{opacity:0,transform:'translateY(16px) scale(.96)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
    message.focus();
    try{ if(typeof plausible==='function')plausible('Site Feedback Opened',{props:{page:page()}}); }catch(e){}
  });
  function close(){clearTimeout(timer);panel.close();}
  document.getElementById('feedback-close').addEventListener('click',close);
  document.getElementById('feedback-done').addEventListener('click',close);
  panel.addEventListener('close',function(){clearTimeout(timer);launch.classList.remove('away');if(confirmed){message.value='';submissionId=null;submittedAt=null;}busy=false;launch.focus({preventScroll:true});window.scrollTo(0,openedY);});
  message.addEventListener('input',function(){message.setCustomValidity('');});
  document.getElementById('feedback-form').addEventListener('submit',function(e){
    e.preventDefault();if(busy)return;
    if(!message.value.trim()){message.setCustomValidity('Please enter your feedback.');message.reportValidity();return;}
    busy=true;send.disabled=true;error.textContent='';
    submittedAt=submittedAt||new Date().toISOString();
    fetch('/api/research-invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'site-feedback-submission',submissionId:submissionId,feedback:message.value,page:page(),submittedAt:submittedAt})})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||j.saved!==true)throw new Error(j.error||'Could not save your feedback. Please retry.');});})
      .then(function(){
        confirmed=true;compose.hidden=true;success.hidden=false;panel.setAttribute('aria-labelledby','feedback-success-title');
        receipt.textContent='Your feedback has been received.';document.getElementById('feedback-success-title').focus();
        try{ if(typeof plausible==='function')plausible('Site Feedback Sent',{props:{page:page()}}); }catch(e){}
        timer=setTimeout(close,1800);
      })
      .catch(function(err){error.textContent=err.message;busy=false;send.disabled=false;});
  });
})();
</script>
