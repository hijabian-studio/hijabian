# HIJABIAN Admin API – Setup Guide

This Worker lets the admin panel read and write catalogue JSON and images in the GitHub repository **without** exposing a GitHub token to the browser.

```
Admin browser
    → Cloudflare Access (login required)
    → Cloudflare Worker (this API)
    → GitHub Contents API
    → hijabian-studio/hijabian repository
```

---

## 1. Create a GitHub fine-grained personal access token

Do this on GitHub while signed in as a user who can push to `hijabian-studio/hijabian`.

1. Open **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Click **Generate new token**.
3. Settings:
   - **Token name:** `hijabian-admin-worker` (or similar)
   - **Expiration:** choose a period you will renew (e.g. 90 days)
   - **Resource owner:** the account/org that owns the repo (`hijabian-studio`)
   - **Repository access:** **Only select repositories** → choose **hijabian** only
4. **Permissions** (Repository permissions):
   - **Contents:** Read and write
   - **Metadata:** Read-only (required by GitHub)
   - Leave everything else **No access**
5. Generate the token and **copy it once**. Store it in a password manager.
6. **Do not** paste this token into chat, commit it, or put it in any HTML/JS file.

---

## 2. Install tools on your computer

1. Install **Node.js** (LTS) from https://nodejs.org
2. Install Wrangler (Cloudflare’s CLI):

```bash
npm install -g wrangler
```

3. Log in to Cloudflare:

```bash
wrangler login
```

A browser window opens so you can authorise Wrangler.

---

## 3. Configure the Worker project

From your machine:

```bash
git clone https://github.com/hijabian-studio/hijabian.git
cd hijabian/workers/admin-api
```

Edit `wrangler.toml`:

```toml
name = "hijabian-admin-api"
main = "src/index.js"
compatibility_date = "2024-11-01"

[vars]
GITHUB_OWNER = "hijabian-studio"
GITHUB_REPO = "hijabian"
GITHUB_BRANCH = "main"
ALLOWED_EMAILS = "your-email@example.com"
```

- Put **your real admin email(s)** in `ALLOWED_EMAILS`, comma-separated if more than one.
- These must match the Google/email identity you will use with Cloudflare Access.

---

## 4. Store secrets (never in git)

Still inside `workers/admin-api`:

```bash
wrangler secret put GITHUB_TOKEN
```

When prompted, paste the fine-grained PAT and press Enter.

Optional extra lock (recommended):

```bash
wrangler secret put ADMIN_SHARED_SECRET
```

Create a long random string (password manager). You will later put the **same** value in the admin UI config only on machines you control—or inject it at build time. The Worker rejects requests that do not send header `X-Admin-Secret` when this secret is set.

**Secret names (exact):**

| Name | Type | Purpose |
|------|------|--------|
| `GITHUB_TOKEN` | Secret | Fine-grained PAT |
| `ADMIN_SHARED_SECRET` | Secret (optional) | Extra shared header check |
| `ALLOWED_EMAILS` | Var in `wrangler.toml` | Comma-separated admin emails |
| `GITHUB_OWNER` | Var | `hijabian-studio` |
| `GITHUB_REPO` | Var | `hijabian` |
| `GITHUB_BRANCH` | Var | `main` |

---

## 5. Deploy the Worker

```bash
cd workers/admin-api
wrangler deploy
```

Wrangler prints a URL such as:

```text
https://hijabian-admin-api.<your-subdomain>.workers.dev
```

Copy that URL. You need it for Access and for the admin panel.

Quick public check (should return JSON without auth for health only):

```bash
curl https://hijabian-admin-api.<your-subdomain>.workers.dev/api/health
```

Expected: `{"ok":true,"service":"hijabian-admin-api"}`

Calling `/api/catalogue` **without** Access should return **401**.

---

## 6. Protect the API with Cloudflare Access

Cloudflare Access must sit in front of the **Worker**, not only the static admin HTML.

### 6.1 Create an Access application for the Worker

1. Cloudflare Dashboard → **Zero Trust** (or **Cloudflare One**).
2. **Access** → **Applications** → **Add an application**.
3. Choose **Self-hosted**.
4. Configure:
   - **Application name:** `Hijabian Admin API`
   - **Session duration:** e.g. 24 hours
   - **Application domain / path:**
     - Select your `workers.dev` domain **or** a custom route you assigned to the Worker
     - Path: `/` or leave default so the whole Worker is covered
5. **Identity providers:** enable at least one (e.g. One-time PIN email, Google, GitHub).
6. **Policy:**
   - Policy name: `Hijabian admins only`
   - Action: **Allow**
   - Include rule: **Emails** → add the same addresses as in `ALLOWED_EMAILS`
7. Save the application.

After this, any browser request to the Worker URL must pass Access login. The Worker then reads `Cf-Access-Authenticated-User-Email` and checks it against `ALLOWED_EMAILS`.

### 6.2 Protect the static admin UI as well

The admin HTML is on GitHub Pages (`/admin/`). GitHub Pages cannot enforce Cloudflare Access by itself.

