// Sign-in page: validate the key with Lemon Squeezy, then go to the account page.
(function () {
  const form = document.getElementById('form');
  const input = document.getElementById('key');
  const remember = document.getElementById('remember');
  const submit = document.getElementById('submit');
  const alertBox = document.getElementById('alert');

  // Already signed in -> straight to the account page.
  if (loadKey()) { location.replace('account.html'); return; }

  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.classList.remove('hidden');
    input.classList.add('bad');
  }
  function busy(on) {
    submit.disabled = on;
    submit.innerHTML = on ? '<span class="spinner"></span> Checking…' : 'Sign in';
  }

  input.addEventListener('input', () => {
    input.classList.remove('bad');
    alertBox.classList.add('hidden');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = input.value.trim();
    if (key.length < 8) { showError('Paste your full licence key.'); input.focus(); return; }

    busy(true);
    const result = await checkLicence(key);
    busy(false);

    if (!result.ok) { showError(result.message); input.focus(); return; }
    saveKey(key, remember.checked);
    location.href = 'account.html';
  });
})();
