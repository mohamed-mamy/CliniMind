```markdown
# CliniMind — Architecture Technique & System Design

**Version MVP – Prêt pour développement**  
Document de référence pour l’équipe technique

---

## Table des Matières

1. Vue d’ensemble
2. Principes architecturaux
3. Architecture en couches
4. Structure des projets
5. Acteurs du système
6. Modules backend
7. Architecture base de données
8. Relations entre collections
9. Flux principaux
10. Architecture temps réel & notifications
11. Architecture de facturation et encaissement
12. Gestion des dépenses (nouveau)
13. Architecture de sécurité
14. API Design
15. Tâches planifiées (Cron Jobs)
16. Cache & performances
17. Architecture déploiement (MVP)
18. Diagrammes de séquence
19. Stratégie de scalabilité
20. Périmètre MVP vs V2

---

## 1. Vue d’ensemble

**CliniMind** est une plateforme web de gestion intégrée pour cliniques médicales de taille moyenne. Elle permet de :

- Centraliser les dossiers patients (médicaux, administratifs, financiers)
- Gérer les rendez‑vous et les files d’attente
- Facturer et encaisser les prestations (consultations, analyses)
- Prescrire électroniquement (ordonnance imprimée / papier) – aucune gestion de pharmacie ni stock de médicaments
- Gérer les demandes d’analyses et la saisie des résultats de laboratoire
- Administrer les utilisateurs et les rôles (RBAC)
- Générer des rapports financiers et médicaux
- Notifier en temps réel (résultats critiques, rappels)
- Gérer les dépenses de la clinique (salaires, fournitures, etc.)

L’application repose sur quatre rôles principaux : **Directeur**, **Médecin**, **Accueil/Secrétariat**, **Technicien laboratoire**.

> **Note** : La pharmacie interne est hors périmètre MVP. Les ordonnances sont remises au patient sur papier.

---

## 2. Principes architecturaux

| Principe | Décision | Justification |
|----------|----------|----------------|
| **Monolithe modulaire** | Backend Node.js (JavaScript) découpé par domaine métier | Rapide à développer, cohérence des transactions |
| **API‑First** | Toutes les fonctionnalités exposées via REST | Frontend et futures applications mobiles partagent la même API |
| **Temps réel ciblé** | Socket.IO pour notifications critiques (résultats labo) | Réactivité médicale sans surcharge serveur |
| **Stateless backend** | JWT pour l’authentification | Scalabilité horizontale immédiate |
| **Base de données** | MongoDB Atlas (seulement) | Schémas hétérogènes, pas de cache Redis dans MVP |

---

## 3. Architecture en couches

```

┌─────────────────────────────────────────────────┐
│              PRESENTATION LAYER                 │
│        React + Vite + Tailwind CSS              │
│   Pages : Dashboard, Patients, Agenda, Labo,    │
│           Facturation, Dépenses, Paramètres     │
├─────────────────────────────────────────────────┤
│                   REST + Socket.IO              │
├─────────────────────────────────────────────────┤
│                  API LAYER                      │
│         Routes Express + Middlewares            │
│         Validation (Joi ou Zod) + RBAC + Audit  │
├─────────────────────────────────────────────────┤
│              BUSINESS LOGIC LAYER               │
│ Services : Patient, Appointment, Billing,       │
│            Lab, Report, Expense                 │
│         Règles métier isolées des routes        │
├─────────────────────────────────────────────────┤
│              DATA ACCESS LAYER                  │
│         Modèles Mongoose + Requêtes             │
├─────────────────────────────────────────────────┤
│            EXTERNAL SERVICES LAYER              │
│      Nodemailer (SMTP) / Cloudinary (fichiers)  │
└─────────────────────────────────────────────────┘

```

---

## 4. Structure des projets

### 4.1 Backend – Structure par modules (JavaScript)

```