**Recommended approach:**

1. Put the site behind **Cloudflare** using a custom domain (e.g. `hijabian.com`) with the domain proxied (orange cloud).
2. Create a **second** Access application:
   - Name: `Hijabian Admin UI`
   - Path: `hijabian.com/admin*` (or `www.hijabian.com/admin*`)
   - Same allow-list emails as the API
3. Leave the public site (home, courses, cart) **without** Access.

Until a custom domain is on Cloudflare, the `/admin/` folder on `github.io` is only “hidden by obscurity”. Treat the **API + Access** as the real security boundary; do not rely on the admin URL staying secret.

---

## 7. Point the admin panel at the Worker

In `admin/admin.js` (or a small config block in `admin/index.html`), set:

```js
window.HIJABIAN_ADMIN_API = "https://hijabian-admin-api.<your-subdomain>.workers.dev";
// Only if you created ADMIN_SHARED_SECRET:
window.HIJABIAN_ADMIN_SECRET = ""; // paste locally; do not commit real value
```

Prefer injecting the secret only on trusted machines, or omit `ADMIN_SHARED_SECRET` until you have a safe injection method.

A follow-up change can wire **Save** buttons to:

- `GET /api/catalogue`
- `PUT /api/courses` with `{ courses: [...], sha }`
- `PUT /api/products` with `{ products: [...], sha }`
- `PUT /api/categories` with `{ categories: [...], sha }`
- `PUT /api/settings` with settings object + `sha`
- `POST /api/upload` with `{ filename, contentBase64, contentType, folder }`

Always send credentials in browser mode when calling a Worker behind Access from the admin origin so Access cookies are included (`fetch(url, { credentials: "include" })`).

---

## 8. API reference

All routes except `/api/health` require Cloudflare Access (valid identity email in `ALLOWED_EMAILS`).

| Method | Path | Body | Purpose |
|--------|------|------|--------|
| GET | `/api/health` | — | Liveness |
| GET | `/api/catalogue` | — | All JSON files |
| GET | `/api/courses` | — | `{ data, sha }` |
| PUT | `/api/courses` | `{ courses, sha? }` | Replace courses file |
| GET | `/api/products` | — | `{ data, sha }` |
| PUT | `/api/products` | `{ products, sha? }` | Replace products file |
| GET | `/api/categories` | — | `{ data, sha }` |
| PUT | `/api/categories` | `{ categories, sha? }` | Replace categories file |
| GET | `/api/settings` | — | `{ data, sha }` |
| PUT | `/api/settings` | settings fields + `sha?` | Replace settings file |
| POST | `/api/upload` | `{ filename, contentBase64, contentType, folder }` | Upload image under `images/products/` or `images/courses/` |

Updates use GitHub content **SHA** to avoid overwriting concurrent edits (HTTP 409 on mismatch).

---

## 9. Testing checklist

1. `GET /api/health` → 200 without login.
2. `GET /api/catalogue` in a private window → Access login page or 401 from Worker.
3. Log in with an **allowed** email → catalogue JSON returned.
4. Log in with a **disallowed** email → 403 after Access (or Access deny).
5. `PUT /api/courses` with a small valid payload and current `sha` → 200; check GitHub commit appears on `data/courses.json`.
6. Repeat PUT with an **old** `sha` → 409 Conflict.
7. `POST /api/upload` with a small WebP/PNG as base64 → file appears under `images/products/` or `images/courses/`.
8. Confirm the PAT is **not** visible in browser Network tab (only your Access session / optional shared secret header).
9. Revoke a test token in GitHub and confirm the Worker returns a safe error (no token value in the response body).

---

## 10. Security reminders

- Rotate the GitHub PAT when staff change or on a schedule.
- Keep `ALLOWED_EMAILS` minimal.
- Never commit `.env`, `wrangler.toml` with secrets, or real `ADMIN_SHARED_SECRET` values.
- Contents permission must stay limited to the **hijabian** repository only.
- Rate limits: the Worker maps GitHub 429 to a generic message; retry after a delay.
- Deleting catalogue rows is done by saving a new JSON array **without** those rows (no raw git delete of arbitrary paths).

---

## 11. What you must do manually (summary)

| Step | Where | You do |
|------|--------|--------|
| 1 | GitHub | Create fine-grained PAT (Contents R/W on `hijabian` only) |
| 2 | Your PC | Install Node + Wrangler, `wrangler login` |
| 3 | `wrangler.toml` | Set `ALLOWED_EMAILS` to your admin email(s) |
| 4 | Terminal | `wrangler secret put GITHUB_TOKEN` (and optional `ADMIN_SHARED_SECRET`) |
| 5 | Terminal | `wrangler deploy` |
| 6 | Cloudflare Zero Trust | Access app on the Worker URL; allow your emails |
| 7 | Cloudflare Zero Trust | Access app on `/admin*` once the site uses a Cloudflare proxied domain |
| 8 | Admin UI config | Set Worker base URL; wire Save buttons to the API |

No private token should ever be pasted into this chat or into public repository files.
