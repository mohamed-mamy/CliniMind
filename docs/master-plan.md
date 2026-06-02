```markdown
# CliniMind — Master Development Plan

**Version:** 1.0 (MVP)
**Status:** Ready for development
**Team:** Backend + Frontend

---

## 1. Overview

This document provides a phased, incremental execution plan for the CliniMind project. It breaks down the development into logical, shippable increments, with clear backend and frontend tasks for each phase. The plan ensures that:

- Backend and frontend teams can work in parallel after initial contract agreement.
- Each phase delivers a working, testable slice of functionality.
- Critical cross-cutting concerns (auth, RBAC, audit) are implemented early.
- Integration is continuous, not a "big bang" at the end.

---

## 2. Guiding Principles for Execution

| Principle | Application |
|-----------|-------------|
| **Contract-first** | API Contract is the single source of truth for all endpoints. Frontend mocks must match it exactly. |
| **Incremental delivery** | Each phase ends with a demonstrable feature set that can be shown to the client. |
| **Parallel-safe** | Backend and frontend can work on the same phase after the first 1-2 days of contract finalization. |
| **Backend stability gates** | Frontend integration with real API begins only after the backend declares the relevant endpoints ready. |
| **Role-based testing** | Each phase includes testing with at least the affected roles (director, doctor, receptionist, lab). |

---

## 3. Phase Breakdown

### Phase 0 — Project Setup & Shared Contracts (Day 1-2)

**Goal:** Establish development environment, shared contract validation, and baseline CI.

| Area | Tasks |
|------|-------|
| **Backend** | - Initialize Node.js + Express project.<br>- Configure MongoDB connection (Atlas or local).<br>- Implement standard response envelope middleware.<br>- Set up error handling (centralized).<br>- Configure environment variables validation.<br>- Setup linting + prettier + git hooks. |
| **Frontend** | - Initialize Vite + React + Tailwind project.<br>- Setup API client shell (axios instance with interceptors).<br>- Setup Socket.IO client skeleton.<br>- Configure environment variables (VITE_API_URL).<br>- Setup linting + prettier + git hooks. |
| **Shared** | - Create a shared Postman/Insomnia collection from API Contract.<br>- Agree on a local development orchestration (e.g., concurrently).<br>- Create seed scripts for initial users (director). |

**Definition of Done:**
- Both apps run locally (`npm run dev` for each).
- Backend responds to a health check endpoint (`GET /health`).
- Frontend shows a "Backend not available" error when API is down.
- API contract is frozen for Phase 1-3.

---

### Phase 1 — Authentication & User Management (Week 1-2)

**Goal:** Complete user identity and role management. Director can create/manage users. All roles can log in.

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `User` model (passwords in plain text, per spec).<br>- Implement `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.<br>- Implement JWT service (access 8h, refresh 7d).<br>- Implement auth middleware (verify JWT).<br>- Implement RBAC middleware with `ROLE_PERMISSIONS` map.<br>- Implement User CRUD: `POST /users`, `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id` (director only).<br>- Seed first director account via script (no API). |
| **Frontend** | - Login page (`/login`) with username/password.<br>- Authenticated layout (sidebar/header) with role-based menu.<br>- Profile page (`/profile`) to view own info and change password.<br>- User management pages (director only): list, create, edit, delete.<br>- API client integration for auth endpoints. |
| **Shared** | - Define DTOs for User (Appendix A.1).<br>- Define error codes for auth (AUTH_REQUIRED, TOKEN_EXPIRED, FORBIDDEN). |

**Integration Test:**
- Director can log in → create a doctor → doctor can log in.
- Receptionist cannot access user management route (403).
- Refresh token flow works after 8h.

**Frontend Mocking:** During backend dev, frontend uses mocks that match User DTO exactly.

---

### Phase 2 — Patient Management & Medical History (Week 3-4)