clinimind-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.middleware.js
│   │   ├── user/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.model.js
│   │   ├── patient/
│   │   │   ├── patient.routes.js
│   │   │   ├── patient.controller.js
│   │   │   ├── patient.service.js
│   │   │   ├── patient.model.js
│   │   │   └── medicalHistory.model.js
│   │   ├── appointment/
│   │   │   ├── appointment.routes.js
│   │   │   ├── appointment.controller.js
│   │   │   ├── appointment.service.js
│   │   │   └── appointment.model.js
│   │   ├── billing/
│   │   │   ├── billing.routes.js
│   │   │   ├── billing.controller.js
│   │   │   ├── billing.service.js
│   │   │   ├── invoice.model.js
│   │   │   └── invoiceItem.model.js
│   │   ├── prescription/        # Ordonnance papier (simple enregistrement)
│   │   │   ├── prescription.routes.js
│   │   │   ├── prescription.controller.js
│   │   │   ├── prescription.service.js
│   │   │   ├── prescription.model.js
│   │   │   └── prescriptionDrug.model.js
│   │   ├── laboratory/
│   │   │   ├── lab.routes.js
│   │   │   ├── lab.controller.js
│   │   │   ├── lab.service.js
│   │   │   ├── labRequest.model.js
│   │   │   └── labResult.model.js
│   │   ├── expense/              # NOUVEAU : gestion des dépenses
│   │   │   ├── expense.routes.js
│   │   │   ├── expense.controller.js
│   │   │   ├── expense.service.js
│   │   │   └── expense.model.js
│   │   ├── report/
│   │   │   ├── report.routes.js
│   │   │   ├── report.controller.js
│   │   │   ├── report.service.js
│   │   │   └── report.generator.js
│   │   ├── notification/
│   │   │   ├── notification.routes.js
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   └── notification.model.js
│   │   ├── setting/
│   │   │   ├── setting.routes.js
│   │   │   ├── setting.controller.js
│   │   │   ├── setting.service.js
│   │   │   └── setting.model.js
│   │   └── audit/
│   │       ├── audit.routes.js
│   │       ├── audit.controller.js
│   │       ├── audit.service.js
│   │       └── audit.model.js
│   ├── socket/
│   │   ├── socket.server.js
│   │   └── notification.socket.js
│   ├── jobs/
│   │   ├── backup.job.js                # Sauvegarde auto (MVP)
│   │   ├── expirationAlert.job.js       # (si applicable)
│   │   ├── paymentReminder.job.js
│   │   └── lowStockAlert.job.js         # Supprimé car plus de pharmacie
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── audit.middleware.js
│   │   └── validate.middleware.js
│   └── utils/
│       ├── apiResponse.js
│       ├── jwt.util.js
│       ├── pdfGenerator.js
│       └── invoiceNumber.util.js
├── app.js
└── server.js

```

### 4.2 Frontend – Structure (React + Vite)

```

clinimind-frontend/
├── src/
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Patients/
│   │   ├── Appointments/
│   │   ├── Billing/
│   │   ├── Laboratory/
│   │   ├── Expenses/           # Nouveau
│   │   ├── Reports/
│   │   └── Settings/
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── notifications/
│   │   └── forms/
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   └── useNotifications.js
│   ├── services/
│   │   ├── api.js
│   │   ├── socket.js
│   │   └── authService.js
│   ├── store/
│   │   ├── authStore.js
│   │   └── notifStore.js
│   └── App.jsx
└── main.jsx

