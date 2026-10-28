// Account page: re-checks the saved key with Lemon Squeezy on every visit.
(function () {
  const key = loadKey();
  if (!key) { location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  let revealed = false;

  function signOut(e) {
    if (e) e.preventDefault();
    clearKey();
    location.href = 'login.html';
  }
  $('signout').addEventListener('click', signOut);
  $('signout-top').addEventListener('click', signOut);
  $('error-signout').addEventListener('click', signOut);
  $('retry').addEventListener('click', load);

  $('key-val').textContent = maskKey(key);
  $('reveal').addEventListener('click', () => {
    revealed = !revealed;
    $('key-val').textContent = revealed ? key : maskKey(key);
    $('key-val').classList.toggle('masked', !revealed);
    $('reveal').textContent = revealed ? 'Hide' : 'Show';
  });
  $('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(key);
      $('copy').textContent = 'Copied';
      $('copy').classList.add('copied');
      setTimeout(() => { $('copy').textContent = 'Copy'; $('copy').classList.remove('copied'); }, 1600);
    } catch { /* clipboard blocked: user can Show + select */ }
  });

  function show(which) {
    ['loading', 'error', 'account'].forEach((id) => $(id).classList.toggle('hidden', id !== which));
  }

  async function load() {
    show('loading');
    const result = await checkLicence(key);
    if (!result.ok) {
      $('error-msg').textContent = result.message;
      show('error');
      return;
    }
    render(result.data);
    show('account');
  }

  function render(data) {
    const lk = data.license_key;
    const meta = data.meta || {};

    const first = (meta.customer_name || '').split(' ')[0];
    $('hello').textContent = first ? 'Hi, ' + first : 'Your account';
    $('who').textContent = meta.customer_email || '';
    $('test-badge').classList.toggle('hidden', !lk.test_mode);

    const plan = [meta.product_name, meta.variant_name && meta.variant_name !== 'Default' ? meta.variant_name : '']
      .filter(Boolean).join(' — ');
    $('plan').textContent = plan || 'Clean AI';

    const st = describeStatus(lk.status);
    $('status').className = 'badge ' + st.cls;
    $('status-text').textContent = st.text;

    $('created').textContent = formatDate(lk.created_at) || '—';
    const exp = formatDate(lk.expires_at);
    $('expires-k').textContent = lk.status === 'expired' ? 'Expired on' : 'Valid until';
    $('expires').textContent = exp || (st.cls === 'active' ? 'While subscribed' : '—');

    const limit = lk.activation_limit;
    $('devices').textContent = (lk.activation_usage || 0) + ' of ' + (limit == null ? 'unlimited' : limit);

    const notice = $('notice');
    if (lk.status === 'expired') {
      notice.textContent = 'This licence has expired, so the app will ask for a key again. Buy a new licence to keep using Clean AI.';
      notice.classList.remove('hidden');
    } else if (lk.status === 'disabled') {
      notice.textContent = 'This licence was disabled (usually a refund or chargeback). Contact support if that looks wrong.';
      notice.classList.remove('hidden');
    } else {
      notice.classList.add('hidden');
    }
  }

  load();
})();