**Goal:** Full CRUD on patients, role-based field visibility, medical history for doctors.

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `Patient` model (auto‑increment `fileNumber` via counters).<br>- Implement `medical_history` model (embedded or separate collection).<br>- Implement endpoints: `POST /patients`, `GET /patients`, `GET /patients/:id`, `PUT /patients/:id`, `DELETE /patients/:id`.<br>- Implement `GET /patients/:id/history` (aggregate appointments, prescriptions, lab requests, invoices).<br>- Implement `PUT /patients/:id/medical-history` and `GET /patients/:id/medical-history` (doctor/director only).<br>- Field-level RBAC: receptionist cannot see `confidentialNotes`; lab sees only basic identity. |
| **Frontend** | - Patient list (`/patients`) with search/filter/pagination.<br>- Patient detail page (`/patients/:id`) with role‑based field hiding.<br>- Patient creation/editing form (receptionist/director).<br>- Medical history tab (doctor/director) for allergies, chronic diseases, surgeries, etc.<br>- Patient deletion (director only) with conflict warning. |
| **Shared** | - Define Patient DTO (Appendix A.2) and MedicalHistory DTO (A.3).<br>- Define error codes for patient deletion conflict (`INVALID_STATE`). |

**Integration Test:**
- Receptionist creates patient → doctor adds medical notes → receptionist cannot see notes.
- Director deletes patient with invoices → receives `INVALID_STATE`.
- Lab technician sees patient list but only name + file number.

---

### Phase 3 — Appointment Scheduling & Waiting Room (Week 5-6)

**Goal:** Complete appointment management with conflict detection and waiting room.

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `Appointment` model with compound index (doctorId, date, timeSlot) unique.<br>- Implement endpoints: `POST /appointments`, `GET /appointments`, `GET /appointments/:id`, `PUT /appointments/:id`, `PUT /appointments/:id/status`.<br>- Implement `GET /appointments/available-slots` (receptionist).<br>- Role-based filtering: doctor sees only own appointments.<br>- On appointment creation, trigger email notification (if patient has email). |
| **Frontend** | - Appointments calendar/list view (`/appointments`).<br>- Create appointment form with patient search, doctor selection, time slot picker (uses available-slots).<br>- Edit appointment (receptionist/director).<br>- Waiting room board (receptionist) with check-in and status quick‑update.<br>- Email notification indicator (toast) when appointment created. |
| **Shared** | - Define Appointment DTO (A.4).<br>- Define `CONFLICT` error for double‑booking. |

**Integration Test:**
- Receptionist books Dr. Salim for 2025-07-20 10:30 → tries same slot → receives CONFLICT.
- Doctor logs in → sees only own appointments.
- Patient with email receives appointment confirmation email (real or logged).

---

### Phase 4 — Billing & Invoicing (Week 7-8)

**Goal:** Complete financial operations: invoice creation, payment recording, PDF generation, discounts (director only).

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `Invoice` and `InvoiceItem` models (auto‑increment `invoiceNumber`).<br>- Implement endpoints: `POST /invoices`, `GET /invoices`, `GET /invoices/:id`, `POST /invoices/:id/payment`, `GET /invoices/:id/pdf`, `DELETE /invoices/:id`.<br>- Implement discount authorization: if discount > 0 and user ≠ director → `DISCOUNT_NOT_AUTHORIZED`.<br>- Automatically set invoice status (paid/unpaid/partial) based on paidAmount vs totalAmount.<br>- Audit logging for invoice deletions and discount approvals. |
| **Frontend** | - Invoice list (`/invoices`) with filters (patient, date, status).<br>- Create invoice form: add consultation (default fee) + lab tests from pending lab requests.<br>- Payment recording modal (amount, method).<br>- Invoice detail page with PDF download button.<br>- Discount field: if user is not director, discount field is disabled (with tooltip).<br>- Delete invoice button (director only). |
| **Shared** | - Define Invoice DTO (A.5).<br>- Define `DISCOUNT_NOT_AUTHORIZED` error code. |

**Integration Test:**
- Receptionist creates invoice for consultation + lab tests → total 1500 MRU.<br>- Receptionist tries to add 10% discount → backend returns 403.<br>- Director logs in, applies discount → invoice updated.<br>- Record payment → status changes to paid.<br>- Try to delete paid invoice → backend returns `INVALID_STATE`.

