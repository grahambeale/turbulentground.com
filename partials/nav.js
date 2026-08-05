<script>
(function(){
  var nav=document.getElementById('main-nav');
  window.addEventListener('scroll',function(){
    nav.classList.toggle('scrolled',window.scrollY>50);
  });
  var toggle=document.getElementById('nav-toggle');
  var menu=document.getElementById('mobile-menu');
  function setMenu(open){
    toggle.classList.toggle('open',open);
    menu.classList.toggle('open',open);
    toggle.setAttribute('aria-expanded',open?'true':'false');
    document.body.style.overflow=open?'hidden':'';
  }
  toggle.addEventListener('click',function(){
    setMenu(!menu.classList.contains('open'));
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',function(){ setMenu(false); });
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') setMenu(false);
  });
  function normalize(p){
    p=p.replace(/\/index\.html$/,'/').replace(/\.html$/,'').replace(/\/+$/,'');
    return p===''?'/':p;
  }
  var current=normalize(window.location.pathname);
  document.querySelectorAll('.nav-link, .mobile-menu a:not(.mobile-menu-btn)').forEach(function(a){
    var href=normalize(a.getAttribute('href'));
    if(href===current) a.classList.add('active');
  });
  document.querySelectorAll('a[href$="/diagnostic"], a[href$="diagnostic/index.html"]').forEach(function(a){
    if(a.closest('footer')) return;
    a.addEventListener('click',function(){
      if(typeof plausible==='function') plausible('Diagnostic CTA Clicked');
    });
  });
})();
</script>
