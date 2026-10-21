// Runs in the HTML before the application bundle, so a failed bundle can report
// its own loading state. Keep this independent of React and third-party scripts.
export const bootStatusScript = `(() => {
  const notice = document.getElementById('paddock-boot-status');
  const retry = document.getElementById('paddock-boot-retry');
  if (!notice || !retry) return;
  let ready = false;
  let timer;
  const show = (reason) => {
    if (ready) return;
    notice.hidden = false;
    notice.dataset.reason = reason;
  };
  const failed = (event) => {
    const target = event.target;
    if (target && target.tagName === 'SCRIPT' && target.src &&
        target.src.startsWith(location.origin + '/_next/static/')) show('script-download');
  };
  window.addEventListener('error', failed, true);
  window.addEventListener('paddock:ready', () => {
    ready = true;
    clearTimeout(timer);
    notice.hidden = true;
    delete notice.dataset.reason;
    window.removeEventListener('error', failed, true);
  }, {once: true});
  retry.addEventListener('click', () => location.reload());
  timer = setTimeout(() => show('slow-start'), 12000);
})();`;
