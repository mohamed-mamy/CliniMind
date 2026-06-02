# CliniMind Backend Team Plan

## 1. Purpose

This document lets the backend team work in parallel with frontend while protecting API contracts, business rules, data integrity, and security. It does not override the API contract or architecture document.

**Backend source of truth:**

- Wire contracts: `docs/API-Contract.md` (53 REST endpoints).
- Business/data/security rules: `docs/architecture.md`.
- Cross-team sequencing and phase order: `docs/master-plan.md` (if exists, otherwise inferred from this document).

## 2. Ownership

**Backend owns:**

- `backend/src/**` (Node.js + Express monolith)
- `backend/src/socket/**` (Socket.IO server)
- `backend/src/jobs/**` (cron jobs)
- Backend tests (unit + integration)
- Shared TypeScript types in `shared/types/**` after coordination with frontend.

**Backend must not edit frontend UI** unless explicitly assigned.

## 3. Current Runtime

Run full stack from repository root:

```bash
npm run dev
```

Backend‑only runtime:

```bash
npm run dev:backend
```

**Local dependencies:**

```text
MongoDB: MongoDB Atlas via MONGODB_URI, database `clinimind`
Redis (optional, for caching): redis://localhost:6379 (MVP without Redis – optional)
```

## 4. Backend Rules

- **Controllers stay thin:** request parsing, service call, response formatting only.
- **Business rules belong in services.**
- **Models own schema definitions, indexes, and atomic updates.**
- All responses use `{ success, data, error, meta }` unless the endpoint returns `204 No Content`.
- Error codes must match Appendix B of API contract.
- Permissions come from central `ROLE_PERMISSIONS` evaluated at request time (director, doctor, receptionist, lab_technician).
- Never trust JWT payload alone for sensitive authorization when fresh DB state is required (e.g., role checks, invoice ownership).
- Do not store uploads, secrets, or durable state on the API filesystem – use Cloudinary for receipts, lab attachments, logos.
- Do not invent endpoints, DTO fields, schema fields, env vars, dependencies, or business rules beyond the API contract and architecture document.

## 5. Contract Compatibility Rule

The backend team must implement the exact structure in `docs/API-Contract.md` so the frontend can replace contract‑shaped mocks with real API calls without rewriting screens.

**Compatibility rules:**

- Every implemented endpoint path, method, auth requirement, role requirement, request body, query param, response body, error code, and pagination shape must match the API contract.
- Every response must use `{ success, data, error, meta }` unless contract documents `204 No Content`.
- Error responses must use documented codes and the `fields` object for validation errors.
- `ObjectId` values are 24‑hex strings.
- Timestamps are ISO 8601 UTC strings.
- Amounts are integers (MRU/Ouguiya – no decimals).
- `ageCategory` is one of the eight predefined string values.
- Pagination is offset‑based (`page`, `limit`, `total`) for all list endpoints (no cursor pagination in MVP).
- `/dashboard/*` endpoints return the exact aggregated shapes.
- Socket.IO events follow the contract: `notification:new`, `lab:critical_result`, `lab:new_request`, `appointment:reminder`.

**Frontend handoff rule:**

- When an endpoint is complete, provide the frontend team with: endpoint name, auth/role requirement, success shape example, supported error codes, and any test credentials or seed data.
- If backend behaviour cannot match the contract, stop and request contract clarification before continuing.

## 6. Phase‑by‑Phase Backend Work

### Phase 1 — Identity & Accounts (MVP Foundation)

**Deliverables:**

- User model (`users` collection) with indexes on `username` (unique), `role`, `isActive`.
- Authentication: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- JWT generation: access token **8 hours**, refresh token **7 days** (stored in DB – refresh token collection or dedicated field).
- Auth middleware and RBAC (director, doctor, receptionist, lab_technician).
- User management (director only): `POST /users`, `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`.
- **Critical rules:**
  - Passwords stored in **plain text** (per specification – no hashing).
  - First director account seeded during installation; cannot be created via API.
  - Refresh token rotation: revoke old refresh token on logout and token refresh.
  - Changing a user’s password invalidates all refresh tokens for that user.
  - Deleting own account is forbidden (`INVALID_STATE`).
