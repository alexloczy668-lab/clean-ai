// Clean AI — shared auth logic. Loaded on every page.
// Requires: config.js and the Supabase UMD bundle to be loaded first.

(function () {
  const cfg = window.CLEAN_AI_CONFIG || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-PROJECT")) {
    console.warn("[Clean AI] Supabase not configured. Copy config.example.js -> config.js and paste your keys.");
  }
  if (!window.supabase) {
    console.error("[Clean AI] Supabase client library failed to load (CDN blocked?).");
    return;
  }

  // One shared client for the whole site.
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  // ---- small DOM helpers ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function showAlert(el, msg, kind = "error") {
    if (!el) return;
    el.textContent = msg;
    el.className = "alert show " + kind;
  }
  function clearAlert(el) {
    if (!el) return;
    el.textContent = "";
    el.className = "alert";
  }
  function setFieldError(input, errEl, msg) {
    if (input) input.classList.toggle("bad", !!msg);
    if (errEl) errEl.textContent = msg || "";
    return !msg;
  }
  function busy(btn, on, labelWhenBusy) {
    if (!btn) return;
    btn.disabled = on;
    if (on) {
      btn.dataset._label = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span>' + (labelWhenBusy || "");
    } else if (btn.dataset._label) {
      btn.innerHTML = btn.dataset._label;
    }
  }

  // ---- validation ----
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = (v) => EMAIL_RE.test((v || "").trim());

  // ---- password visibility toggle wiring ----
  function wirePwToggles(root = document) {
    $$(".toggle-pw", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        if (!input) return;
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        btn.textContent = showing ? "show" : "hide";
      });
    });
  }

  // ---- licence key: generate + fetch/create ----
  function genLicenceKey() {
    // CLEAN-XXXX-XXXX-XXXX-XXXX from a UUID (crypto), uppercase hex groups.
    const uuid = (crypto.randomUUID && crypto.randomUUID()) || genFallbackUuid();
    const hex = uuid.replace(/-/g, "").toUpperCase();
    return "CLEAN-" + hex.slice(0, 4) + "-" + hex.slice(4, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16);
  }
  function genFallbackUuid() {
    return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // Fetch the user's licence row; create one on first login (UUID-based key).
  async function getOrCreateLicense(user) {
    const { data: rows, error } = await sb
      .from("licenses")
      .select("key, status, created_at")
      .eq("user_id", user.id)
      .limit(1);

    if (error) throw error;
    if (rows && rows.length) return rows[0];

    // First login for this user -> mint a key. Default status: Trial.
    const row = { user_id: user.id, key: genLicenceKey(), status: "trial" };
    const { data: created, error: insErr } = await sb
      .from("licenses")
      .insert(row)
      .select("key, status, created_at")
      .single();

    if (insErr) {
      // If a race created it in parallel, re-read instead of failing.
      if (insErr.code === "23505") {
        const { data: again } = await sb
          .from("licenses")
          .select("key, status, created_at")
          .eq("user_id", user.id)
          .single();
        if (again) return again;
      }
      throw insErr;
    }
    return created;
  }

  // ---- route guards ----
  // Redirect signed-out users away from a protected page.
  async function requireAuth(redirect = "login.html") {
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      window.location.replace(redirect);
      return null;
    }
    return data.session;
  }
  // Redirect signed-in users away from guest-only pages (login/signup).
  async function requireGuest(redirect = "account.html") {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      window.location.replace(redirect);
      return true;
    }
    return false;
  }

  // Map Supabase auth errors to short, friendly inline text.
  function friendlyError(err) {
    const m = (err && err.message) || String(err);
    if (/Invalid login credentials/i.test(m)) return "Email or password is incorrect.";
    if (/Email not confirmed/i.test(m)) return "Please confirm your email first — check your inbox.";
    if (/User already registered/i.test(m)) return "An account with this email already exists.";
    if (/rate limit|too many/i.test(m)) return "Too many attempts. Please wait a minute and try again.";
    if (/Password should be at least/i.test(m)) return m;
    if (/Failed to fetch|NetworkError/i.test(m)) return "Network error — check your connection and try again.";
    return m;
  }

  // Expose a tiny namespace for the page scripts.
  window.CleanAI = {
    sb, $, $$,
    showAlert, clearAlert, setFieldError, busy,
    isEmail, wirePwToggles,
    getOrCreateLicense, genLicenceKey,
    requireAuth, requireGuest, friendlyError,
  };
})();
