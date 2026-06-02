```markdown
# CliniMind – AI Workflow

## 1. Purpose

This is the AI operating manual for **CliniMind**, a medical clinic management platform.  
The workflow is intentionally simple, safe, and contract‑first:

```text
Orchestrator → Build → Review/Security → User approval / PR
```

There are no separate frontend/backend AI agents in the default workflow.

- **Orchestrator** reads docs, scopes the task, protects business rules and data integrity.
- **Build Agent** implements only the approved scoped work (backend, frontend, infra, or docs).
- **Review/Security Agent** performs read‑only checks before merge or handoff.

All work must respect the API contract, architecture decisions, and the phased master plan.

---

## 2. Agent Roles

| Agent               | Responsibility                                                                                 |
|---------------------|------------------------------------------------------------------------------------------------|
| **Orchestrator**    | Reads `master-plan.md`, `architecture.md`, `API-Contract.md`. Determines phase, scope, allowed files, and whether work can proceed. Escalates risky or out‑of‑scope requests. |
| **Build Agent**     | Implements only the approved scoped work. May touch backend, frontend, infra, or docs. Must follow contract, architecture rules, and phase handshake conditions. |
| **Review/Security** | Read‑only review for scope drift, contract compliance, RBAC, financial logic (invoices/discounts), stock‑like safety (lab critical thresholds), employee permissions (roles), audit logging, test coverage. |

---

## 3. Orchestrator Workflow

1. Read `master-plan.md`, `architecture.md`, and the relevant section of `API-Contract.md`.
2. Identify the **current phase** (0–8) from the master plan.
3. Classify the task:
   - `auth | user | patient | appointment | billing | prescription | laboratory | expense | report | notification | setting | audit | cron | infra`
4. Check dependencies and blockers (e.g., phase handshake not completed, missing API contract).
5. Define **exact scope**, referencing specific endpoints, UI pages, or business rules.
6. List **allowed files** and **forbidden files** (e.g., no touching `billing` during a `laboratory` task unless explicitly allowed).
7. Confirm whether API changes, schema changes, new dependencies, env vars, or cron jobs are allowed.
8. Assign the work to **Build** only when scope is safe and within the current phase.
9. Send **risky work** (invoice discount logic, lab critical thresholds, audit log deletions, expense modifications, RBAC changes) to **Review/Security** before final handoff.
10. Summarise changed files and verification steps required for the phase handshake.

---

## 4. Build Agent Rules

Build may work on backend, frontend, infra, or documentation, **only inside the Orchestrator‑approved scope**.

### Must do:

- Read `master-plan.md`, `architecture.md`, `API-Contract.md`, and the phase’s handshake checklist.
- Restate the task scope and the current phase before editing.
- List planned files before code edits (e.g., `src/modules/patient/patient.service.js`, `src/pages/patients/PatientList.jsx`).
- Keep changes minimal and reviewable — one PR = one task or one module slice.
- Follow the API contract exactly (endpoints, DTOs, error codes, response envelopes).
- Follow architecture business rules exactly (e.g., age category instead of birth date, plain‑text passwords, no pharmacy stock).
- Use the central API client on frontend; never call backend directly with raw `fetch`.
- Keep backend business logic in services, not in controllers or routes.
- Add or update tests when the testing infrastructure exists (integration tests for critical flows).
- Stop immediately if another module or file outside scope is needed — escalate to Orchestrator.

### Must not:

- Invent endpoints, DTO fields, query params, error codes, Socket.IO events, env vars, dependencies, scripts, database fields, or business rules.
- Change API contract, schema, RBAC rules, invoice discount logic, lab critical thresholds, expense rules, or audit log retention without approval.
- Add tooling, dependencies, package files, CI steps, env files, scaffolding, or provider config without approval.
- Mix unrelated refactors, formatting changes, or features from different phases.
- Store uploads, sessions, secrets, or durable state on API/worker filesystems (use Cloudinary or database only).
- Modify the `totalAmount` of an invoice after payment without explicit director approval and audit trail.
- Store passwords hashed – per specification, passwords **must be stored in plain text** (no bcrypt). This is an explicit client requirement.

---

## 5. Review/Security Workflow

Review/Security is **read‑only** unless explicitly asked to fix.

### Review must check:

- **Scope drift** – changes outside the Orchestrator‑approved files or phase.
- **API contract compliance** – request/response shapes match `API-Contract.md`.
- **Standard response envelope** – `{ success, data, error, meta }`.
- **Auth & RBAC** – JWT expiration (8h access / 7d refresh), role checks (director vs doctor vs receptionist vs lab_technician). Ensure plain‑text passwords are never exposed in responses.
- **Invoicing & discounts** – discount authorised only for director; discount field disabled in frontend for others but **backend must enforce** `DISCOUNT_NOT_AUTHORIZED`. Invoice deletion only for unpaid invoices (director only).
- **Laboratory critical results** – threshold check against `settings.criticalThresholds`, automatic `lab:critical_result` event + email to doctor.
- **Prescriptions** – no stock or pharmacy link; PDF generation must not alter any inventory.
- **Expenses** – only director can create/update/delete; each modification logged in audit.
- **Audit logging** – sensitive actions: invoice deletion, discount approval, expense modification, role change, patient deletion, password change.
- **Notifications** – in‑app + email only (no SMS/WhatsApp in MVP). Critical lab results and appointment reminders trigger correct channels.
- **Cron jobs** – idempotent, no duplicate notifications, respect time windows (appointment reminders 09:00 daily, payment reminders 00:00 daily).
- **Test gaps** – missing integration tests for critical flows (login → patient → appointment → invoice → lab).

### Output format:

1. **Findings first**, ordered by severity (high → medium → low), with file/line references when possible.
2. **Open questions** for unclear intent or missing contract details.
3. **Residual risk summary** (e.g., “plain‑text passwords – network isolation and HTTPS are mandatory”).
4. Do not rewrite code unless separately requested.

---

## 6. Anti‑Hallucination Rules

Before using any **endpoint, DTO field, error code, pagination rule, idempotency behaviour, or Socket.IO event**:

1. Locate it in `docs/API-Contract.md` (or the shared contract document).
2. If it is missing, treat it as **unavailable**.
3. Ask for contract approval instead of inventing it.
4. Verify final changes do not contain undocumented fields or behaviours.

Before applying any **business rule** (age category mapping, discount authorisation, lab critical threshold, expense aggregation, daily summary):

1. Locate it in `docs/architecture.md` or `docs/master-plan.md`.
2. If unclear (e.g., “how is age category derived?” → must be explicitly stored, not computed from birth date), stop and ask.
3. Do not silently choose between conflicting rules — escalate to Orchestrator.

---

## 7. Critical Escalation Rules

Stop and escalate immediately when the task touches or changes:

- API contract or DTOs (any endpoint, request/response shape).
- Database schema, indexes, or validation rules.
- Auth/RBAC/JWT/session behaviour (including plain‑text password storage).
- Invoice discount logic or `remainingAmount` calculation.
- Lab critical threshold logic or alerting (Socket.IO + email).
- Prescription PDF generation (must not introduce pharmacy or stock fields).
- Expense deletion or modification (audit trail required).
- Real‑time Socket.IO rooms or events (`lab:critical_result`, `lab:new_request`, `appointment:reminder`).
- Audit log filtering or retention (cron cleanup).
- Cron job scheduling or idempotency.
- Environment variables, secrets, package files, dependencies, or scaffold.

---

## 8. PR and Task Size Rules

- One PR = one task or one module/feature slice from the master plan.
- Keep critical flows split (e.g., lab request UI in one PR, lab result entry in another, but they must handshake via API contract).
- Contract/schema changes must be isolated in their own PR and approved by both backend and frontend leads.
- No broad rewrites of existing modules unless explicitly requested.
- No formatting‑only churn mixed with logic changes.

---

## 9. Prompt Templates

### Build Task

```md
Task: <name>
Phase: <0–8>
Type: <auth | user | patient | appointment | billing | prescription | laboratory | expense | report | notification | setting | audit | cron | infra>
Read first:
- master-plan.md (current phase handshake)
- architecture.md (relevant module section)
- API-Contract.md (relevant endpoints)
- (if frontend) frontend-plan.md

