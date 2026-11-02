// Get key page: shows the free trial key with a Copy button. No account.
(function () {
  const TRIAL_KEY = 'studenti su pobedili';
  const btn = document.getElementById('copy');
  const code = document.getElementById('trial-key');

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(TRIAL_KEY);
      btn.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  });
})();
