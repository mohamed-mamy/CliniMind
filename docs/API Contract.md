# CliniMind — API Contract

**Frontend ↔ Backend communication spec**  
Companion document to architecture.md  
Version 1.0 — MVP

---

## Table of Contents

1. Conventions
2. Auth — 4 endpoints
3. Users — 5 endpoints
4. Patients — 6 endpoints
5. Medical History — 2 endpoints
6. Appointments — 6 endpoints
7. Billing (Invoices) — 6 endpoints
8. Prescriptions — 3 endpoints
9. Laboratory — 6 endpoints
10. Expenses — 4 endpoints
11. Reports — 3 endpoints
12. Notifications — 3 endpoints
13. Store Settings — 2 endpoints
14. Dashboard — 2 endpoints
15. Audit Logs — 1 endpoint
16. Appendix A — Shared DTOs
17. Appendix B — Error Codes

**Total: 53 REST endpoints**

---

## 1. Conventions

### 1.1 Base URL & Versioning

```
Production : https://api.clinimind.com/v1
Staging    : https://api.staging.clinimind.com/v1
Local      : http://localhost:3001/v1
```

### 1.2 Authentication

All endpoints require a JWT access token unless explicitly marked Public.

```
Authorization: Bearer <accessToken>
```

- **accessToken lifetime:** 8 hours
- **refreshToken lifetime:** 7 days, stored in httpOnly cookie OR returned in response body
- On 401 with code `TOKEN_EXPIRED`, the frontend MUST call `POST /auth/refresh` and retry once.
- Password change invalidates all refresh tokens for the user.
- **Note:** Passwords are stored in plain text (per specification) — no hashing.

### 1.3 Standard Response Envelope

Every response (success or failure) uses this envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": null
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "ERR_CODE", "message": "Human readable description", "fields": { "field": "reason" } },
  "meta": null
}
```

`meta` is used only for paginated lists:

```json
"meta": { "page": 1, "limit": 20, "total": 150 }
```

### 1.4 HTTP Status Codes

| Code | When |
|------|------|
| 200 | OK — read or update succeeded |
| 201 | Created — resource was created |
| 204 | No Content — delete succeeded, no body returned |
| 400 | Validation error — request body or query is malformed |
| 401 | Unauthenticated — token missing, malformed, or expired |
| 403 | Forbidden — authenticated but role lacks permission |
| 404 | Not found |
| 409 | Conflict — duplicate or invalid state transition |
| 422 | Unprocessable — semantically wrong (e.g., discount not authorized) |
| 500 | Internal server error |

### 1.5 Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| AUTH_REQUIRED | 401 | No token provided |
| TOKEN_EXPIRED | 401 | Access token expired — call /auth/refresh |
| TOKEN_INVALID | 401 | Token signature invalid or revoked |
| FORBIDDEN | 403 | Role lacks the required permission |
| NOT_FOUND | 404 | Resource does not exist |
| VALIDATION_ERROR | 400 | Body/query failed validation (see error.fields) |
| DUPLICATE | 409 | Username or unique field already taken |
| INVALID_STATE | 409 | Operation not allowed in current state |
| CONFLICT | 409 | Appointment time slot already booked |
| INSUFFICIENT_PERMISSION | 403 | User cannot access this field (e.g., confidential notes) |
| DISCOUNT_NOT_AUTHORIZED | 403 | Discount requires director approval |
| INTERNAL | 500 | Unhandled server error — check logs |

### 1.6 Pagination

Offset-based pagination for all list endpoints: `?page=1&limit=20`. Default `limit=20`, max `limit=100`. Response `meta` includes `page`, `limit`, `total`.

### 1.7 Field Types

- `ObjectId` → string of 24 hex characters: `"65f2a1b3c4d5e6f7a8b9c0d1"`
- `timestamp` → ISO 8601 UTC string: `"2025-06-16T14:32:11.000Z"`
- `amount` → integer MRU/Ouguiya (no decimals)
- `phone` → E.164 international format: `"+22236123456"` or local format `"36123456"` (both accepted, normalized on server)
- `ageCategory` → enum: `"0-1 an" | "1-5 ans" | "6-12 ans" | "13-18 ans" | "19-35 ans" | "36-50 ans" | "51-65 ans" | "65+ ans"`

### 1.8 Notation Used in This Doc

Per-endpoint header looks like:

```
### METHOD /path
**Auth:** Bearer | **Roles:** director, doctor, receptionist, lab_technician
```

- **Auth:** Public (no token) or Bearer (JWT required)
- **Roles:** Comma-separated list of roles that can access the endpoint

### 1.9 Role Definitions

| Role | Description |
|------|-------------|
| `director` | Full system access, user management, financial reports, expense management |
| `doctor` | Patient medical records, prescriptions, lab requests, own appointments |
| `receptionist` | Patient registration, appointments, billing, payment collection |
| `lab_technician` | Lab requests and result entry only |

---

## 2. Auth

### 2.1 POST /auth/login

**Auth:** Public  
**Description:** Authenticate with username + password.

**Request body**

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "user": { /* User DTO — see Appendix A */ },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2025-06-17T14:32:11.000Z",
    "refreshTokenExpiresAt": "2025-06-23T14:32:11.000Z"
  },
  "error": null,
  "meta": null
}
```