```

---

## 5. Acteurs du système

| Acteur | Rôle | Accès | Création du compte |
|--------|------|-------|---------------------|
| **Directeur** | Administration complète (utilisateurs, tarifs, rapports, paramètres, dépenses) | Total – y compris suppression patient, annulation paiement | Unique (premier lancement) |
| **Médecin** | Consultation dossiers, prescription papier, demande analyses, notes médicales | Dossier patient complet (sauf montants), agenda personnel | Par le directeur |
| **Accueil/Secrétariat** | Gestion patients, rendez‑vous, facturation, encaissement | Fiches administratives, agenda tous médecins, facturation | Par le directeur |
| **Technicien laboratoire** | Saisie résultats analyses, visualisation demandes | Demandes labo, données patient limitées | Par le directeur |

> **Pas de rôle Pharmacien** (supprimé). Les ordonnances sont remises au patient sur papier – pas de dispensation électronique.

---

## 6. Modules backend

### 6.1 Auth Module
- Connexion (email + mot de passe)
- **Mot de passe stocké en clair** (pas de hash – selon spécification client)
- Génération JWT (access + refresh)
- Endpoints : `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`

### 6.2 User Module
- CRUD utilisateurs (réservé directeur)
- Attribution de rôle (director, doctor, receptionist, lab_technician)
- Désactivation / réactivation

### 6.3 Patient Module
- CRUD patients
- Pas de date de naissance, utilisation d’**une catégorie d’âge** (menu déroulant)
- Dossier médical (antécédents, allergies, maladies chroniques)
- Notes confidentielles (réservées médecin)
- Historique : visites, ordonnances, résultats, factures

### 6.4 Appointment Module
- Gestion des rendez‑vous
- Vérification conflits horaires
- File d’attente
- Envoi notifications **uniquement par email** (si patient a un email)

### 6.5 Billing Module
- Création factures (consultation, analyses)
- Encaissement (espèces, carte, virement)
- Remises (autorisation directeur)
- Suivi impayés
- Impression PDF

### 6.6 Prescription Module (simplifié)
- Création d’une ordonnance (médecin) – enregistrement dans la base pour historique
- **Pas de lien avec une pharmacie** – pas de vérification de stock, pas de dispensation
- Impression PDF de l’ordonnance (remise au patient)
- Contient : liste des médicaments, posologie, durée

### 6.7 Laboratory Module
- Demande d’analyses (médecin → laborantin)
- Saisie résultats (texte, numérique, booléen, fichier PDF)
- Seuils critiques → alerte automatique (email + notification in-app)
- Notification médecin via Socket.IO

### 6.8 Expense Module (NOUVEAU – MVP)
- Enregistrement des dépenses de la clinique (fournitures, salaires, loyers, etc.)
- Champs : date, catégorie, montant, description, justificatif (optionnel)
- CRUD réservé au directeur
- Export des dépenses (PDF/Excel) via module Report

### 6.9 Report Module
- Rapports financiers (CA, impayés, dépenses totales, bénéfice)
- Rapports médicaux (analyses fréquentes)
- Statistiques rendez‑vous
- Export Excel / PDF

### 6.10 Notification Module
- Génération notifications in-app
- Envoi **uniquement par email** (pas de SMS, pas de WhatsApp dans MVP)
- Modèles paramétrables

### 6.11 Setting Module
- Paramètres clinique (nom, logo, adresse, tarifs)
- Configuration SMTP (email)
- Gestion sauvegardes manuelles + **planifiées (MVP)**

### 6.12 Audit Module
- Journalisation actions critiques
- Consultation réservée directeur

---

## 7. Architecture base de données

### 7.1 Collection : `users`

```json
{
  "_id": "ObjectId",
  "username": "string (unique)",
  "password": "string (stocké en clair, sans hash)",
  "role": "director | doctor | receptionist | lab_technician",
  "fullName": "string",
  "email": "string",
  "phone": "string (optionnel)",
  "isActive": "boolean",
  "lastLoginAt": "Date",
  "createdAt": "Date",
  "createdBy": "ObjectId"
}
```

Index : username unique, role

7.2 Collection : patients

```json
{
  "_id": "ObjectId",
  "fileNumber": "string (auto-incrément)",
  "fullName": "string",
  "ageCategory": "0-1 an | 1-5 ans | 6-12 ans | 13-18 ans | 19-35 ans | 36-50 ans | 51-65 ans | 65+ ans",
  "gender": "M|F",
  "bloodType": "string (optionnel)",
  "phonePrimary": "string",
  "phoneSecondary": "string",
  "email": "string",
  "allergies": [
    {
      "type": "medication|food|latex|other",
      "description": "string"
    }
  ],
  "chronicDiseases": ["diabetes", "hypertension", "asthma", "other"],
  "confidentialNotes": "string (réservé médecin)",
  "createdAt": "Date",
  "createdBy": "ObjectId"
}
```

Index : fileNumber unique, fullName (texte)

7.3 Collection : medical_history

```json
{
  "_id": "ObjectId",
  "patientId": "ObjectId",
  "surgeries": ["string"],
  "currentTreatments": ["string"],
  "familyHistory": "string",
  "updatedAt": "Date",
  "updatedBy": "ObjectId"
}
```

7.4 Collection : appointments

```json
{
  "_id": "ObjectId",
  "patientId": "ObjectId",
  "doctorId": "ObjectId",
  "date": "Date",
  "timeSlot": "string (ex: 14:30)",
  "duration": 15,
  "reason": "string",
  "type": "normal|followup|emergency|checkup",
  "status": "scheduled|confirmed|completed|cancelled|no_show",
  "waitingRoomPosition": "number",
  "createdAt": "Date",
  "createdBy": "ObjectId"
}
```

Index : doctorId + date + timeSlot (unique), patientId, status

7.5 Collection : invoices

```json
{
  "_id": "ObjectId",
  "invoiceNumber": "number (auto-incrément)",
  "patientId": "ObjectId",
  "patientName": "string",
  "totalAmount": "number",
  "paidAmount": "number",
  "remainingAmount": "number",
  "discountType": "percentage|fixed",
  "discountValue": "number",
  "discountAuthorizedBy": "ObjectId",
  "status": "paid|unpaid|partial",
  "paymentMethod": "cash|card|transfer",
  "createdAt": "Date",
  "createdBy": "ObjectId",
  "paidAt": "Date"
}
```

Index : patientId, status, createdAt

7.6 Collection : invoice_items

```json
{
  "_id": "ObjectId",
  "invoiceId": "ObjectId",
  "type": "consultation|lab_test",
  "description": "string",
  "quantity": "number",
  "unitPrice": "number",
  "total": "number",
  "referenceId": "ObjectId (labRequestId)"
}
```

7.7 Collection : prescriptions (ordonnance papier)

```json
{
  "_id": "ObjectId",
  "patientId": "ObjectId",
  "doctorId": "ObjectId",
  "date": "Date",
  "notes": "string (optionnel)",
  "createdAt": "Date"
}
```

7.8 Collection : prescription_drugs

```json
{
  "_id": "ObjectId",
  "prescriptionId": "ObjectId",
  "drugName": "string",
  "dosage": "string",
  "duration": "number (jours)",
  "instructions": "string"
}
```

Pas de gestion de quantité, dispensation, ni stock.

7.9 Collection : lab_requests

```json
{
  "_id": "ObjectId",
  "patientId": "ObjectId",
  "doctorId": "ObjectId",
  "tests": ["string"],
  "priority": "normal|urgent",
  "status": "pending|in_progress|completed",
  "requestedAt": "Date",
  "completedAt": "Date"
}
```

7.10 Collection : lab_results

```json
{
  "_id": "ObjectId",
  "requestId": "ObjectId",
  "testName": "string",
  "resultText": "string",
  "resultNumeric": "number",
  "resultBoolean": "boolean",
  "unit": "string",
  "normalRange": "string",
  "isCritical": "boolean",
  "attachmentUrl": "string (Cloudinary)",
  "enteredAt": "Date",
  "enteredBy": "ObjectId"
}
```

7.11 Collection : expenses (NOUVEAU)

```json
{
  "_id": "ObjectId",
  "category": "salary | rent | utilities | supplies | maintenance | other",
  "amount": "number",
  "description": "string",
  "date": "Date",
  "receiptUrl": "string (optionnel, Cloudinary)",
  "createdAt": "Date",
  "createdBy": "ObjectId"
}
```

Index : date, category

7.12 Collection : notifications

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "critical_result | appointment_reminder | payment_reminder",
  "title": "string",
  "body": "string",
  "isRead": "boolean",
  "data": "object",
  "createdAt": "Date"
}
```

