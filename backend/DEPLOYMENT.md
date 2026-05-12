# Backend deployment (VRMTS API)

This document is for deploying the Node/Express API (`backend/`) with MySQL. The app reads configuration from **environment variables** only in production; copy `backend/.env.example` to `.env` for local development.

---

## 1. Prerequisites

- A **MySQL 8** database with schema and seed data loaded (see repo root `dbtables.sql`).
- **Node 20** (matches `Dockerfile`).
- A **public HTTPS URL** for the frontend if you use cookies + CORS from the browser (e.g. Vercel).

---

## 2. Railway (recommended layout)

### 2.1 Services

1. **MySQL** — Railway’s MySQL template (or any MySQL 8 instance).
2. **Web service** — deploy this `backend/` folder (Dockerfile at repo `backend/Dockerfile` or set root directory to `backend` if the repo root is the Railway service root).

Link the backend service to the MySQL service so Railway can inject connection variables (or set them manually as below).

### 2.2 Import the database (one-time)

From your machine, restore `dbtables.sql` into the database name you will use (e.g. `vrmts` or `railway`). Use the **public** MySQL host/port only for tools (Workbench, `mysql` CLI). The backend should use the **private** host variables Railway provides to the service (see below).

### 2.3 Backend service variables (Railway)

In the **backend** service → **Variables**, add the following. Names must match exactly what the code expects (left column).

| Variable | Required | Example / source | What it does |
|----------|----------|------------------|--------------|
| `NODE_ENV` | **Yes** (prod) | `production` | Enables production cookie (`secure`), CORS allowlist only (no implicit localhost), hides dev-only `/api/test` routes. |
| `PORT` | Usually auto-set | `8080` if unset | HTTP listen port. **Railway** injects `PORT`; the server uses `process.env.PORT` or defaults to `8080`. |
| `DB_HOST` | **Yes** | Railway private host, e.g. value from `MYSQLHOST` / `MYSQL_HOST` / connection tab | MySQL server hostname. Prefer **internal** hostname for the backend service. |
| `DB_PORT` | Recommended | `3306` (internal) or provider port | MySQL TCP port. Defaults to **3306** if omitted. Use the port that matches `DB_HOST` (internal is often 3306 on Railway). |
| `DB_USER` | **Yes** | e.g. `root` or `mysql` user from provider | MySQL user. |
| `DB_PASS` | **Yes** | From Railway MySQL service secrets | MySQL password. |
| `DB_NAME` | **Yes** | `railway` or `vrmts` (must match where you imported SQL) | Database name. |
| `SESSION_SECRET` | **Yes** | Long random string (32+ bytes); **never commit** | Signs the session cookie. The app **throws at startup** if this is missing. |
| `CORS_ORIGIN` | **Yes** in production | `https://your-app.vercel.app` | Comma-separated list of allowed **browser** origins for credentialed requests. **Production:** only these origins are allowed (localhost is **not** auto-added). **Development:** localhost dev servers are merged in. |

**Mapping Railway MySQL plugin variables** (names can vary slightly by template; check the MySQL service’s “Variables” tab):

- Set `DB_HOST` to the MySQL **internal** host variable Railway shows (often `MYSQLHOST` or similar).
- Set `DB_USER`, `DB_PASS`, `DB_NAME` from the same service (`MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, etc.).
- Set `DB_PORT` to the internal port (often `3306`).

**Cookies + HTTPS:** In production, `session.js` sets `cookie.secure = true` and `sameSite = 'none'`. The API must be served over **HTTPS** and the frontend origin must be listed in `CORS_ORIGIN`, or the browser will block cookies/CORS.

### 2.4 Health check (optional)

If Railway asks for a health path, you can use any stable GET route your deployment exposes, or add a small `/health` route later. Dev-only `/api/test` is **not** registered when `NODE_ENV=production`.

### 2.5 Build / start

- **Docker:** `CMD` is `npm start` (see `backend/Dockerfile`).
- Ensure `package.json` `start` script runs `node src/server.js` (or your entrypoint).

---

## 3. Environment variable reference (full)

| Variable | Required | Default / behavior | Used by |
|----------|----------|--------------------|---------|
| `NODE_ENV` | Strongly recommended | If not `production`, dev CORS origins are allowed and session cookie is not `secure`. | `app.js`, `session.js` |
| `PORT` | Set by many hosts | `8080` | `server.js` |
| `DB_HOST` | **Yes** | None — must be set | `db.js`, `session.js` (MySQL session store) |
| `DB_PORT` | No | `3306` | `db.js`, `session.js` |
| `DB_USER` | **Yes** | None | `db.js`, `session.js` |
| `DB_PASS` | **Yes** | None | `db.js`, `session.js` |
| `DB_NAME` | **Yes** | None | `db.js`, `session.js` |
| `SESSION_SECRET` | **Yes** | Startup error if missing | `session.js` |
| `CORS_ORIGIN` | Required for real prod browsers | Empty → production may allow **no** frontend origins | `app.js` |
| `RAG_BASE_URL` | No | `http://127.0.0.1:8000` | `facultyQuiz.controller.js` |
| `RAG_SERVICE_URL` | No | Falls back to `RAG_BASE_URL` then `http://rag:8000` | `ragQuiz.controller.js` |
| `RAG_SERVER_URL` | No | `http://localhost:8000` | `moduleExploration.controller.js` |
| `RAG_TIMEOUT_MS` | No | `180000` | `facultyQuiz.controller.js` |

RAG variables only matter if you deploy a separate RAG/LLM HTTP service and want the backend to call it.

---

## 4. Frontend (Vercel) coordination

The browser calls the API with cookies. Set on **Vercel** (frontend):

- `VITE_API_BASE_URL` = your backend public URL, e.g. `https://your-api.up.railway.app` (no trailing slash; paths in the app append `/api/...`).

That URL’s **origin** must appear in the backend’s `CORS_ORIGIN`.

---

## 5. Checklist before going live

- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` is long, random, and unique per environment
- [ ] `CORS_ORIGIN` includes exact Vercel URL(s) (scheme + host, no path)
- [ ] `DB_*` points at the same database you imported with `dbtables.sql`
- [ ] Backend served over **HTTPS** (Railway provides this)
- [ ] Database password rotated if it was ever exposed

---

## 6. Local development

```bash
cd backend
cp .env.example .env
# Edit .env: local MySQL + SESSION_SECRET + CORS_ORIGIN if needed
npm install
npm start
```

Default dev behavior: `http://localhost:5173` and `http://localhost:3000` are allowed by CORS in addition to anything in `CORS_ORIGIN`.