**Errors**

| HTTP | Code | When |
|------|------|------|
| 401 | AUTH_REQUIRED | Username or password wrong |
| 403 | FORBIDDEN | Account is disabled |

---

### 2.2 POST /auth/refresh

**Auth:** Public (refresh token in body or cookie)  
**Description:** Exchange a valid refresh token for new access + refresh tokens.

**Request body (if not using cookies)**

```json
{ "refreshToken": "string (required)" }
```

**Success response (200)** — same shape as `/auth/login`.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 401 | TOKEN_INVALID | Refresh token revoked or expired |

---

### 2.3 POST /auth/logout

**Auth:** Bearer  
**Description:** Revoke the current refresh token.

**Request body** — empty.

**Success response (204)** — no body.

---

### 2.4 GET /auth/me

**Auth:** Bearer  
**Description:** Return the authenticated user (verify-token endpoint).

**Success response (200)**

```json
{
  "success": true,
  "data": { /* User DTO */ },
  "error": null,
  "meta": null
}
```

---

## 3. Users (Employee Management)

Director only.

### 3.1 POST /users

**Auth:** Bearer | **Roles:** director  
**Description:** Create a new employee account.

**Request body**

```json
{
  "username": "string (required, unique, min 3, max 50)",
  "password": "string (required, min 4)",
  "fullName": "string (required, min 2, max 100)",
  "email": "string (required, email format)",
  "phone": "string (optional)",
  "role": "director | doctor | receptionist | lab_technician"
}
```

**Success response (201)** — User DTO (without password).

**Errors**

| HTTP | Code | When |
|------|------|------|
| 409 | DUPLICATE | Username already exists |

---

### 3.2 GET /users

**Auth:** Bearer | **Roles:** director, receptionist, doctor  
**Description:** List all employees.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| role | string | no | — | Filter by role |
| search | string | no | — | Search by name or username |
| isActive | boolean | no | — | Filter by active status |

**Success response (200)** — list of User DTO.

---

### 3.3 GET /users/:id

**Auth:** Bearer | **Roles:** director, receptionist, doctor  
**Description:** Get employee details.

**Path params** — `id`: ObjectId.

**Success response (200)** — User DTO.

---

### 3.4 PUT /users/:id

**Auth:** Bearer | **Roles:** director  
**Description:** Update employee (username, fullName, email, phone, role, password, isActive).

**Request body** (all fields optional)

```json
{
  "username": "string",
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "role": "director | doctor | receptionist | lab_technician",
  "password": "string (min 4)",
  "isActive": "boolean"
}
```

**Success response (200)** — updated User DTO.

---

### 3.5 DELETE /users/:id

**Auth:** Bearer | **Roles:** director  
**Description:** Delete an employee account. Cannot delete own account.

**Success response (204)** — no body.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 409 | INVALID_STATE | Trying to delete own account |

---

## 4. Patients

### 4.1 POST /patients

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Create a new patient.

**Request body**

```json
{
  "fullName": "string (required, min 2, max 100)",
  "ageCategory": "string (required, enum)",
  "gender": "M | F (required)",
  "bloodType": "string (optional)",
  "phonePrimary": "string (required)",
  "phoneSecondary": "string (optional)",
  "email": "string (optional, email format)",
  "allergies": [
    {
      "type": "medication | food | latex | other",
      "description": "string"
    }
  ],
  "chronicDiseases": ["diabetes", "hypertension", "asthma", "other"]
}
```

**Success response (201)** — Patient DTO (with auto-generated `fileNumber`).

**Errors**

| HTTP | Code | When |
|------|------|------|
| 409 | DUPLICATE | Phone already registered |
|400   |VALIDATION_ERROR|Password too weak |
---

### 4.2 GET /patients

**Auth:** Bearer | **Roles:** director, doctor, receptionist  
**Description:** List all patients with optional filters.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| search | string | no | — | Search by name, fileNumber, or phone |
| ageCategory | string | no | — | Filter by age category |
| gender | string | no | — | Filter by gender |

**Success response (200)**

```json
{
  "success": true,
  "data": [ /* Patient DTO[] */ ],
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 48 }
}
```

---