---

### Phase 5 — Prescriptions (Paper‑based) & Laboratory (Week 9-10)

**Goal:** Doctors prescribe electronically (printable PDF), lab technicians enter results, critical results trigger real-time alerts.

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `Prescription` and `PrescriptionDrug` models.<br>- Implement endpoints: `POST /prescriptions`, `GET /prescriptions/:id`, `GET /prescriptions/:id/pdf`.<br>- Implement `LabRequest` and `LabResult` models.<br>- Implement endpoints: `POST /lab/requests`, `GET /lab/requests`, `GET /lab/requests/pending`, `GET /lab/requests/:id`, `PUT /lab/requests/:id/results`, `GET /lab/results/critical`.<br>- Critical threshold checking (against `settings.criticalThresholds`).<br>- Socket.IO events: `lab:critical_result` (to doctor), `lab:new_request` (to lab room).<br>- Email notification for critical results. |
| **Frontend** | - Prescription creation page (`/prescriptions/new`) – doctor selects patient, adds drugs (name, dosage, duration).<br>- Prescription PDF download button.<br>- Lab request creation (doctor) – patient, tests list, priority.<br>- Lab request queue (`/lab/requests`) – lab technician sees pending, urgent first.<br>- Result entry form – per test, supports text/numeric/boolean, file attachment.<br>- Critical results list (`/lab/results/critical`) – doctor/director.<br>- Real‑time notification (toast + bell icon) when critical result arrives. |
| **Shared** | - Define Prescription DTO (A.6), LabRequest DTO (A.7).<br>- Socket.IO event payloads (matching API Contract). |

**Integration Test:**
- Doctor creates prescription → clicks PDF → browser downloads printer‑friendly PDF.<br>- Doctor orders lab tests → lab technician sees new request in real time.<br>- Lab technician enters a result outside normal range → doctor receives email + in‑app notification.<br>- Critical result appears on doctor's dashboard.

---

### Phase 6 — Expenses, Reports & Audit (Week 11-12)

**Goal:** Director can manage clinic expenses, view financial/medical reports, and audit sensitive actions.

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `Expense` model.<br>- Implement endpoints: `POST /expenses`, `GET /expenses`, `PUT /expenses/:id`, `DELETE /expenses/:id` (director only).<br>- Implement financial report aggregation: `GET /reports/financial` (revenue, expenses, profit).<br>- Implement medical report: `GET /reports/medical` (appointments, lab activity).<br>- Implement export endpoint: `GET /reports/export` (ZIP with CSV/Excel).<br>- Implement audit log listing: `GET /audit-logs` (director only). |
| **Frontend** | - Expenses page (`/expenses`) – list, create, edit, delete (director only).<br>- Financial report page (`/reports/financial`) – date range picker, charts, export buttons.<br>- Medical report page (`/reports/medical`) – similar.<br>- Audit logs page (`/audit-logs`) – filter by action/user/date. |
| **Shared** | - Define Expense DTO (A.8), AuditLog DTO (A.11).<br>- Define report data shapes (from API Contract sections 11.1, 11.2). |

**Integration Test:**
- Director records a salary expense of 15000 MRU → appears in expenses list.<br>- Director views financial report for current month → totalRevenue = sum of paid invoices, totalExpenses = 15000, netProfit = revenue - 15000.<br>- Director exports report → ZIP file downloads.<br>- Director views audit logs → sees all invoice deletions, discount approvals, etc.

---

### Phase 7 — Notifications, Settings & Dashboard (Week 13-14)

**Goal:** Real‑time notifications hub, clinic configuration, role‑specific dashboards.

