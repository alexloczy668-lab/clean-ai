// Clean AI website — shared config + Lemon Squeezy licence sign-in.
// Everything that changes when the store goes live is in this one object.
const CLEAN_AI = {
  // Lemon Squeezy store "clean-ai" (same id in test and live mode).
  storeId: 479522,
  // Checkout link. When the product is copied to LIVE mode, paste the new link here.
  checkoutUrl: 'https://clean-ai.lemonsqueezy.com/checkout/buy/e2c3871f-b081-4ba3-a8fc-1213837d8bcc',
  // Lemon Squeezy's buyer portal: invoices, cancel, update card, lost keys (email magic link).
  ordersUrl: 'https://app.lemonsqueezy.com/my-orders',
  // Fixed name so the link never changes. New release: replace this file,
  // bump "version" in version.json (the app checks it every 14 days).
  downloadUrl: 'download/CleanAI-Setup.exe',
  validateUrl: 'https://api.lemonsqueezy.com/v1/licenses/validate',
  storageKey: 'cleanai.licence',
};

// Fill every <a data-link="checkout|orders|download"> from the config above.
document.querySelectorAll('[data-link]').forEach((a) => {
  const url = CLEAN_AI[a.dataset.link + 'Url'];
  if (url) a.href = url;
});

// Nav: show "Account" instead of "Sign in" when a key is saved.
const savedKey = loadKey();
document.querySelectorAll('[data-signin]').forEach((a) => {
  if (savedKey) { a.textContent = 'Account'; a.href = 'account.html'; }
});

// ---------- key storage (browser only, never sent anywhere but Lemon Squeezy) ----------
function loadKey() {
  try { return localStorage.getItem(CLEAN_AI.storageKey) || sessionStorage.getItem(CLEAN_AI.storageKey); }
  catch { return null; }
}
function saveKey(key, remember) {
  try {
    clearKey();
    (remember ? localStorage : sessionStorage).setItem(CLEAN_AI.storageKey, key);
  } catch { /* private mode: sign-in still works for this page view */ }
}
function clearKey() {
  try { localStorage.removeItem(CLEAN_AI.storageKey); sessionStorage.removeItem(CLEAN_AI.storageKey); }
  catch { /* ignore */ }
}

// ---------- Lemon Squeezy licence lookup ----------
// Docs: https://docs.lemonsqueezy.com/api/license-api/validate-license-key
// Returns { ok: true, data } or { ok: false, message }.
async function checkLicence(key) {
  let res;
  try {
    res = await fetch(CLEAN_AI.validateUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ license_key: key }),
    });
  } catch {
    return { ok: false, message: 'Could not reach the licence server. Check your connection and try again.' };
  }

  let data = {};
  try { data = await res.json(); } catch { /* handled below */ }

  if (!data.license_key) {
    if (res.status === 429) return { ok: false, message: 'Too many attempts. Wait a minute and try again.' };
    return { ok: false, message: "We couldn't find that licence key. Check it against your purchase email." };
  }
  if (!data.meta || Number(data.meta.store_id) !== CLEAN_AI.storeId) {
    return { ok: false, message: "That key isn't a Clean AI licence." };
  }
  return { ok: true, data };
}

// LS key status -> what we show. "inactive" = bought but not yet activated in the app: still paid.
function describeStatus(status) {
  switch (status) {
    case 'active':
    case 'inactive': return { text: 'Active', cls: 'active' };
    case 'expired': return { text: 'Expired', cls: 'warn' };
    case 'disabled': return { text: 'Disabled', cls: 'bad' };
    default: return { text: status || 'Unknown', cls: 'warn' };
  }
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function maskKey(key) {
  return key.length > 8 ? key.slice(0, 4) + '••••••••••••' + key.slice(-4) : '••••••••';
}