### 4.3 GET /patients/:id

**Auth:** Bearer | **Roles:** director, doctor, receptionist  
**Description:** Fetch a single patient.

**Path params** — `id`: ObjectId.

**Success response (200)** — Patient DTO (field access varies by role; see Appendix A).

**Errors**

| HTTP | Code | When |
|------|------|------|
| 404 | NOT_FOUND | Patient does not exist |
| 403 | INSUFFICIENT_PERMISSION | Receptionist trying to access confidentialNotes |

---

### 4.4 PUT /patients/:id

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Update patient administrative info. Doctors update medical history via separate endpoint.

**Request body** (all fields optional)

```json
{
  "fullName": "string",
  "ageCategory": "string",
  "gender": "M | F",
  "bloodType": "string",
  "phonePrimary": "string",
  "phoneSecondary": "string",
  "email": "string"
}
```

**Success response (200)** — updated Patient DTO.

---

### 4.5 DELETE /patients/:id

**Auth:** Bearer | **Roles:** director  
**Description:** Delete a patient. Fails if patient has any invoices, appointments, or lab requests.

**Success response (204)** — no body.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 409 | INVALID_STATE | Patient has existing records (invoices, appointments, lab requests) |

---

### 4.6 GET /patients/:id/history

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Get patient's complete history (visits, prescriptions, lab results, invoices).

**Path params** — `id`: ObjectId.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "patient": { /* Patient DTO */ },
    "appointments": [ /* Appointment DTO[], last 10 */ ],
    "prescriptions": [ /* Prescription DTO[], last 10 */ ],
    "labRequests": [ /* LabRequest DTO[], last 10 */ ],
    "invoices": [ /* Invoice DTO[], last 10 */ ]
  },
  "error": null,
  "meta": null
}
```

---

## 5. Medical History

Doctor-only notes.

### 5.1 PUT /patients/:id/medical-history

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Update patient's medical history (allergies, chronic diseases, surgeries, current treatments, family history, confidential notes).

**Path params** — `id`: ObjectId.

**Request body** (all fields optional)

```json
{
  "allergies": [
    { "type": "medication | food | latex | other", "description": "string" }
  ],
  "chronicDiseases": ["diabetes", "hypertension", "asthma", "other"],
  "surgeries": ["string"],
  "currentTreatments": ["string"],
  "familyHistory": "string",
  "confidentialNotes": "string (doctor only)"
}
```

**Success response (200)** — updated MedicalHistory DTO.

---

### 5.2 GET /patients/:id/medical-history

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Get patient's medical history.

**Path params** — `id`: ObjectId.

**Success response (200)** — MedicalHistory DTO.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 403 | INSUFFICIENT_PERMISSION | Receptionist or lab technician trying to access |

---

## 6. Appointments

### 6.1 POST /appointments

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Create a new appointment.

**Request body**

```json
{
  "patientId": "ObjectId (required)",
  "doctorId": "ObjectId (required)",
  "date": "2025-07-20T00:00:00.000Z (required)",
  "timeSlot": "14:30 (required)",
  "duration": 15,
  "reason": "string (max 200)",
  "type": "normal | followup | emergency | checkup"
}
```

**Success response (201)** — Appointment DTO.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 409 | CONFLICT | Time slot already booked for this doctor |
| 404 | NOT_FOUND | Patient or doctor not found |

---

### 6.2 GET /appointments

**Auth:** Bearer | **Roles:** all (filtered by role)  
**Description:** List appointments with filters.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| from | timestamp | no | — | Start date |
| to | timestamp | no | — | End date |
| doctorId | ObjectId | no | — | Filter by doctor (receptionist/director only) |
| patientId | ObjectId | no | — | Filter by patient |
| status | string | no | — | scheduled, confirmed, completed, cancelled, no_show |

**Role-based filtering:**
- **Doctor:** sees only their own appointments
- **Receptionist/Director:** sees all appointments
- **Lab technician:** sees no appointments (not authorized)

**Success response (200)** — list of Appointment DTO.

---

### 6.3 GET /appointments/:id

**Auth:** Bearer | **Roles:** all (filtered)  
**Description:** Get appointment details.

**Path params** — `id`: ObjectId.

**Success response (200)** — Appointment DTO.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 403 | FORBIDDEN | Doctor trying to access another doctor's appointment |

---

### 6.4 PUT /appointments/:id

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Update appointment (date, timeSlot, doctorId, status, reason).

**Path params** — `id`: ObjectId.

**Request body** (all fields optional)

```json
{
  "doctorId": "ObjectId",
  "date": "timestamp",
  "timeSlot": "string",
  "duration": "integer",
  "reason": "string",
  "type": "string",
  "status": "scheduled | confirmed | completed | cancelled | no_show"
}
```

**Success response (200)** — updated Appointment DTO.

---

### 6.5 PUT /appointments/:id/status

**Auth:** Bearer | **Roles:** receptionist, doctor, director  
**Description:** Quick status update for waiting room management. Doctors can only mark their own appointments as `completed`.

**Path params** — `id`: ObjectId.

**Request body**

```json
{
  "status": "scheduled | confirmed | completed | cancelled | no_show"
}
```

**Success response (200)** — updated Appointment DTO.

---

### 6.6 GET /appointments/available-slots

**Auth:** Bearer | **Roles:** receptionist  
**Description:** Get available time slots for a doctor on a specific date.

**Query params**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| doctorId | ObjectId | yes | Doctor ID |
| date | timestamp | yes | Date to check |

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "availableSlots": ["09:00", "09:15", "09:30", "10:00"]
  },
  "error": null,
  "meta": null
}
```

