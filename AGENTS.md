```markdown
# AGENTS.md – ShopManager AI Governance

> **Purpose:** Define strict rules for AI agents contributing to ShopManager.  
> **Enforcement:** These rules override any conflicting instruction. Violations must be escalated.

---

## 1. Governance Principles

| Principle | Rule |
|-----------|------|
| **Contract first** | API-Contract.md is immutable without explicit approval from both backend and frontend teams. |
| **Architecture authority** | architecture.md defines system structure, data models, and business rules. No deviation. |
| **Infrastructure lock** | infra-plan.md governs runtime, ports, services, and deployment. No containers without approval. |
| **Plan compliance** | backend-plan.md and frontend-plan.md are the only execution guides for each team. |
| **No hidden logic** | All business rules must be in backend services. Frontend never implements business rules. |
| **Secrets zero‑trust** | Never generate, log, or expose secrets. Use env vars only. |

---

## 2. Allowed Actions (AI can do without asking)

- Read any document in `docs/` (architecture, API contract, infrastructure, plans).
- Implement endpoints **exactly** as defined in API-Contract.md.
- Write unit / integration tests that validate contract compliance.
- Run `npm run dev`, `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Add internal helper functions / utilities **if** they do not change external behaviour.
- Suggest improvements via issues / pull requests – but never self‑merge.
- Use the exact DTOs, error codes, and pagination shapes from the contract.
- Follow the phase order defined in backend‑plan.md and frontend‑plan.md.

---

## 3. Forbidden Actions (AI must never do)

| Category | Forbidden Action |
|----------|------------------|
| **API Contract** | Add, remove, or modify any endpoint, field, error code, or response shape. |
| **Data Models** | Change MongoDB schema, indexes, or relationships without approval. |
| **Business Rules** | Implement stock logic, debt calculation, permissions, or notifications differently from architecture.md. |
| **Secrets** | Hardcode any secret, token, or password. Commit `.env` files. |
| **Filesystem** | Store uploads, logs, or application state on local disk (except temp test files). |
| **Containers** | Create Dockerfiles, docker-compose, or Makefile orchestration. |
| **Frontend logic** | Embed business rules (pricing, stock validation, debt calculation) in React components. |
| **Environment** | Assume production‑only variables exist locally. Always use `.env.example` placeholders. |
| **Escalation bypass** | Merge changes that affect the contract, schema, or deployment without a human review. |

---

## 4. Escalation Rules (when AI must stop and ask)

Escalate immediately if you need to:

1. **Change API‑Contract.md** – any addition, removal, or modification.
2. **Add a new endpoint** – not already documented.
3. **Add a new environment variable** – beyond those listed in infra-plan.md §11.
4. **Modify database schema** – new collection, new field, new index, changed relationship.
5. **Introduce a new service** – Redis, BullMQ, another database, external API.
6. **Change deployment topology** – ports, runtime processes, load balancing.
7. **Modify business rules** – stock decrement logic, debt transaction rules, permission matrix, invoice numbering.
9. **Implement push notifications (FCM)** – explicitly marked V2 in MVP.
10. **Change authentication mechanism** – JWT flow, token lifetimes, refresh rotation.

**How to escalate:** Open a draft PR or issue with the proposed change, tag `@tech-lead`, and wait for written approval before writing code.

---

## 5. Safety Constraints (always enforced)

| Constraint | Description |
|------------|-------------|
| **Atomic stock updates** | Use `findOneAndUpdate` with quantity check. Never decrement in two steps. |
| **Transaction for money** | Sale creation, debt update, and invoice cancellation must use MongoDB transactions. |
| **Idempotency** | `DELETE /sales/:id` must be idempotent. Cron jobs must not duplicate notifications. |
| **Input validation** | All request bodies validated with Zod. Never trust client data. |
| **Role enforcement** | Every protected endpoint checks `req.user.role`. Admin cannot be created via API. |
| **Logging** | JSON logs to stdout. Never log tokens, passwords, or FCM secrets. |
| **Frontend mock swap** | UI must use an API client layer. Replacing mocks with real calls must not require screen rewrites. |
| **Backward compatibility** | Any change to a response field must be additive and optional. |
| **Staging parity** | Staging must use the same environment variables and services as production (except sandbox credentials). |

---

## 6. Documentation Synchronisation

Any change that affects behaviour must update **all** relevant documents in the same PR:

- `API-Contract.md` – if endpoint shape changes.
- `architecture.md` – if data model or business rule changes.
- `infra-plan.md` – if ports, services, or environment changes.
- `backend-plan.md` / `frontend-plan.md` – if team responsibilities or phase order changes.
- `README.md` – if developer workflow changes.

> **Rule:** No document may lag behind implementation. A PR that introduces a behavioural change without updating the corresponding `.md` files will be rejected.

---

## 7. AI Handoff Protocol

When you complete a task that another AI (or human) will continue:

1. Leave a clear comment in the PR stating which constraints were respected.
2. If you deviated temporarily (e.g., mock data), mark it with `// TODO: replace with real API call – contract §X.Y`.
3. List any open questions or required approvals.
4. Never assume future changes – keep the change minimal and contract‑compliant.

---

**This AGENTS.md supersedes all prior instructions.  
Violations must be reported to `@tech-lead` immediately.**
```