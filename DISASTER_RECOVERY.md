# SplitMates — Disaster Recovery & Deployment Rollback Guide

---

## 1. Disaster Recovery Scenarios & Playbook

### Scenario A — Frontend Deployment Failure
* **Symptom**: Blank screen, JavaScript bundle error, or static asset 404s after a frontend release.
* **Remediation**:
  1. Revert to previous stable deployment tag in Netlify / Vercel / Cloudflare Pages dashboard.
  2. Perform local verification: `git checkout <previous-commit-hash> && npm run build`.
  3. Re-deploy verified production bundle.

### Scenario B — Backend Deployment Failure
* **Symptom**: API 500 status codes or unhandled crashes on server startup.
* **Remediation**:
  1. Trigger graceful shutdown on current process (`SIGTERM`).
  2. Roll back container image or Node server release to previous release tag.
  3. Confirm server health via `GET /api/health`.

### Scenario C — Database Connection Failure or Corruption
* **Symptom**: Database query timeouts or connection refused errors in backend logs.
* **Remediation**:
  1. Verify PostgreSQL service status and `DATABASE_URL` connectivity.
  2. Restore latest valid automated backup from PostgreSQL backup storage.
  3. Validate schema and table integrity (`npx prisma migrate status`).

### Scenario D — Failed Database Migration
* **Symptom**: Migration error during `npx prisma migrate deploy`.
* **Remediation**:
  1. Immediately halt automated deployments.
  2. Inspect migration error logs without executing destructive force pushes.
  3. Apply backward-compatible forward patch migration or restore from pre-migration snapshot.

### Scenario E — Compromised Environment Secrets
* **Symptom**: Unauthorized API key usage or leaked JWT signing secret.
* **Remediation**:
  1. Immediately rotate `JWT_SECRET` and database credentials in host environment settings.
  2. Invalidate all active user sessions (requires users to log in again).
  3. Re-deploy backend with updated environment variables.

---

## 2. Controlled Database Migration & Deployment Protocol

1. **Pre-Deployment Backup**: Take automated snapshot of production PostgreSQL database.
2. **Apply Migrations**: Execute `npx prisma migrate deploy` in backend deployment environment.
3. **Deploy Services**: Update backend API service followed by frontend static assets.
4. **Health Verification**: Probe `GET /api/health` and verify HTTP 200 response.