Scope:
- <exact behaviour, endpoints, or UI components>

Allowed files:
- <paths>

Forbidden files:
- <paths>

Rules:
- No API/schema/env/dependency changes unless explicitly approved.
- Keep changes minimal.
- Stop if scope expands.

Acceptance criteria:
- <list, including handshake checkpoint items>

Before editing:
- Restate scope and phase.
- List planned files.
```

### Review/Security Task

```md
Review this change as read-only.
Focus: scope, API contract, RBAC, invoice/discount logic, lab critical thresholds, expense integrity, audit logs, notifications, test coverage.
Output: findings first by severity with file/line refs, then open questions, then residual risk summary.
```

---

## 10. Handshake Enforcement for Phases

The Orchestrator must **not** assign work from Phase N+1 until the handshake checkpoint for Phase N is verified and signed off (as defined in `master-plan.md`).  
Build must not implement endpoints or UI for a future phase unless explicitly approved as “spike” or “prototype” with a clear rollback plan.

---

## 11. First‑Time Setup (MVP Installation)

For the initial deployment, the Orchestrator may approve a one‑time task to seed the **first director user**.  
This task must:

- Use a script that runs only once (check for existing users).
- Store password **in plain text** (per architecture – no hashing).
- Not expose the seed endpoint via the API.
- Be removed or disabled after successful seeding.

No other “auto‑creation” of users is allowed — all employees are created by a director via `POST /users`.

---

## 12. CliniMind‑Specific Module Rules (Extract from Architecture)

| Module               | Critical Business Rule                                                                                       |
|----------------------|--------------------------------------------------------------------------------------------------------------|
| **User**             | Passwords stored in plain text. Roles: `director`, `doctor`, `receptionist`, `lab_technician`.               |
| **Patient**          | Age category stored (not birth date). Confidential notes only visible to doctor/director.                   |
| **Appointment**      | Unique index on `(doctorId, date, timeSlot)`. Email notification sent only if patient has email.            |
| **Billing**          | Discounts require director role. Invoice number auto‑incremented. Status = paid/unpaid/partial.              |
| **Prescription**     | Paper‑only – no stock, no dispensation. PDF generation from stored data.                                   |
| **Laboratory**       | Critical result → Socket.IO event `lab:critical_result` + email. Thresholds from `settings`.                |
| **Expense**          | Director only. Each expense appears in financial reports (revenue − expenses = profit).                     |
| **Notification**     | Only in‑app + email. No SMS/WhatsApp in MVP.                                                                |
| **Audit**            | Logs kept for 12 months, then cleaned by weekly cron.                                                       |
| **Cron**             | Appointment reminders (09:00 daily), payment reminders (00:00 daily), backup (02:00 daily), cleanup (03:00 weekly). |

---

## 13. Escalation Examples (Non‑Exhaustive)

- Any attempt to add `birthDate` to the Patient model → escalate. Age category is explicit.
- Any attempt to hash passwords → escalate (plain text is a client requirement, not a mistake).
- Any change to discount authorisation logic → escalate.
- Any new Socket.IO event not in API Contract → stop and ask.
- Any modification of an invoice after payment without director approval → escalate.

---

This AI workflow is the authoritative guide for any AI agent working on **CliniMind**. When in doubt, stop and ask the Orchestrator.

```