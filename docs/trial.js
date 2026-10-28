// Free-trial page: local sign-up / sign-in, then "Create key" reveals the trial key.
// Accounts are stored in this browser only (salted SHA-256), so this is a gate, not real security.
(function () {
  const ACCOUNTS = 'cleanai.trial.accounts';
  const SESSION = 'cleanai.trial.session';
  const TRIAL_KEY = 'studenti su pobedili';

  const $ = (id) => document.getElementById(id);
  const stepAuth = $('step-auth');
  const stepKey = $('step-key');
  const form = $('form');
  const email = $('email');
  const password = $('password');
  const submit = $('submit');
  const alertBox = $('alert');
  let mode = 'signup';

  // ---------- storage (wrapped: private mode can throw) ----------
  function readAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS)) || {}; } catch { return {}; }
  }
  function writeAccounts(a) {
    try { localStorage.setItem(ACCOUNTS, JSON.stringify(a)); return true; } catch { return false; }
  }
  function getSession() {
    try { return localStorage.getItem(SESSION); } catch { return null; }
  }
  function setSession(v) {
    try { v ? localStorage.setItem(SESSION, v) : localStorage.removeItem(SESSION); } catch { /* ignore */ }
  }

  async function hash(salt, pw) {
    const bytes = new TextEncoder().encode(salt + ':' + pw);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  function newSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------- UI ----------
  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.classList.remove('hidden');
  }
  function clearError() {
    alertBox.classList.add('hidden');
    email.classList.remove('bad');
    password.classList.remove('bad');
  }

  function setMode(next) {
    mode = next;
    const signup = mode === 'signup';
    $('auth-title').textContent = signup ? 'Get free trial' : 'Sign in';
    $('auth-sub').textContent = signup
      ? 'Create a free account to get your 11-day trial key. No card needed.'
      : 'Sign in to get your trial key.';
    submit.textContent = signup ? 'Create account' : 'Sign in';
    password.autocomplete = signup ? 'new-password' : 'current-password';
    $('switch-row').innerHTML = signup
      ? 'Already have an account? <a href="#" id="switch">Sign in</a>'
      : 'New here? <a href="#" id="switch">Create an account</a>';
    $('switch').addEventListener('click', onSwitch);
    clearError();
  }
  function onSwitch(e) { e.preventDefault(); setMode(mode === 'signup' ? 'signin' : 'signup'); }

  function showKeyStep(mail) {
    stepAuth.classList.add('hidden');
    stepKey.classList.remove('hidden');
    $('who').textContent = 'Signed in as ' + mail;
    $('before-key').classList.remove('hidden');
    $('after-key').classList.add('hidden');
  }
  function showAuthStep() {
    stepKey.classList.add('hidden');
    stepAuth.classList.remove('hidden');
    password.value = '';
  }

  // ---------- events ----------
  email.addEventListener('input', clearError);
  password.addEventListener('input', clearError);
  $('switch').addEventListener('click', onSwitch);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mail = email.value.trim().toLowerCase();
    const pw = password.value;

    if (!/^\S+@\S+\.\S+$/.test(mail)) { email.classList.add('bad'); showError('Enter a valid email address.'); email.focus(); return; }
    if (mode === 'signup' && pw.length < 6) { password.classList.add('bad'); showError('Password needs at least 6 characters.'); password.focus(); return; }

    const accounts = readAccounts();
    submit.disabled = true;
    try {
      if (mode === 'signup') {
        if (accounts[mail]) { showError('That email already has an account. Sign in instead.'); return; }
        const salt = newSalt();
        accounts[mail] = { salt, hash: await hash(salt, pw) };
        if (!writeAccounts(accounts)) { showError('Your browser blocked storage, so the account could not be saved.'); return; }
      } else {
        const acc = accounts[mail];
        if (!acc || acc.hash !== (await hash(acc.salt, pw))) {
          password.classList.add('bad');
          showError('Wrong email or password.');
          return;
        }
      }
      setSession(mail);
      showKeyStep(mail);
    } finally {
      submit.disabled = false;
    }
  });

  $('create').addEventListener('click', () => {
    $('trial-key').textContent = TRIAL_KEY;
    $('before-key').classList.add('hidden');
    $('after-key').classList.remove('hidden');
  });

  $('copy').addEventListener('click', async () => {
    const btn = $('copy');
    try {
      await navigator.clipboard.writeText(TRIAL_KEY);
      btn.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('trial-key'));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  });

  $('signout').addEventListener('click', (e) => {
    e.preventDefault();
    setSession(null);
    showAuthStep();
  });

  // Already signed in on this browser -> straight to the key step.
  const session = getSession();
  if (session && readAccounts()[session]) showKeyStep(session);
})();