7.13 Collection : settings

```json
{
  "_id": "ObjectId",
  "clinicName": "string",
  "clinicAddress": "string",
  "clinicPhone": "string",
  "clinicEmail": "string",
  "logoUrl": "string",
  "defaultConsultationFee": "number",
  "smtpConfig": "object",
  "notificationTemplates": "object",
  "criticalThresholds": "object"
}
```

7.14 Collection : user_logs

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "action": "delete_patient|modify_price|cancel_payment|change_role|delete_invoice",
  "details": "string",
  "oldValues": "object",
  "newValues": "object",
  "ipAddress": "string",
  "timestamp": "Date"
}
```

7.15 Collection : counters

```json
{
  "_id": "string (patientFile|invoiceNumber)",
  "sequenceValue": "number"
}
```

---

8. Relations entre collections

· users (1) → (0..n) patients (createdBy)
· users (1) → (0..n) appointments (doctorId ou createdBy)
· users (1) → (0..n) prescriptions (doctorId)
· users (1) → (0..n) lab_requests (doctorId)
· users (1) → (0..n) lab_results (enteredBy)
· users (1) → (0..n) expenses (createdBy)
· users (1) → (0..n) notifications (userId)
· users (1) → (0..n) user_logs (userId)
· patients (1) → (0..n) appointments
· patients (1) → (0..n) invoices
· patients (1) → (0..n) prescriptions
· patients (1) → (0..n) lab_requests
· invoices (1) → (0..n) invoice_items
· prescriptions (1) → (0..n) prescription_drugs
· lab_requests (1) → (0..n) lab_results

---

9. Flux principaux

9.1 Flux consultation complète

1. Secrétariat crée ou recherche patient (choix catégorie d’âge)
2. Secrétariat prend rendez‑vous avec un médecin (vérification conflit)
3. Notification envoyée par email au patient (si email renseigné)
4. Patient arrive → secrétariat le positionne en file d’attente
5. Médecin consulte dossier, rédige ordonnance papier (impression PDF) et/ou demande analyses
6. Secrétariat crée facture (consultation + analyses prescrites)
7. Patient paie → encaissement, impression facture
8. Laborantin saisit résultats → notification automatique (email + in-app) au médecin

9.2 Flux prescription papier

1. Médecin crée une ordonnance dans le système (enregistrement prescription + prescription_drugs)
2. Impression PDF – remise au patient
3. Pas de dispensation, pas de lien avec inventaire
4. L’ordonnance reste dans l’historique du patient

9.3 Flux laboratoire

1. Médecin sélectionne analyses → création lab_requests (status pending)
2. Laborantin voit nouvelle demande (triée par priorité)
3. Saisie des résultats dans lab_results
4. Vérification seuils critiques (définis dans settings.criticalThresholds)
5. Si résultat hors plage → isCritical = true
6. Notification Socket.IO + email envoyé au médecin
7. Statut lab_requests passe à completed

9.4 Flux facturation et encaissement

1. Secrétariat crée invoice (consultation + analyses)
2. Total calculé automatiquement
3. Remise éventuelle (autorisation directeur requise)
4. Paiement → mise à jour paidAmount, remainingAmount, status
5. Si remainingAmount = 0 → status = paid
6. Impression PDF + envoi optionnel email
7. Toute modification d’une facture payée est interdite (sauf directeur avec annulation préalable)

9.5 Flux dépenses (nouveau)

1. Directeur saisit une dépense (catégorie, montant, date, justificatif)
2. La dépense est immédiatement prise en compte dans les rapports financiers
3. Possibilité de modifier/supprimer une dépense (traçabilité dans audit)

---

10. Architecture temps réel & notifications

10.1 Socket.IO – Rooms utilisées

· user:{userId} : notifications personnelles
· doctor:{doctorId} : résultats critiques, nouvelles demandes analyses
· lab : nouvelles demandes analyses

10.2 Événements Socket.IO

Événement Direction Description
notification:new Serveur → Client Nouvelle notification in-app
lab:critical_result Serveur → Médecin Résultat critique détecté
lab:new_request Serveur → Laborantin Demande d’analyse
appointment:reminder Serveur → Patient (via canal user) Rappel rendez‑vous

10.3 Notifications multi‑canaux (MVP réduit)

Événement In-App Email SMS/WhatsApp
Confirmation rendez‑vous ✅ ✅ (si email patient) ❌
Rappel rendez‑vous (J-1) ✅ ✅ ❌
Résultat critique ✅ ✅ ❌
Rappel paiement impayé ✅ ✅ ❌
Facture disponible ✅ ✅ ❌

---

11. Architecture de facturation et encaissement

11.1 Création facture

· Consultation : tarif par défaut (modifiable dans settings)
· Analyses : tarifs depuis grille (stockée dans settings ou collection dédiée V2)

11.2 Gestion des remises

· Directeur seul autorisé
· Types : pourcentage ou montant fixe
· Tracée dans user_logs

11.3 Impayés et échéanciers

· Liste des factures avec remainingAmount > 0
· Rappels automatiques par email (cron J-7, J-3, J-1)

---

12. Gestion des dépenses (MVP)

12.1 Enregistrement des dépenses

· Toute sortie d’argent (salaires, loyers, fournitures, maintenance, etc.)
· Collection expenses
· Seul le directeur peut créer/modifier/supprimer une dépense

12.2 Impact financier

· Les dépenses sont déduites du chiffre d’affaires dans les rapports (bénéfice net)
· Export possible avec les factures

---

13. Architecture de sécurité

13.1 Authentification JWT

· Access token : 8h
· Refresh token : 7 jours (stocké en base)
· Changement mot de passe → invalidation tous les tokens
· Mot de passe stocké en clair (selon spécification – aucune mesure de hash)

13.2 RBAC

```js
const ROLE_PERMISSIONS = {
  director: ['*'],
  doctor: [
    'patient:read:full',
    'prescription:create',
    'lab:request:create',
    'appointment:read:own',
    'appointment:block:own'
  ],
  receptionist: [
    'patient:create',
    'patient:read:admin',
    'patient:update:admin',
    'appointment:*',
    'billing:create',
    'billing:collect'
  ],
  lab_technician: [
    'lab:request:read',
    'lab:result:create'
  ]
};
```

13.3 Isolation des données

· Médecins : voient les notes médicales, pas les montants
· Secrétariat : voit les montants, pas les notes médicales
· Laborantin : voit identité patient + analyses demandées, pas le reste du dossier

13.4 Journal d’audit

· Actions critiques tracées dans user_logs
· Consultation réservée directeur
· Conservation : 1 an minimum

13.5 Protection API

· Validation des entrées (Joi ou Zod)
· Helmet.js
· Rate limiting (100 req/minute par IP)
· HTTPS obligatoire en production

---

14. API Design

Conventions :

· Base URL : https://api.clinimind.com/v1
· Format réponse standard :

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 50 }
}
```