---

## 7. Billing (Invoices)

### 7.1 POST /invoices

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Create a new invoice for consultation and/or lab tests.

**Request body**

```json
{
  "patientId": "ObjectId (required)",
  "items": [
    {
      "type": "consultation | lab_test",
      "description": "Consultation générale",
      "quantity": 1,
      "unitPrice": 500,
      "referenceId": "ObjectId (labRequestId, if type=lab_test)"
    }
  ],
  "discountType": "percentage | fixed",
  "discountValue": 10
}
```

**Success response (201)**

```json
{
  "success": true,
  "data": {
    "invoice": { /* Invoice DTO */ }
  },
  "error": null,
  "meta": null
}
```

**Errors**

| HTTP | Code | When |
|------|------|------|
| 403 | DISCOUNT_NOT_AUTHORIZED | Discount > 0 and user is not director |
| 404 | NOT_FOUND | Patient or lab request not found |

---

### 7.2 GET /invoices

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** List invoices with filters.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| from | timestamp | no | — | Created after |
| to | timestamp | no | — | Created before |
| patientId | ObjectId | no | — | Filter by patient |
| status | string | no | — | paid, unpaid, partial |

**Success response (200)** — list of Invoice DTO.

---

### 7.3 GET /invoices/:id

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Get invoice details.

**Path params** — `id`: ObjectId.

**Success response (200)** — Invoice DTO (with populated items).

---

### 7.4 POST /invoices/:id/payment

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Record a payment for an invoice.

**Path params** — `id`: ObjectId.

**Request body**

```json
{
  "amount": 500,
  "paymentMethod": "cash | card | transfer"
}
```

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "invoice": { /* Updated Invoice DTO */ },
    "remainingAmount": 250
  },
  "error": null,
  "meta": null
}
```

**Errors**

| HTTP | Code | When |
|------|------|------|
| 422 | VALIDATION_ERROR | Amount > remaining amount |

---

### 7.5 GET /invoices/:id/pdf

**Auth:** Bearer | **Roles:** director, receptionist  
**Description:** Generate PDF invoice for printing.

**Path params** — `id`: ObjectId.

**Success response (200)** — PDF file (Content-Type: application/pdf).

---

### 7.6 DELETE /invoices/:id

**Auth:** Bearer | **Roles:** director  
**Description:** Delete/cancel an invoice. Only possible if invoice has no payments or if director reverses payments first.

**Path params** — `id`: ObjectId.

**Success response (204)** — no body.

**Errors**

| HTTP | Code | When |
|------|------|------|
| 409 | INVALID_STATE | Invoice has payments recorded |

---

## 8. Prescriptions (Paper-based)

### 8.1 POST /prescriptions

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Create a new prescription (paper-based, recorded for history).

**Request body**

```json
{
  "patientId": "ObjectId (required)",
  "notes": "string (optional)",
  "drugs": [
    {
      "drugName": "Paracétamol 500mg",
      "dosage": "1 comprimé 3x par jour",
      "duration": 5,
      "instructions": "À prendre après les repas"
    }
  ]
}
```

**Success response (201)** — Prescription DTO.

---

### 8.2 GET /prescriptions/:id

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Get prescription details.

**Path params** — `id`: ObjectId.

**Success response (200)** — Prescription DTO (with populated drugs).

---

### 8.3 GET /prescriptions/:id/pdf

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Generate PDF prescription for printing (handed to patient).

**Path params** — `id`: ObjectId.

**Success response (200)** — PDF file (Content-Type: application/pdf).

---

## 9. Laboratory

### 9.1 POST /lab/requests

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Create a lab request (doctor prescribes analyses).

**Request body**

```json
{
  "patientId": "ObjectId (required)",
  "tests": ["string (test names)"],
  "priority": "normal | urgent"
}
```

**Success response (201)** — LabRequest DTO.

**Note:** This automatically creates invoice items for the billed services (if billing is enabled at request time).

---

### 9.2 GET /lab/requests

**Auth:** Bearer | **Roles:** director, doctor, lab_technician  
**Description:** List lab requests with filters.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| patientId | ObjectId | no | — | Filter by patient |
| status | string | no | — | pending, in_progress, completed |
| priority | string | no | — | normal, urgent |

**Role-based filtering:**
- **Lab technician:** sees all pending/in_progress requests
- **Doctor:** sees own requests only
- **Director:** sees all requests

**Success response (200)** — list of LabRequest DTO.

---

### 9.3 GET /lab/requests/pending

**Auth:** Bearer | **Roles:** lab_technician  
**Description:** Get all pending lab requests (simplified view for lab dashboard).

**Success response (200)** — list of LabRequest DTO (minimal: patient name, tests, priority, requestedAt).

---

### 9.4 GET /lab/requests/:id

**Auth:** Bearer | **Roles:** director, doctor, lab_technician  
**Description:** Get lab request details including results.

**Path params** — `id`: ObjectId.

**Success response (200)** — LabRequest DTO with populated results.

---

### 9.5 PUT /lab/requests/:id/results

**Auth:** Bearer | **Roles:** lab_technician  
**Description:** Enter results for a lab request.

**Path params** — `id`: ObjectId.

**Request body**

```json
{
  "results": [
    {
      "testName": "Glycémie à jeun",
      "resultText": "1.20",
      "resultNumeric": 1.20,
      "unit": "g/L",
      "normalRange": "0.70-1.10",
      "attachmentUrl": "https://cloudinary.com/..."
    }
  ]
}
```

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "labRequest": { /* Updated LabRequest DTO with status = completed */ },
    "criticalResults": [ /* List of critical test names */ ]
  },
  "error": null,
  "meta": null
}
```

