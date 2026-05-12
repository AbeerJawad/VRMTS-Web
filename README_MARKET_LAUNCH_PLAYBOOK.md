# VRMTS Market Launch Playbook

This is a practical, step-by-step launch playbook for taking VRMTS from current state to production confidence.

Use this with an AI assistant (Cursor, ChatGPT, Claude, etc.) as your execution copilot.

---

## 1) What "Ready for Market" Means

Before launch, all of these must be true:

- App deploys cleanly (frontend + backend + DB).
- Core flows work for student, instructor, and admin personas.
- No critical security misconfigurations.
- Monitoring and rollback procedures exist.
- Team can reproduce deploy and validation from docs only.

If any section in this playbook is incomplete, do not launch.

---

## 2) System Architecture (Current Target)

- Frontend: `frontend` (Vite + React) -> deploy to Vercel
- Backend: `backend` (Express + MySQL sessions) -> deploy to Railway
- Database: Railway MySQL
- Schema source: `dbtables.sql`

Note: AI/RAG services are intentionally out of scope for this launch baseline.

---

## 3) Launch Phases (Do in order)

1. Preflight and code quality gate
2. Database setup and validation
3. Backend deploy and hardening
4. Frontend deploy and environment wiring
5. End-to-end functional QA
6. Security verification
7. Reliability and operational readiness
8. Launch decision gate

---

## 4) AI Copilot Workflow

Use this prompt pattern at the start of each phase:

```text
You are my release copilot. We are executing phase <N> of VRMTS market launch.
Goal: <phase goal>
Constraints: do not skip checks, produce explicit pass/fail list.
Output format:
1) Actions to run now
2) Expected result for each action
3) Fail conditions
4) Fix actions if fail
```

When done with each phase, ask AI:

```text
Based on evidence only, is phase <N> PASSED or FAILED?
List all blockers that must be resolved before next phase.
```

---

## 5) Phase 1: Preflight and Quality Gate

### 5.1 Branch hygiene

- Ensure your deployment branch is clean and stable.
- Confirm no accidental local secrets are committed.

Checklist:

- [ ] `git status` has only intentional changes
- [ ] No `.env` with real secrets committed
- [ ] `README_MARKET_LAUNCH_PLAYBOOK.md` committed

### 5.2 Dependency and build sanity

Run from repo root:

- Backend:
  - `cd backend`
  - `npm install`
  - `npm test` (or at minimum unit tests)
- Frontend:
  - `cd ../frontend`
  - `npm install`
  - `npm run build`

Pass criteria:

- [ ] Backend tests pass
- [ ] Frontend build completes successfully
- [ ] No blocking TypeScript/lint errors

---

## 6) Phase 2: Database Setup and Validation

### 6.1 Load schema and data

Preferred method:

- Use MySQL client import into Railway MySQL:
  - `mysql -h <host> -P <port> -u <user> -p <database> < dbtables.sql`

### 6.2 Validate schema existence

Run:

- `SHOW TABLES;`
- Verify these critical tables exist:
  - `user`, `student`, `teacher`, `module`, `studentmoduleassignment`
  - `quiz`, `questionbank`, `quizquestion`, `quizattempt`, `answerrecord`
  - `sessions`, `userpreferences`, `usernotifications`, `useraccessibility`
  - `notification`, `audit_logs`, `ai_question_staging`

### 6.3 Validate essential seed data

Run quick checks:

- `SELECT COUNT(*) FROM user;`
- `SELECT COUNT(*) FROM module;`
- `SELECT COUNT(*) FROM questionbank;`

Pass criteria:

- [ ] All critical tables exist
- [ ] Non-zero seed users/modules/questionbank
- [ ] No import errors

---

## 7) Phase 3: Backend Deploy and Hardening

### 7.1 Railway backend deploy

- Deploy `backend` directory as Railway service.

Required env vars:

- `NODE_ENV=production`
- `PORT=8080`
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `SESSION_SECRET` (long random string)
- `CORS_ORIGIN` (set to Vercel URL later)

### 7.2 Backend health checks

Validate:

- Service starts without crash loops.
- DB connection works.
- Session table read/write works.

Quick endpoint checks:

- `GET /api/test` (dev only, if enabled)
- `POST /api/auth/login`
- `GET /api/auth/check` after login

Pass criteria:

- [ ] No startup env errors
- [ ] Auth/session works
- [ ] No persistent 5xx in logs

---

## 8) Phase 4: Frontend Deploy and Wiring

### 8.1 Vercel deploy

- Deploy `frontend` directory to Vercel.

Required env var:

- `VITE_API_BASE_URL=https://<railway-backend-domain>/api`

### 8.2 CORS finalization