Endpoints clés :

Méthode Route Rôle
POST /api/auth/login public
GET /api/patients director, doctor, receptionist
POST /api/patients receptionist, director
DELETE /api/patients/:id director
GET /api/patients/:id/medical-history doctor, director
GET /api/appointments selon rôle
POST /api/appointments receptionist, director
PUT /api/appointments/:id/status receptionist
GET /api/invoices director, receptionist
POST /api/invoices receptionist
POST /api/invoices/:id/payment receptionist
DELETE /api/invoices/:id director
POST /api/prescriptions doctor
GET /api/prescriptions/:id/pdf doctor, director
POST /api/lab/requests doctor
GET /api/lab/requests/pending lab_technician
PUT /api/lab/requests/:id/results lab_technician
GET /api/expenses director
POST /api/expenses director
DELETE /api/expenses/:id director
GET /api/reports/financial director
GET /api/reports/medical director
GET /api/settings director
PUT /api/settings director
GET /api/audit/logs director

---

15. Tâches planifiées (Cron Jobs)

Fréquence Tâche Description
02:00 quotidien backup.job.js Sauvegarde automatique MongoDB Atlas + fichiers Cloudinary (MVP)
09:00 quotidien appointmentReminder.job.js Rappels rendez‑vous J-1 par email
00:00 quotidien paymentReminder.job.js Rappels impayés (J-7, J-3, J-1) par email
03:00 hebdomadaire cleanup.job.js Suppression logs de +12 mois

