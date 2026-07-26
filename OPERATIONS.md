# SplitMates — Operations & Observability Guide

---

## 1. Application Architecture Overview

SplitMates is structured as a decoupled full-stack expense sharing application:
* **Frontend**: React + Vite SPA (deployed to Netlify / Vercel / Cloudflare Pages) with PWA manifest support (`manifest.json`) and SPA routing fallback (`_redirects`).
* **Backend**: Node.js + Express REST API (`server.js` on port `5000`) protected with `helmet`, `cors`, and `express-rate-limit`.
* **Database**: PostgreSQL managed via Prisma ORM (`@prisma/client`).

---

## 2. Health Check & Diagnostics Endpoints

### Readiness & Liveness Probes
* **Endpoint**: `GET /api/health`
* **Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-07-26T13:26:00.000Z"
}
```

---

## 3. Request Tracing & Correlation

Every request receives a unique `X-Request-ID` header generated or propagated by `requestLogger.js`.

### Log Format
```json
{
  "level": "info",
  "timestamp": "2026-07-26T13:26:00.000Z",
  "requestId": "c1f7a8b0-4e2b-45a1-b8d9-6789abcdef01",
  "method": "POST",
  "route": "/api/expenses",
  "statusCode": 200,
  "durationMs": 142
}
```

### Slow Request Warning Criteria
Any request taking longer than `1000ms` automatically logs a `[WARN: SLOW REQUEST]` diagnostic event containing the target route and timing breakdown.

---

## 4. Operational Troubleshooting Playbook

| Issue Category | Diagnostic Method | Remediation Step |
| :--- | :--- | :--- |
| **Backend Unreachable** | Check `GET /api/health` HTTP status | Verify Node.js process state and port binding (`PORT=5000`) |
| **Database Connection Failure** | Check server logs for `[Database Connection Error]` | Verify `DATABASE_URL` credentials in backend environment |
| **Authentication Failures** | Search logs for `[Auth Failed]` with `requestId` | Check client token expiry or invalid signature credentials |
| **Slow API Endpoints** | Filter logs for `[WARN: SLOW REQUEST]` | Inspect Prisma query execution time or database indexing |

---

## 5. Security & Log Hygiene

* **Zero Token Logging**: Passwords, JWT secrets, authorization headers, and database connection strings are strictly omitted from log streams.
* **Production Error Masking**: `errorHandler.js` returns generic client messages (`An unexpected server error occurred`) in production while preserving request IDs for support correlation.