| Area | Tasks |
|------|-------|
| **Backend** | - Implement `Notification` model.<br>- Implement endpoints: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.<br>- Implement `GET /settings` and `PUT /settings` (director only).<br>- Implement dashboard endpoints: `GET /dashboard/director`, `GET /dashboard/doctor`, `GET /dashboard/receptionist`, `GET /dashboard/lab`.<br>- Cron jobs: `appointmentReminder.job.js` (daily 09:00), `paymentReminder.job.js` (daily 00:00). |
| **Frontend** | - Notification center (`/notifications`) – list with unread count, mark as read.<br>- Real‑time WebSocket connection: new notification updates unread count automatically.<br>- Settings page (`/settings`) – director sees full config (SMTP, thresholds, templates); others see read‑only public settings.<br>- Role‑specific dashboards (already partially implemented in previous phases but now fully aggregated). |
| **Shared** | - Define Notification DTO (A.9), Settings DTO (A.10).<br>- Define dashboard response shapes (API Contract sections 14.1–14.4). |

**Integration Test:**
- Director updates default consultation fee → receptionist sees new fee when creating invoice.<br>- Appointment reminder cron job runs → patient with email receives reminder.<br>- Any user receives a new notification → unread count updates in real time.<br>- Lab technician logs in → dashboard shows pending request count.

---

### Phase 8 — Production Hardening & Deployment (Week 15-16)

**Goal:** Production‑ready security, performance, backup, and monitoring.

| Area | Tasks |
|------|-------|
| **Backend** | - Add rate limiting (100 req/min per IP).<br>- Add Helmet.js, CORS configured for frontend domain.<br>- Implement structured logging (Winston).<br>- Set up cron job: `backup.job.js` (daily 02:00) – MongoDB Atlas backup + Cloudinary sync.<br>- Set up `cleanup.job.js` (weekly 03:00) – delete audit logs older than 12 months.<br>- Write integration tests for critical flows (auth → patient → appointment → invoice → lab).<br>- Prepare deployment to Railway/Render (or similar). |
| **Frontend** | - Implement lazy loading for routes.<br>- Add skeleton loaders for all async operations.<br>- Run accessibility audit (keyboard navigation, screen readers).<br>- Verify responsive design on mobile (especially appointment calendar and waiting room).<br>- Production build optimization (bundle analysis, code splitting).<br>- Deploy to Vercel/Netlify. |
| **Shared** | - Set up staging environment (separate MongoDB, Cloudinary).<br>- Configure CI/CD: on push to main → run tests → deploy to staging.<br>- Create deployment runbook for production release. |

**Definition of Done for Phase 8:**
- `npm run test` passes for both backend and frontend.
- Staging deployment is live and can be used by QA.
- Backup cron job has been tested (can restore from backup).
- Rate limiting prevents abuse (tested with 101 requests in 1 minute).
- Frontend Lighthouse score ≥ 90 for Performance, Accessibility, SEO.

---

## 4. Timeline Summary

| Phase | Duration | Cumulative | Key Deliverable |
|-------|----------|------------|------------------|
| Phase 0 | 2 days | Day 2 | Working dev environment |
| Phase 1 | 2 weeks | Week 2 | Authentication + user management |
| Phase 2 | 2 weeks | Week 4 | Patient management |
| Phase 3 | 2 weeks | Week 6 | Appointments + waiting room |
| Phase 4 | 2 weeks | Week 8 | Billing + payments |
| Phase 5 | 2 weeks | Week 10 | Prescriptions + laboratory |
| Phase 6 | 2 weeks | Week 12 | Expenses + reports + audit |
| Phase 7 | 2 weeks | Week 14 | Notifications + settings + dashboards |
| Phase 8 | 2 weeks | Week 16 | Production hardening + deployment |

**Total MVP development:** 16 weeks (4 months) with two full‑stack teams (backend + frontend).

---

## 5. Parallel Work Strategy

| Phase | Backend focus | Frontend focus | Integration point |
|-------|---------------|----------------|-------------------|
| 1 | Auth + User API | Login page, user management UI | End of week 2 |
| 2 | Patient API + medical history | Patient CRUD, history tab | End of week 4 |
| 3 | Appointment API, email | Calendar, waiting room | End of week 6 |
| 4 | Invoice + payment API | Invoice forms, payment UI | End of week 8 |
| 5 | Prescription + Lab API + Socket.IO | Prescription form, lab queue, result entry | End of week 10 |
| 6 | Expense + Report + Audit API | Expenses page, reports, audit logs | End of week 12 |
| 7 | Notification + Settings + Dashboard | Notification center, settings, dashboards | End of week 14 |
| 8 | Hardening, tests, cron jobs | Performance, a11y, deployment | End of week 16 |