---

16. Cache & performances

MVP sans Redis (simplicité). Optimisations MongoDB :

· Index sur toutes les collections (voir section 7)
· Agrégations paginées pour dossier patient
· Projections pour limiter les champs retournés selon rôle

---

17. Architecture déploiement (MVP)

```
[Vercel / Netlify]        → Frontend React + Vite
[Railway / Render]        → Backend Node.js (1 instance)
[MongoDB Atlas]           → Base de données (M0 gratuit)
[Cloudinary]              → Fichiers joints (PDF résultats, logos)
[Nodemailer SMTP]         → Emails uniquement
```

Variables d’environnement :

· NODE_ENV, PORT
· MONGODB_URI
· JWT_SECRET, JWT_REFRESH_SECRET
· CLOUDINARY_URL
· SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

---

18. Diagrammes de séquence

18.1 Prescription papier

```
Médecin → Frontend → Backend → MongoDB
  |          |          |
  |--création ordonnance->|
  |                      |--insert prescription-->
  |                      |--insert drugs--------->
  |<--confirmation-------|
  |--impression PDF (client)-->
```

18.2 Résultat critique laboratoire

```
Laborantin → Frontend → Backend → MongoDB → Médecin (Socket + email)
  |            |          |
  |--saisie résultat----->|
  |            |         |--insert lab_result
  |            |         |--vérification seuil (hors plage)
  |            |         |--notif (critical) + email
  |<--confirmation-------|
```

