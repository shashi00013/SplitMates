# SplitMates — Scalability & Growth Operations Architecture

---

## 1. Scalability Architecture & Benchmarks

SplitMates is designed for high-concurrency expense resolution with zero-sum financial invariants:
* **Stateless API Tier**: Node.js Express controllers run statelessly and can be horizontally scaled behind a load balancer (AWS ALB / NGINX / Cloudflare).
* **Database Indexing**: Prisma database schema enforces composite indexing on high-frequency query paths (`[groupId, settled]`, `[groupId, status]`, `[userId, read]`).
* **Integer-Cent Financial Calculation**: All calculations derive from raw expenses dynamically without manual state mutation drift, operating at $O(N)$ speed per group expense array.

---

## 2. Growth Consideration & Future Milestones

| Scalability Horizon | Volume Threshold | Recommended Architecture Enhancement |
| :--- | :--- | :--- |
| **Stage 1 (Current)** | $< 100,000$ Expenses | Single PostgreSQL instance with composite indexes & in-memory React memoization |
| **Stage 2 (Growth)** | $100,000 - 1,000,000$ Expenses | Add cursor-based pagination (`/api/expenses?cursor=...`) & Redis caching for user profiles |
| **Stage 3 (Enterprise)**| $> 1,000,000$ Expenses | PostgreSQL read-replicas for balance queries & background queue (BullMQ) for notifications |

---

## 3. Financial Invariant Verification Under Load

* **Zero-Sum Conservation**: For any expense count $N$, $\sum \text{Member Net Balances} \equiv 0.00$.
* **Idempotency**: Repeat API requests do not duplicate settlement records or double-count expense shares.