- **Review / Security required.**

---

### Phase 2 — Patient Management & Medical History

**Deliverables:**

- Patient CRUD: `POST /patients`, `GET /patients`, `GET /patients/:id`, `PUT /patients/:id`, `DELETE /patients/:id`.
- Patient history: `GET /patients/:id/history` (aggregates appointments, prescriptions, lab requests, invoices).
- Medical history: `PUT /patients/:id/medical-history`, `GET /patients/:id/medical-history`.
- **Critical rules:**
  - `fileNumber` auto‑incremented via counters collection.
  - `ageCategory` is a dropdown – no date of birth.
  - Field‑level access: receptionists cannot see `confidentialNotes`; lab technicians see only basic patient identity.
  - Deleting a patient fails (`INVALID_STATE`) if patient has appointments, invoices, or lab requests.
  - Medical history updates are logged in audit trail.

---

### Phase 3 — Appointment Scheduling

**Deliverables:**

- Appointment CRUD: `POST /appointments`, `GET /appointments`, `GET /appointments/:id`, `PUT /appointments/:id`, `PUT /appointments/:id/status`.
- Availability check: `GET /appointments/available-slots`.
- **Critical rules:**
  - Conflict check: `doctorId` + `date` + `timeSlot` must be unique (compound index).
  - Only receptionist or director can create/update appointments (doctors read‑only own appointments).
  - Status transitions: `scheduled → confirmed → completed | cancelled | no_show`.
  - When an appointment is created, send email notification if patient has email (via notification service).
  - `waitingRoomPosition` is set by receptionist when patient checks in (optional, not in MVP endpoints but stored in model).
- **Cron job prep:** `appointmentReminder.job.js` (phase 6) will use this collection.

---

### Phase 4 — Billing & Invoicing

**Deliverables:**

- Invoice creation: `POST /invoices`.
- Invoice listing: `GET /invoices`.
- Invoice details: `GET /invoices/:id`.
- Payment recording: `POST /invoices/:id/payment`.
- PDF generation: `GET /invoices/:id/pdf`.
- Invoice cancellation (director only): `DELETE /invoices/:id`.
- **Critical rules:**
  - `invoiceNumber` auto‑incremented via counters collection.
  - `totalAmount` = sum of `items[].total`.
  - `remainingAmount` = `totalAmount - paidAmount`.
  - Discount only allowed for director (`DISCOUNT_NOT_AUTHORIZED` error for others).
  - Once `paidAmount >= totalAmount`, status becomes `paid` and further payments are rejected.
  - Deleting an invoice (`DELETE /invoices/:id`) is only possible if `paidAmount === 0` (no payments recorded).
  - All invoice actions are logged in `user_logs` (audit).
- **Integration:** Invoices can reference lab requests (`referenceId` in `items`).

---

### Phase 5 — Prescriptions (Paper‑Based)

**Deliverables:**

- Prescription creation: `POST /prescriptions`.
- Prescription details: `GET /prescriptions/:id`.
- PDF generation: `GET /prescriptions/:id/pdf`.
- **Critical rules:**
  - No inventory, no dispensation – purely historical and printable.
  - Drugs stored as embedded array in `prescription_drugs` collection.
  - PDF format must be printer‑friendly (handed to patient).

---

### Phase 6 — Laboratory Module

**Deliverables:**

- Lab request creation: `POST /lab/requests`.
- Lab request listing: `GET /lab/requests`, `GET /lab/requests/pending`.
- Lab request details: `GET /lab/requests/:id`.
- Result entry: `PUT /lab/requests/:id/results`.
- Critical results list: `GET /lab/results/critical`.
- **Critical rules:**
  - When results are entered, check each test against `criticalThresholds` in `settings`.
  - If critical → set `isCritical = true` → emit Socket.IO event `lab:critical_result` to doctor’s room + send email.
  - Status transitions: `pending → in_progress → completed`.
  - Only lab technicians can enter results.
  - Lab requests can be linked to invoice items (billing integration).
- **Socket.IO rooms:** `doctor:{doctorId}`, `lab`.

---

### Phase 7 — Expenses (Director Only)

**Deliverables:**