**Behavior:** 
- Updates request status to `completed`
- Checks each result against `settings.criticalThresholds`
- If critical result detected → sends real-time notification (Socket.IO) and email to requesting doctor

---

### 9.6 GET /lab/results/critical

**Auth:** Bearer | **Roles:** director, doctor  
**Description:** Get all critical lab results (unread or recent).

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| from | timestamp | no | last 7 days | Start date |

**Success response (200)** — list of LabResult DTO (with isCritical = true).

---

## 10. Expenses

Director only.

### 10.1 POST /expenses

**Auth:** Bearer | **Roles:** director  
**Description:** Record a clinic expense.

**Request body**

```json
{
  "category": "salary | rent | utilities | supplies | maintenance | other",
  "amount": 15000,
  "description": "string (required, max 200)",
  "date": "2025-06-16T00:00:00.000Z",
  "receiptUrl": "string (optional)"
}
```

**Success response (201)** — Expense DTO.

---

### 10.2 GET /expenses

**Auth:** Bearer | **Roles:** director  
**Description:** List expenses with filters.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| from | timestamp | no | — | Date >= |
| to | timestamp | no | — | Date <= |
| category | string | no | — | Filter by category |

**Success response (200)** — list of Expense DTO.

---

### 10.3 PUT /expenses/:id

**Auth:** Bearer | **Roles:** director  
**Description:** Update an expense.

**Path params** — `id`: ObjectId.

**Request body** (all fields optional)

```json
{
  "category": "string",
  "amount": "integer",
  "description": "string",
  "date": "timestamp",
  "receiptUrl": "string"
}
```

**Success response (200)** — updated Expense DTO.

---

### 10.4 DELETE /expenses/:id

**Auth:** Bearer | **Roles:** director  
**Description:** Delete an expense.

**Success response (204)** — no body.

---

## 11. Reports

### 11.1 GET /reports/financial

**Auth:** Bearer | **Roles:** director  
**Description:** Generate financial report (revenue, expenses, profit).

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| from | timestamp | no | first day of month | Start date |
| to | timestamp | no | last day of month | End date |
| format | string | no | json | json, excel, pdf |

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "period": { "from": "2025-06-01T00:00:00.000Z", "to": "2025-06-30T23:59:59.000Z" },
    "totalRevenue": 125000,
    "totalExpenses": 45000,
    "netProfit": 80000,
    "byCategory": {
      "consultations": 75000,
      "lab_tests": 50000
    },
    "expensesByCategory": {
      "salary": 30000,
      "supplies": 15000
    },
    "unpaidInvoices": 12500
  },
  "error": null,
  "meta": null
}
```

---

### 11.2 GET /reports/medical

**Auth:** Bearer | **Roles:** director  
**Description:** Generate medical activity report.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| from | timestamp | no | first day of month | Start date |
| to | timestamp | no | last day of month | End date |
| format | string | no | json | json, excel, pdf |

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "period": { "from": "...", "to": "..." },
    "totalAppointments": 320,
    "completedAppointments": 280,
    "cancelledAppointments": 20,
    "noShowRate": 6.25,
    "topDiagnoses": [
      { "diagnosis": "Hypertension", "count": 45 }
    ],
    "labRequests": {
      "total": 150,
      "completed": 145,
      "criticalResults": 12
    }
  },
  "error": null,
  "meta": null
}
```