**Parallel rule:** Frontend can build contract‑shaped mocks for each phase while backend develops. Real API swap happens when backend signals endpoint readiness (usually mid‑phase).

---

## 6. Risk Management

| Risk | Impact | Mitigation |
|------|--------|-------------|
| Plain text passwords (security) | High | Network isolation, HTTPS only, database access restricted to app servers. Consider V2 upgrade to bcrypt. |
| No Redis in MVP | Medium | Optimize MongoDB indexes; monitor query performance. Add Redis in V2 if needed. |
| Real‑time Socket.IO connection drops | Low | Implement automatic reconnection with exponential backoff; fallback to polling every 30s for critical notifications. |
| Invoice discount authorization bypass | High | Backend must enforce `DISCOUNT_NOT_AUTHORIZED` even if frontend hides field. |
| Concurrent appointment booking | Medium | Unique index on (doctorId, date, timeSlot) + atomic insert. Conflict returns 409. |
| Backup failure | High | Monitor cron job logs; send failure alert to director email. Test restore monthly. |
| Frontend mock drift from contract | Medium | Use TypeScript interfaces generated from contract; run contract tests in CI. |

---

## 7. Definition of Done for Each Phase

Each phase is considered **complete** when:

- All planned backend endpoints are implemented, tested (unit + integration), and documented in Swagger/OpenAPI.
- All planned frontend pages are implemented, responsive, and pass contract‑based integration tests.
- The phase's critical user journey works end‑to‑end (e.g., Phase 4: create invoice → add payment → view PDF).
- No regressions in previous phases (automated regression suite).
- Code is reviewed, linted, and merged to `main`.
- Deployment to staging is successful.

---

## 8. Next Steps After MVP (V2 Considerations)

| Feature | Planned for V2 | Reason |
|---------|----------------|--------|
| Multi‑clinics (multi‑tenancy) | V2 | Requires sharding, tenant isolation, separate billing. |
| SMS / WhatsApp notifications | V2 | Additional cost, external API integration. |
| Mobile patient app | V2 | Separate frontend codebase, push notifications. |
| Redis caching | V2 | Performance > 20k patients. |
| Pharmacy inventory | V2 (optional) | Not in original MVP spec. |
| Insurance claims | V2 | Complex integration with external payers. |

---

## 9. Appendices

### A. Communication Channels

- Daily standup (15 min) – backend + frontend leads.
- Contract change review – immediate Slack + scheduled meeting if breaking.
- Demo at the end of each phase (Friday 3 PM).

### B. Environment Variables (Shared Reference)

| Variable | Used by | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | Backend | MongoDB connection |
| `JWT_SECRET` | Backend | Access token signing |
| `JWT_REFRESH_SECRET` | Backend | Refresh token signing |
| `SMTP_*` | Backend | Email sending |
| `CLOUDINARY_URL` | Backend | File uploads |
| `VITE_API_URL` | Frontend | Backend endpoint |
| `VITE_WS_URL` | Frontend | WebSocket endpoint |

### C. Cron Job Schedule (Production)

| Time | Job | Description |
|------|-----|-------------|
| 09:00 daily | appointmentReminder | Email reminders for next day's appointments |
| 00:00 daily | paymentReminder | Unpaid invoice reminders (J-7, J-3, J-1) |
| 02:00 daily | backup | MongoDB Atlas + Cloudinary sync |
| 03:00 weekly (Sunday) | cleanup | Delete audit logs > 12 months |

---

**This master plan is a living document. Update it when API contract or architecture changes significantly. Otherwise, trust the phase details for daily execution.**

--- 
*End of CliniMind Master Development Plan*
```