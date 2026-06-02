```markdown
# CliniMind — Frontend Team Plan

## 1. Purpose

This document defines the frontend team's work for **CliniMind**, enabling parallel development with the backend while strictly adhering to the agreed contracts. It does not authorize new endpoints, DTO fields, Socket.IO events, business rules, dependencies, or environment variables.

Frontend source of truth:

- API shapes, events, errors: `docs/API-Contract.md`
- System structure and modules: `docs/architecture.md`
- Cross‑team sequencing: `docs/master-plan.md` (if applicable)

## 2. Ownership

The frontend team owns:

- `clinimind-frontend/**` (or the designated frontend project folder)
- Frontend‑specific tests, UI components, and local state management
- Integration with backend via the documented API client

The frontend team must not modify backend, real‑time, or worker internals unless explicitly assigned.

## 3. Current Runtime

Run from the project root:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173   (default Vite)
```

Backend REST base URL is:

```
http://localhost:3001/v1
```

Socket.IO URL (when enabled):

```
ws://localhost:3001
```

## 4. Frontend Rules

- Use the central API client shell; do not scatter raw `fetch` logic.
- Every async screen must handle **loading**, **error**, **empty**, and **success** states.
- Mobile behaviour (responsive design) is required for each visible feature.
- Frontend mocks must match the API contract exactly and be clearly labelled as mocks.
- Do not invent DTO fields to simplify UI logic.
- Do not expose secrets in `VITE_*` (or `NEXT_PUBLIC_*`) variables.
- Do not import backend code.
- Do not implement hidden business rules in the UI; the backend remains authoritative.

### UI Component and Icon Rules

- Prefer **shadcn/ui‑style** components for reusable primitives (after approval).
- Use **lucide-react** as the default icon library.
- Use **react-icons** only for brand/platform icons missing in lucide-react.
- Do not run UI generators or add dependencies without explicit approval.
- Keep shared components accessible: semantic HTML, keyboard support, focus states, labels, sufficient contrast.
- Keep UI primitives presentation‑focused; do not embed API or business logic.

## 5. Mock Data and Backend Swap Rule

Before backend endpoints are ready, the frontend may use mocks, provided they match `docs/API-Contract.md` exactly.

**Mock rules:**

- Mock responses must use the standard envelope: `{ success, data, error, meta }`.
- Mock success data must match the documented endpoint response shape **exactly**.
- Mock errors must use documented `error.code`, `error.message`, and `error.fields`.
- Mock IDs must be 24‑hex ObjectId strings.
- Mock timestamps must be ISO 8601 UTC strings.
- Mock amounts must be integers (MRU/Ouguiya, no decimals).
- Mock phone numbers must be E.164 format (`+222...`) or local format (both accepted).
- All list endpoints use offset pagination: `page`, `limit`, `total`.
- Mock Socket.IO events must use only names and payloads defined in the API contract.
- Mock files must be clearly named or documented as mocks.

**Backend swap rule:**

- UI code must call an adapter/API‑client layer – never hardcode mock imports inside components.
- Replacing mocks with real backend calls should require changing only the data source (e.g., switching from a mock service to the API client), not rewriting screens.
- If a needed field is missing from the API contract, stop and request contract approval.

## 6. Phase‑by‑Phase Frontend Work

### Phase 1 — Authentication & Core Layout

**Deliverables**

- Login screen (`/login`) – username + password.
- Authenticated layout with role‑based redirection:
  - `director` → Director Dashboard (`/admin`)
  - `doctor` → Doctor Dashboard (`/doctor`)
  - `receptionist` → Receptionist Dashboard (`/receptionist`)
  - `lab_technician` → Lab Dashboard (`/lab`)
- Token refresh flow (silent on 401 with `TOKEN_EXPIRED`).
- Logout (revoke token, clear UI state).
- Profile screen (`/profile`) – view own info, update password.

**Parallel work allowed**

- Build static screens with contract‑matching mocks.
- Wire real API only after backend endpoints are ready.

**Do not**

- Store tokens in `localStorage` (use httpOnly cookies + memory, or secure storage).
- Hardcode role assumptions beyond token claims.
- Invent auth fields beyond the contract (no “remember me” checkbox without contract).

---

### Phase 2 — Patient Management

**Deliverables**

- Patient list page (`/patients`) with search (name, fileNumber, phone) and filters (age category, gender).
- Patient detail page (`/patients/:id`) – role‑based field visibility:
  - Doctor/Director: full patient + medical history + confidential notes.
  - Receptionist: all except `confidentialNotes`.
  - Lab technician: only basic identity + lab requests.
- Patient creation/editing form (receptionist & director) – fields from `POST /patients`.
- Medical history view/edit (doctor & director) – allergies, chronic diseases, surgeries, treatments, family history, confidential notes.
- Delete patient (director only) – with conflict message if patient has invoices/appointments/lab requests.

**Parallel work allowed**

- UI shell + paginated patient list using mocked Patient DTO.
- Form validation matching contract requirements.

**Do not**

- Allow deletion of a patient with existing records without showing backend error.
- Expose confidential notes to receptionist or lab technician.

---

### Phase 3 — Appointments & Waiting Room

**Deliverables**

- Appointments calendar/list view (`/appointments`) with role‑based data:
  - Doctor: own appointments only.
  - Receptionist/Director: all appointments, plus ability to create/update/cancel.
  - Lab technician: no access.
- Create appointment screen (receptionist/director) – patient search, doctor selection, date/time slot with availability check (`GET /appointments/available-slots`).
- Edit appointment (date, timeSlot, doctor, status, reason).
- Status quick‑update (`PUT /appointments/:id/status`) for receptionist waiting room management.
- Waiting room board (receptionist view) – today’s appointments with check‑in, status toggle.

**Parallel work allowed**

- Mock appointment list + availability slots.
- Interactive calendar UI with mock data.

**Do not**

- Allow double‑booking – respect `CONFLICT` error from backend.
- Allow doctor to edit another doctor’s appointment.

---

### Phase 4 — Billing & Payments

**Deliverables**

- Invoice list page (`/invoices`) – filter by patient, date range, status (paid/unpaid/partial).
- Create invoice (`/invoices/new`) – for consultation (default fee) and/or lab tests (from pending lab requests).
- Discount handling: if discount > 0, must be authorised by director (backend returns `DISCOUNT_NOT_AUTHORIZED` – frontend shows appropriate message).
- Payment recording (`/invoices/:id/payment`) – amount, method (cash, card, transfer).
- Invoice detail page (`/invoices/:id`) – show items, payments, remaining amount.
- PDF download (trigger `/invoices/:id/pdf`).
- Delete invoice (director only) – with warning about payments.

**Parallel work allowed**

- Mock invoice creation form with mock lab tests.
- Mock payment UI.

**Do not**

- Calculate total or remaining amount on frontend – always use backend values.
- Allow payments exceeding remaining amount – backend will reject with `VALIDATION_ERROR`.
- Allow non‑director to apply discounts without backend authorisation.

---

### Phase 5 — Prescriptions & Laboratory

**Deliverables**

- Prescription creation (`/prescriptions/new`) – doctor only – select patient, add drugs (name, dosage, duration, instructions), free‑text notes.
- Prescription PDF download (`/prescriptions/:id/pdf`).
- Lab request list (`/lab/requests`) – role‑based filtering:
  - Doctor: own requests.
  - Lab technician: all pending/in_progress.
  - Director: all requests.
- Create lab request (doctor) – patient, tests list, priority (normal/urgent).
- Lab request detail page (`/lab/requests/:id`) – show request + results (if any).
- Result entry (lab technician) – per test: text/numeric/boolean result, unit, normal range, optional attachment. After submission, backend marks request as `completed` and sends critical alerts.
- Critical results list (`/lab/results/critical`) – doctor/director view.

**Parallel work allowed**

- Mock prescription form and PDF preview.
- Mock lab request queue and result entry UI.

**Do not**

- Implement stock checking or pharmacy dispensing (out of MVP scope).
- Allow lab technician to modify patient medical data.
- Assume email is always sent – rely on backend notification.

---

### Phase 6 — Expenses, Reports & Audit

**Deliverables**

- Expenses management (`/expenses`) – director only:
  - List with filters (category, date range).
  - Create/edit/delete expense (category, amount, description, date, receipt URL optional).
- Financial report (`/reports/financial`) – director – period selector, show revenue, expenses, profit, unpaid invoices, charts.
- Medical report (`/reports/medical`) – director – appointments, no‑show rate, top diagnoses, lab activity.
- Export buttons (Excel/PDF) for reports.
- Audit logs (`/audit-logs`) – director only – filter by action, user, date range.

**Parallel work allowed**

- Mock expense list and expense form.
- Mock charts using static data.

**Do not**

- Calculate profit or any aggregated value on frontend – always display from `/reports/*`.
- Expose expense or audit data to non‑director roles.

---

### Phase 7 — Role‑specific Dashboards

**Deliverables**

- **Director dashboard** (`/admin`) – stats (today revenue, appointments, monthly profit, pending appointments, unpaid invoices, critical results unread), recent appointments, recent expenses.
- **Doctor dashboard** (`/doctor`) – today’s agenda, pending lab results, unread notifications, recent patients seen.
- **Receptionist dashboard** (`/receptionist`) – today’s appointments, checked‑in count, waiting room queue, recent invoices.
- **Lab technician dashboard** (`/lab`) – pending requests (with urgent first), completed today counts.

**Parallel work allowed**

- Mock each dashboard using contract‑shaped data (see `GET /dashboard/*` endpoints).
- Skeleton loaders for stats.

**Do not**

- Hardcode role‑specific logic – derive from auth context and route.
- Poll dashboards aggressively – respect backend rate limits.

---

### Phase 8 — Notifications & Realtime

**Deliverables**

- Notification centre (`/notifications`) – list with pagination, unread count, mark as read (single/all).
- Real‑time updates via Socket.IO:
  - New notification → update unread count + toast.
  - Critical lab result → real‑time alert (doctor dashboard).
  - New lab request → real‑time alert (lab technician).
- Email notifications (frontend only displays that they were sent – no extra UI).

**Parallel work allowed**

- Mock notification list UI.
- Socket.IO client integration with mocked server events.

**Do not**

- Implement any notification triggering logic on the frontend.
- Assume real‑time is available – fallback to polling (if contract allows) or show “reconnect” UI.

---

### Phase 9 — Settings & System Configuration

**Deliverables**

- Settings page (`/settings`) – director only:
  - Clinic information (name, address, phone, email, logo).
  - Default consultation fee.
  - SMTP configuration (host, port, user, pass – masked).
  - Critical thresholds (e.g., glycemia min/max/unit).
  - Notification templates preview.
- Read‑only public settings for other roles (only clinic name, logo, default fee).

**Parallel work allowed**

- Mock settings form with validation.

**Do not**

- Expose SMTP password or other secrets in plain text – backend must mask them.
- Allow non‑director to modify any setting.

---

### Phase 10 — Production Hardening

**Deliverables**

- Accessibility pass (keyboard navigation, screen reader labels, focus management).
- Responsive/mobile pass (especially dashboard, POS‑like screens, appointment calendar).
- Performance pass: lazy loading routes, optimising re‑renders.
- Empty/error/loading state consistency across all pages.
- Production build verification (`npm run build`).
- Environment variable audit (no secrets exposed).
- Role‑based route guarding (protect routes using middleware).

## 7. Frontend Definition of Done

- Uses documented API/event contracts only.
- Mock data, if used, matches `docs/API-Contract.md` exactly and is swappable via the API client layer.
- Handles **loading**, **error**, **empty**, and **success** states.
- Mobile layout reviewed.
- No backend imports.
- No secret exposure.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass (when applicable).
- Role‑based access control is enforced on routes and UI elements.

---

_This frontend plan is a living document. Update it only when the API contract or architecture changes, and always keep it in sync with the backend team._
```