- Expense CRUD: `POST /expenses`, `GET /expenses`, `PUT /expenses/:id`, `DELETE /expenses/:id`.
- **Critical rules:**
  - Categories: `salary`, `rent`, `utilities`, `supplies`, `maintenance`, `other`.
  - Receipts uploaded to Cloudinary (optional).
  - Expenses are included in financial reports (subtracted from revenue for net profit).

---

### Phase 8 — Reports & Analytics

**Deliverables:**

- Financial report: `GET /reports/financial` (revenue, expenses, profit, unpaid invoices).
- Medical report: `GET /reports/medical` (appointments, lab requests, critical results).
- Export endpoint: `GET /reports/export` (ZIP with CSV/Excel).
- **Critical rules:**
  - Date‑range filtering required for all reports.
  - Use MongoDB aggregation pipelines for performance.
  - Return data as JSON by default; `?format=excel` or `?format=pdf` triggers file generation.
  - Only director can access reports.

---

### Phase 9 — Notifications & Real‑Time

**Deliverables:**

- Notification endpoints: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- Socket.IO server with rooms: `user:{userId}`, `doctor:{doctorId}`, `lab`.
- Events:
  - `notification:new` – generic in‑app notification.
  - `lab:critical_result` – critical lab result (to doctor).
  - `lab:new_request` – new lab request (to lab room).
  - `appointment:reminder` – appointment reminder (to patient's user room – if patient has user account; MVP only to doctor/receptionist).
- **Notification triggers (internal):**
  - Low stock? (Not applicable – no pharmacy)
  - Critical lab result → automatic.
  - New lab request → automatic to `lab` room.
  - Appointment created/reminded → email + in-app.
- **Cron jobs for notifications:**
  - `appointmentReminder.job.js` (daily at 09:00) – sends reminders for next day's appointments.
  - `paymentReminder.job.js` (daily at 00:00) – reminds for unpaid invoices (J-7, J-3, J-1).

---

### Phase 10 — Dashboard & Settings

**Deliverables:**

- Director dashboard: `GET /dashboard/director`.
- Doctor dashboard: `GET /dashboard/doctor`.
- Receptionist dashboard: `GET /dashboard/receptionist`.
- Lab technician dashboard: `GET /dashboard/lab`.
- Settings: `GET /settings`, `PUT /settings` (director only).
- **Critical rules:**
  - Dashboard aggregations must be efficient – use MongoDB aggregation pipelines with indexes on `createdAt`, `userId`, `doctorId`.
  - Caching optional (Redis) with 5‑minute TTL if Redis is available.
  - `settings` collection holds clinic info, SMTP config, critical thresholds, default consultation fee, notification templates.

---

### Phase 11 — Audit Logs & Cron Jobs (Production Hardening)

**Deliverables:**

- Audit log listing: `GET /audit-logs` (director only).
- Cron jobs:
  - `appointmentReminder.job.js` – daily 09:00.
  - `paymentReminder.job.js` – daily 00:00.
  - `backup.job.js` – daily 02:00 (MongoDB Atlas backup + Cloudinary sync).
  - `cleanup.job.js` – weekly 03:00 (delete audit logs older than 12 months).
- Structured logging (Winston or Pino) with request IDs.
- Integration tests for critical flows:
  - Login → create patient → create appointment → create invoice → record payment → cancel invoice (director).
  - Lab request → result entry → critical notification.
- Staging/production readiness checklist (environment variables, MongoDB indexes, backup plan).

---

## 7. Backend Definition of Done

- Endpoint exists in API contract before implementation.
- Implemented structure matches the contract so frontend mocks can be swapped without UI rewrites.
- Business rule exists in architecture document before implementation.
- Response envelope and error codes are compliant.
- Validation is centralised (Zod or Joi schemas) and tested.
- Services hold business logic; controllers are thin.
- Critical modules (auth, billing, lab, stock-less) have passed internal security review.
- `npm run lint`, `npm run typecheck`, focused tests, and `npm run build` pass.
- For each completed endpoint, frontend team receives a handoff note (endpoint name, auth, example response, known errors).

---

**This document is the backend team’s working plan. Any deviation from API contract or architecture must be discussed and approved before code is written.**