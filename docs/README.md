# Clean AI — Auth Site

Vanilla HTML/CSS/JS. No framework, no build step. Auth via Supabase (loaded from CDN).
Private by design: no tracking, no analytics.

## Files

| File | Purpose |
|------|---------|
| `signup.html` | Email + password + confirm, client validation, "check your email" state |
| `login.html` | Email + password, forgot-password link, redirects to `account.html` |
| `reset.html` | Both states: request a reset link **and** set a new password from the link |
| `account.html` | Protected dashboard: email, subscription status, masked licence key, logout |
| `app.js` | Shared Supabase client, route guards, validation, licence logic |
| `styles.css` | Dark teal theme matching the Clean AI desktop app |
| `config.js` | **Your Supabase keys (gitignored).** Copy from `config.example.js` |
| `supabase-setup.sql` | Table + Row Level Security for `licenses` |

## Setup

### 1. Configure keys
```bash
cp config.example.js config.js
```
Paste your **Project URL** and **anon/public key** (Supabase → Project Settings → API).
The anon key is safe in the browser — it's protected by Row Level Security. Never put
the `service_role` key here.

### 2. Create the licences table
Run `supabase-setup.sql` in the Supabase SQL Editor.

### 3. Auth settings (Supabase dashboard → Authentication)
- **Providers → Email**: enable **Confirm email**.
- **URL Configuration → Site URL**: your site origin (e.g. `http://localhost:8000`).
- **URL Configuration → Redirect URLs**: add your origin + `login.html` and `reset.html`,
  e.g. `http://localhost:8000/login.html`, `http://localhost:8000/reset.html`.

### 4. Run locally
Must be served over HTTP (not opened as a `file://` — Supabase redirects and clipboard need an origin):
```bash
python -m http.server 8000
```
Then open http://localhost:8000/signup.html

## How it works

- **Route guards** (`app.js`): `account.html` bounces signed-out users to `login.html`;
  `login.html`/`signup.html` bounce signed-in users to `account.html`.
- **Licence key**: auto-generated on first login from a UUID
  (`CLEAN-XXXX-XXXX-XXXX-XXXX`), stored in `licenses`, status defaults to `trial`.
- **Subscription status**: read from `licenses.status` — rendered as Active / Trial / None.
- **Manage subscription**: stub button (Stripe billing wired in next).
- All errors render inline — no `alert()` popups.