---

### 11.3 GET /reports/export

**Auth:** Bearer | **Roles:** director  
**Description:** Export full financial + medical report (ZIP with CSV/Excel files).

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| from | timestamp | no | first day of month | Start date |
| to | timestamp | no | last day of month | End date |

**Success response (200)** — ZIP file (Content-Type: application/zip).

---

## 12. Notifications

### 12.1 GET /notifications

**Auth:** Bearer | **Roles:** all  
**Description:** List user's notifications.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| unreadOnly | boolean | no | false | Filter unread |
| type | string | no | — | critical_result, appointment_reminder, payment_reminder |

**Success response (200)**

```json
{
  "success": true,
  "data": [ /* Notification DTO[] */ ],
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "unreadCount": 3
  }
}
```

---

### 12.2 PATCH /notifications/:id/read

**Auth:** Bearer | **Roles:** owner  
**Description:** Mark a single notification as read.

**Path params** — `id`: ObjectId.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "isRead": true,
    "readAt": "2025-06-16T14:32:11.000Z"
  }
}
```

---

### 12.3 PATCH /notifications/read-all

**Auth:** Bearer | **Roles:** all  
**Description:** Mark all unread notifications as read.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "updatedCount": 12
  }
}
```

---

## 13. Settings

### 13.1 GET /settings

**Auth:** Bearer | **Roles:** director (full), doctor/receptionist (read-only public)  
**Description:** Get clinic settings.

**Success response (200)** — Settings DTO.

**Role-based access:**
- **Director:** full settings (including SMTP config, critical thresholds)
- **Others:** public settings only (clinicName, logoUrl, defaultConsultationFee, etc.)

---

### 13.2 PUT /settings

**Auth:** Bearer | **Roles:** director  
**Description:** Update clinic settings.

**Request body** (all fields optional)

```json
{
  "clinicName": "string",
  "clinicAddress": "string",
  "clinicPhone": "string",
  "clinicEmail": "string",
  "logoUrl": "string",
  "defaultConsultationFee": "integer",
  "smtpConfig": {
    "host": "string",
    "port": "number",
    "user": "string",
    "pass": "string"
  },
  "criticalThresholds": {
    "glycemia": { "min": 0.7, "max": 1.1, "unit": "g/L" }
  },
  "notificationTemplates": {
    "appointmentReminder": "string"
  }
}
```

**Success response (200)** — updated Settings DTO.

---

## 14. Dashboard

### 14.1 GET /dashboard/director

**Auth:** Bearer | **Roles:** director  
**Description:** Aggregated dashboard data for director.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "stats": {
      "todayRevenue": 12500,
      "todayAppointments": 14,
      "monthlyRevenue": 342000,
      "monthlyExpenses": 98000,
      "monthlyProfit": 244000,
      "pendingAppointments": 23,
      "unpaidInvoices": 12500,
      "totalPatients": 567,
      "criticalResultsUnread": 3
    },
    "recentAppointments": [ /* Appointment DTO[], last 5 */ ],
    "recentExpenses": [ /* Expense DTO[], last 5 */ ],
    "lowStockAlert": null
  },
  "error": null,
  "meta": null
}
```

---

### 14.2 GET /dashboard/doctor

**Auth:** Bearer | **Roles:** doctor  
**Description:** Aggregated dashboard data for doctor.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "stats": {
      "todayAppointments": 8,
      "todayCompleted": 6,
      "weekAppointments": 42,
      "pendingLabResults": 5,
      "unreadNotifications": 3
    },
    "todayAgenda": [ /* Appointment DTO[], today's schedule */ ],
    "criticalResults": [ /* LabResult DTO[], last 5 critical */ ],
    "recentPatients": [ /* Patient DTO[], last 5 seen */ ]
  },
  "error": null,
  "meta": null
}
```

---

### 14.3 GET /dashboard/receptionist