Back in Railway backend env:

- `CORS_ORIGIN=https://<vercel-domain>`

Redeploy backend after setting CORS.

Pass criteria:

- [ ] Frontend loads on Vercel
- [ ] Login works from deployed frontend
- [ ] Browser shows no CORS/auth cookie errors

---

## 9) Phase 5: End-to-End Functional QA

Test all personas.

### 9.1 Student flow

- [ ] Login as student
- [ ] Student dashboard loads
- [ ] Modules page loads and actions work
- [ ] Start quiz -> answer -> submit -> results shown
- [ ] Student analytics loads successfully
- [ ] Settings save flows work

### 9.2 Instructor flow

- [ ] Login as instructor
- [ ] Instructor dashboard loads
- [ ] Quiz creation page loads
- [ ] Instructor analytics route works (no student endpoint mismatch)
- [ ] Student management page loads

### 9.3 Admin flow

- [ ] Login as admin
- [ ] Admin dashboard loads
- [ ] Students/faculty/audit pages load
- [ ] Admin actions create expected audit entries

Pass criteria:

- [ ] No blocking 4xx/5xx on core routes
- [ ] No broken nav links for primary personas

---

## 10) Phase 6: Security Verification

### 10.1 Session/cookie controls

Verify in production:

- `secure` cookies enabled
- `httpOnly` enabled
- `sameSite=none` for cross-site deployment

### 10.2 Secret hygiene

- [ ] No default/fallback secrets in production
- [ ] `.env` not committed with real credentials
- [ ] Rotate any temporary secrets used during setup

### 10.3 HTTP and app protections

- [ ] `helmet` active in backend
- [ ] CORS restricted to known origin(s)
- [ ] Debug/test endpoints not exposed in production

### 10.4 Basic abuse resistance

- [ ] Body size limits in place
- [ ] Auth checks enforced for protected endpoints
- [ ] Role-based access verified (student/instructor/admin boundaries)

---

## 11) Phase 7: Reliability and Ops Readiness

### 11.1 Monitoring baseline

At minimum:

- Backend error rate monitoring (5xx count)
- Backend restart/crash loop alerts
- DB connectivity failure alerts

### 11.2 Operational runbook

Document:

- deploy steps
- rollback steps
- where env vars are managed
- ownership/escalation contacts

### 11.3 Rollback drill

Perform one practice rollback:

- Deploy a known-safe prior version
- Confirm app recovers quickly
- Re-promote latest version after validation

Pass criteria:

- [ ] Team can rollback without improvisation
- [ ] Mean time to recovery acceptable

---

## 12) Final Launch Gate (Go / No-Go)

Only launch if ALL are true:

- [ ] Phases 1-7 passed
- [ ] No open critical/high severity bugs
- [ ] No open critical security findings
- [ ] Owner sign-off for product, engineering, and operations

If any item is not checked, decision is automatically **No-Go**.

---

## 13) Post-Launch First 72 Hours

### 0-24h

- Monitor auth failures, 5xx, and DB errors every 2-4 hours.
- Track top user journeys manually at least twice.

### 24-48h

- Review slow endpoints and error hotspots.
- Address high-frequency user friction quickly.

### 48-72h

- Produce launch stability report:
  - uptime
  - error rates
  - top incidents
  - fixes shipped

---

## 14) AI Prompts You Can Reuse

### Prompt: Security review

```text
Review this deployment for production security issues.
Focus on session cookies, CORS, secrets management, authz boundaries, and exposed debug routes.
Return:
1) critical findings
2) high findings
3) medium findings
4) exact fixes
```

### Prompt: QA checklist execution

```text
Act as QA lead. Convert the VRMTS launch checklist into an executable test matrix.
Include: test case id, preconditions, steps, expected result, pass/fail field, severity if failed.
```

### Prompt: Go/No-Go decision

```text
Given the completed evidence for phases 1-7, provide a strict Go/No-Go recommendation.
Do not assume missing evidence is passed.
```

---

## 15) Recommended Next Improvements (After Launch)

- Add CI pipeline with automated build/test gates per PR.
- Add migration tooling instead of dump-driven schema evolution.
- Normalize SQL table naming conventions for Linux case-sensitivity safety.
- Add structured API health endpoint and synthetic monitoring.
- Add rate limiting and audit enrichment on sensitive admin routes.

---

## 16) Ownership Template

Fill this before release:

- Product Owner: `<name>`
- Engineering Owner: `<name>`
- Ops Owner: `<name>`
- Security Owner: `<name>`
- Launch Date Target: `<date>`
- Rollback Owner: `<name>`

---

If you follow this playbook strictly, you will have a measurable, auditable path to "functioning, safe, and market-ready."
