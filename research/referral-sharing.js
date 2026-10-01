(function(){
  'use strict';
  document.addEventListener('tg:research-submitted',function(event){
    var privateToken=event.detail&&event.detail.token;
    if(!privateToken)return;
    fetch('/api/research-referral-issue').then(function(response){return response.ok?response.json():{enabled:false}}).then(function(config){
      if(!config.enabled)return null;
      return fetch('/api/research-referral-issue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:privateToken})});
    }).then(function(response){if(!response)return null;if(!response.ok)throw new Error('unavailable');return response.json()}).then(function(result){
      if(result&&result.sharePath)initialise(new URL(result.sharePath,window.location.origin).toString());
    }).catch(function(){/* Optional sharing must never disturb completion. */});
  });
  function initialise(link){
    var section=document.getElementById('referral-sharing'),publicPanel=document.getElementById('referral-public-panel'),privatePanel=document.getElementById('referral-private-panel');
    var publicMessage=document.getElementById('referral-public-message'),privateMessage=document.getElementById('referral-private-message'),recipientName=document.getElementById('referral-recipient-name'),recipientEmail=document.getElementById('referral-recipient-email'),recipientPreview=document.getElementById('referral-recipient-preview');
    var publicStatus=document.getElementById('referral-public-status'),privateStatus=document.getElementById('referral-private-status');
    document.getElementById('referral-link-value').textContent=link;section.hidden=false;
    var privateBody=privateMessage.value.trim();
    function publicText(){return publicMessage.value.trim()+'\n\n'+link}
    function privateText(){return privateMessage.value.trim()+'\n\n'+link}
    function updateRecipientPreview(){var name=recipientName.value.trim(),email=recipientEmail.value.trim();privateMessage.value=(name?'Hi '+name+',\n\n':'')+privateBody;recipientPreview.textContent=(name||email)?'Previewing invitation for '+(name||'this person')+(email?' · '+email:''):''}
    function status(el,message){el.textContent=message;window.setTimeout(function(){if(el.textContent===message)el.textContent=''},4000)}
    function copy(text,el,message){if(!navigator.clipboard||!navigator.clipboard.writeText){status(el,'Copy is unavailable here. Select the text and copy it manually.');return}navigator.clipboard.writeText(text).then(function(){status(el,message)}).catch(function(){status(el,'Copy is unavailable here. Select the text and copy it manually.')})}
    document.querySelectorAll('input[name="referral-mode"]').forEach(function(input){input.addEventListener('change',function(){var isPrivate=input.value==='private'&&input.checked;privatePanel.hidden=!isPrivate;publicPanel.hidden=isPrivate})});
    document.getElementById('referral-copy-link').addEventListener('click',function(){copy(link,publicStatus,'Personal link copied.')});
    document.getElementById('referral-copy-public').addEventListener('click',function(){copy(publicText(),publicStatus,'Message and link copied.')});
    document.getElementById('referral-copy-private').addEventListener('click',function(){copy(privateText(),privateStatus,'Private message copied.')});
    document.getElementById('referral-native-share').addEventListener('click',function(){if(navigator.share)navigator.share({title:'Turbulent Ground research',text:publicMessage.value.trim(),url:link}).catch(function(){});else copy(publicText(),publicStatus,'Sharing options are unavailable, so the message was copied.')});
    document.getElementById('referral-open-email').addEventListener('click',function(){window.location.href='mailto:'+encodeURIComponent(recipientEmail.value.trim())+'?subject='+encodeURIComponent('An independent study about AI and work')+'&body='+encodeURIComponent(privateText())});
    recipientName.addEventListener('input',updateRecipientPreview);
    recipientEmail.addEventListener('input',updateRecipientPreview);
    privateMessage.addEventListener('input',function(){var name=recipientName.value.trim(),prefix=name?'Hi '+name+',\n\n':'';privateBody=privateMessage.value.slice(prefix.length).trim()});
    document.querySelectorAll('[data-referral-platform]').forEach(function(button){button.addEventListener('click',function(){var isPrivate=!privatePanel.hidden;copy(isPrivate?privateText():publicText(),isPrivate?privateStatus:publicStatus,button.dataset.referralPlatform+' message copied.')})});
  }
  if(window.__TG_COMPLETION_PREVIEW__)initialise('https://www.turbulentground.com/take-part?r=K7M4PX');
}());