**Auth:** Bearer | **Roles:** receptionist  
**Description:** Aggregated dashboard data for receptionist.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "stats": {
      "todayAppointments": 14,
      "todayCheckedIn": 9,
      "todayRevenue": 12500,
      "waitingRoomCount": 4
    },
    "todayAgenda": [ /* Appointment DTO[], today's schedule */ ],
    "recentInvoices": [ /* Invoice DTO[], last 5 */ ]
  },
  "error": null,
  "meta": null
}
```

---

### 14.4 GET /dashboard/lab

**Auth:** Bearer | **Roles:** lab_technician  
**Description:** Aggregated dashboard data for lab technician.

**Success response (200)**

```json
{
  "success": true,
  "data": {
    "stats": {
      "pendingRequests": 12,
      "urgentRequests": 3,
      "completedToday": 8
    },
    "pendingRequests": [ /* LabRequest DTO[], first 10, urgent first */ ],
    "recentCompleted": [ /* LabRequest DTO[], last 5 */ ]
  },
  "error": null,
  "meta": null
}
```

---

## 15. Audit Logs

### 15.1 GET /audit-logs

**Auth:** Bearer | **Roles:** director  
**Description:** List audit logs with filters.

**Query params**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Max 100 |
| from | timestamp | no | — | Start date |
| to | timestamp | no | — | End date |
| action | string | no | — | delete_patient, modify_price, cancel_payment, change_role, delete_invoice |
| userId | ObjectId | no | — | Filter by user |

**Success response (200)** — list of AuditLog DTO.

---

## Appendix A — Shared DTOs

### A.1 User

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "username": "dr.salim",
  "fullName": "Dr. Salim Ahmed",
  "email": "salim@clinimind.com",
  "phone": "+22236123456",
  "role": "doctor",
  "isActive": true,
  "lastLoginAt": "2025-06-16T14:30:00.000Z",
  "createdAt": "2025-05-01T00:00:00.000Z",
  "createdBy": "65f2a1b3c4d5e6f7a8b9c0d0"
}
```

### A.2 Patient

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "fileNumber": "P-1042",
  "fullName": "Mariam Ould Mohamed",
  "ageCategory": "19-35 ans",
  "gender": "F",
  "bloodType": "O+",
  "phonePrimary": "+22246543210",
  "phoneSecondary": null,
  "email": "mariam@example.com",
  "allergies": [
    { "type": "medication", "description": "Pénicilline" }
  ],
  "chronicDiseases": ["asthma"],
  "confidentialNotes": "Patient anxieuse — approche douce recommandée",
  "createdAt": "2025-06-01T00:00:00.000Z",
  "createdBy": "65f2a1b3c4d5e6f7a8b9c0d0"
}
```

**Role-based field visibility:**
- **Doctor/Director:** all fields
- **Receptionist:** all EXCEPT `confidentialNotes`
- **Lab technician:** only `_id`, `fileNumber`, `fullName`, `ageCategory`, `gender`

### A.3 MedicalHistory

```json
{
  "patientId": "65f2a1b3c4d5e6f7a8b9c0d1",
  "surgeries": ["Appendicectomie (2018)"],
  "currentTreatments": ["Ventoline en cas de crise"],
  "familyHistory": "Père hypertendu",
  "updatedAt": "2025-06-10T00:00:00.000Z",
  "updatedBy": "65f2a1b3c4d5e6f7a8b9c0d2"
}
```

### A.4 Appointment

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientId": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientName": "Mariam Ould Mohamed",
  "doctorId": "65f2a1b3c4d5e6f7a8b9c0d2",
  "doctorName": "Dr. Salim Ahmed",
  "date": "2025-06-20T00:00:00.000Z",
  "timeSlot": "10:30",
  "duration": 15,
  "reason": "Douleurs thoraciques",
  "type": "consultation",
  "status": "scheduled",
  "waitingRoomPosition": null,
  "createdAt": "2025-06-16T14:32:11.000Z",
  "createdBy": "65f2a1b3c4d5e6f7a8b9c0d3"
}
```

### A.5 Invoice

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "invoiceNumber": 1042,
  "patientId": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientName": "Mariam Ould Mohamed",
  "totalAmount": 1500,
  "paidAmount": 1500,
  "remainingAmount": 0,
  "discountType": "fixed",
  "discountValue": 0,
  "discountAuthorizedBy": null,
  "status": "paid",
  "paymentMethod": "cash",
  "items": [
    {
      "type": "consultation",
      "description": "Consultation générale",
      "quantity": 1,
      "unitPrice": 500,
      "total": 500
    },
    {
      "type": "lab_test",
      "description": "Bilan sanguin complet",
      "quantity": 1,
      "unitPrice": 1000,
      "total": 1000,
      "referenceId": "65f2a1b3c4d5e6f7a8b9c0d4"
    }
  ],
  "createdAt": "2025-06-16T14:32:11.000Z",
  "createdBy": "65f2a1b3c4d5e6f7a8b9c0d3",
  "paidAt": "2025-06-16T14:35:00.000Z"
}
```

### A.6 Prescription

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientId": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientName": "Mariam Ould Mohamed",
  "doctorId": "65f2a1b3c4d5e6f7a8b9c0d2",
  "doctorName": "Dr. Salim Ahmed",
  "date": "2025-06-16T14:32:11.000Z",
  "notes": "À renouveler si besoin",
  "drugs": [
    {
      "drugName": "Amoxicilline 500mg",
      "dosage": "1 gélule 3x par jour",
      "duration": 7,
      "instructions": "À prendre avec de l'eau"
    }
  ],
  "createdAt": "2025-06-16T14:32:11.000Z"
}
```

