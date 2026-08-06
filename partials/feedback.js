<script>
(function(){
  var wrap = document.getElementById('feedback-tab-wrap');
  var closeBtn = document.getElementById('feedback-tab-close');
  if (!wrap || !closeBtn) return;
  try {
    if (localStorage.getItem('tg-feedback-dismissed') === '1') {
      wrap.classList.add('dismissed');
      return;
    }
  } catch (e) {}
  closeBtn.addEventListener('click', function(){
    wrap.classList.add('dismissed');
    try { localStorage.setItem('tg-feedback-dismissed', '1'); } catch (e) {}
  });
})();
</script>