18.3 Prise de rendez‑vous

```
Secrétariat → Frontend → Backend → MongoDB → Patient (email)
  |             |          |
  |--sélection médecin, créneau->|
  |             |         |--vérification conflit
  |             |         |<--OK
  |             |         |--insert appointment
  |             |         |--envoi email (si adresse)
  |<--confirmation--------|
```

---

19. Stratégie de scalabilité

Phase Architecture Capacité cible
MVP Monolithe Node.js (1 instance), MongoDB M0 1 clinique, 10 médecins, 5 000 patients
V1 production 2 instances + Load Balancer Nginx, MongoDB M10 1 clinique, 20 médecins, 20 000 patients
V2 multi‑cliniques Microservices (auth, patient, billing, lab, report, expense), MongoDB sharding 10+ cliniques

---

20. Périmètre MVP vs V2

Fonctionnalité MVP V2
Authentification & rôles (4 rôles) ✅ ✅
Gestion patients (catégories d’âge) ✅ ✅
Planification rendez‑vous ✅ ✅
Facturation et encaissement ✅ ✅
Prescription papier (enregistrement + PDF) ✅ ✅
Laboratoire (demandes + résultats) ✅ ✅
Gestion des dépenses ✅ ✅
Rapports financiers (CA, dépenses, bénéfices) ✅ ✅
Notifications in-app + email ✅ ✅
Sauvegarde automatique planifiée ✅ ✅
Journal d’audit ✅ ✅
Paramètres de base ✅ ✅
Envoi SMS / WhatsApp ❌ ✅
Interface infirmier ❌ ✅
Gestion des assurances ❌ ✅
Application mobile patient ❌ ✅
Multi‑cliniques (multi‑tenancy) ❌ ✅
Cache Redis ❌ ✅

---

Document mis à jour – conforme aux spécifications client pour le MVP (JavaScript, React/Vite, MongoDB, pas de pharmacie, catégories d’âge, dépenses, sauvegarde auto, email uniquement).

```
```