### A.7 LabRequest

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientId": "65f2a1b3c4d5e6f7a8b9c0d1",
  "patientName": "Mariam Ould Mohamed",
  "doctorId": "65f2a1b3c4d5e6f7a8b9c0d2",
  "doctorName": "Dr. Salim Ahmed",
  "tests": ["Glycémie", "Cholestérol total", "Triglycérides"],
  "priority": "normal",
  "status": "completed",
  "requestedAt": "2025-06-16T14:32:11.000Z",
  "completedAt": "2025-06-17T09:15:00.000Z",
  "results": [
    {
      "testName": "Glycémie",
      "resultText": "1.20",
      "resultNumeric": 1.20,
      "unit": "g/L",
      "normalRange": "0.70-1.10",
      "isCritical": true,
      "attachmentUrl": null,
      "enteredAt": "2025-06-17T09:15:00.000Z",
      "enteredBy": "65f2a1b3c4d5e6f7a8b9c0d5"
    }
  ]
}
```

### A.8 Expense

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "category": "salary",
  "amount": 15000,
  "description": "Salaire mois juin - Dr. Salim",
  "date": "2025-06-30T00:00:00.000Z",
  "receiptUrl": "https://cloudinary.com/...",
  "createdAt": "2025-06-30T10:00:00.000Z",
  "createdBy": "65f2a1b3c4d5e6f7a8b9c0d0"
}
```

### A.9 Notification

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "userId": "65f2a1b3c4d5e6f7a8b9c0d2",
  "type": "critical_result",
  "title": "Résultat critique : Glycémie",
  "body": "Le résultat de Glycémie pour la patiente Mariam Ould Mohamed est hors norme (1.20 g/L, normale: 0.70-1.10).",
  "isRead": false,
  "readAt": null,
  "data": { "labRequestId": "65f2a1b3c4d5e6f7a8b9c0d1", "testName": "Glycémie" },
  "createdAt": "2025-06-17T09:15:00.000Z"
}
```

### A.10 Settings

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "clinicName": "CliniMind Center",
  "clinicAddress": "Nouakchott, Mauritanie",
  "clinicPhone": "+22236123456",
  "clinicEmail": "contact@clinimind.com",
  "logoUrl": "https://cloudinary.com/.../logo.png",
  "defaultConsultationFee": 500,
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "noreply@clinimind.com",
    "pass": "********"
  },
  "criticalThresholds": {
    "glycemia": { "min": 0.7, "max": 1.1, "unit": "g/L" }
  },
  "notificationTemplates": {
    "appointmentReminder": "Bonjour {{patientName}}, rappel de votre rendez-vous le {{date}} à {{time}}."
  }
}
```

### A.11 AuditLog

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "userId": "65f2a1b3c4d5e6f7a8b9c0d0",
  "userName": "Admin Director",
  "action": "delete_invoice",
  "details": "Annulation de la facture #1042",
  "oldValues": { "status": "paid", "paidAmount": 1500 },
  "newValues": { "status": "cancelled", "paidAmount": 0 },
  "ipAddress": "192.168.1.100",
  "timestamp": "2025-06-16T15:00:00.000Z"
}
```

---

## Appendix B — Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| AUTH_REQUIRED | 401 | No token provided or invalid credentials |
| TOKEN_EXPIRED | 401 | Access token expired — call /auth/refresh |
| TOKEN_INVALID | 401 | Token signature invalid |
| FORBIDDEN | 403 | Role lacks permission |
| NOT_FOUND | 404 | Resource does not exist |
| VALIDATION_ERROR | 400 | Input validation failed |
| DUPLICATE | 409 | Unique constraint violation |
| INSUFFICIENT_PERMISSION | 403 | User cannot access this field or resource |
| DISCOUNT_NOT_AUTHORIZED | 403 | Discount requires director approval |
| CONFLICT | 409 | Appointment time slot already booked |
| INVALID_STATE | 409 | Operation not allowed in current state |
| INTERNAL | 500 | Server error |

---

**CliniMind — API Contract — MVP**  
*Source of truth: this file. Sync with architecture.md for architectural reasoning.*