```markdown
# Cahier des charges professionnel – CliniMind  
**Système de gestion intégré pour cliniques médicales de taille moyenne**

**Version 1.0 – Prêt pour le développement**

---

## Table des matières

1. Introduction  
2. Rôles principaux et permissions  
3. Interface du directeur (gestionnaire / médecin-chef)  
4. Interface du médecin  
5. Interface de l’accueil / secrétariat  
6. Interface du technicien de laboratoire  
7. Interface du pharmacien  
8. Interface de l’infirmier (V2)  
9. Modèle de base de données (détaillé)  
10. Architecture technique et technologies proposées  
11. Flux principaux du système  
12. Fonctionnalités intelligentes (Smart Features)  
13. Sécurité et conformité  
14. Périmètre de livraison (MVP vs V2)  
15. Remarques complémentaires pour le développement  

---

## 1. Introduction

**CliniMind** est une plateforme complète de gestion de clinique médicale, destinée à numériser l’ensemble des processus : administratifs, cliniques, financiers et logistiques.  
Le système repose sur trois piliers :  

- **Centralisation des données** – dossiers patients, historiques médicaux, rendez‑vous, facturation, laboratoire, pharmacie.  
- **Automatisation** – génération de rappels, alertes de stocks, notifications de résultats critiques.  
- **Rôles distincts** – chaque acteur (directeur, médecin, secrétariat, laborantin, pharmacien) dispose d’une interface adaptée.

---

## 2. Rôles principaux et permissions

| Rôle                  | Responsabilités principales                                                                 | Permissions refusées                                                      |
|-----------------------|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| **Directeur**         | Administration complète (utilisateurs, tarifs, rapports financiers, paramètres, suppression) | Aucune restriction                                                         |
| **Médecin**           | Consultation dossier patient, prescription, demande d’analyses, notes médicales               | Accès finances, gestion utilisateurs, suppression de données               |
| **Accueil / Secrétariat** | Gestion patients, rendez‑vous, facturation, encaissement                               | Suppression définitive d’un patient, modification des données médicales    |
| **Technicien labo**   | Saisie des résultats d’analyses, visualisation des demandes                                  | Accès aux données financières, rendez‑vous, dossiers médicaux complets     |
| **Pharmacien**        | Gestion du stock, dispensation des prescriptions, alertes de péremption                      | Accès aux dossiers patients complets, facturation, paramètres cliniques    |
| **Infirmier** (V2)    | Suivi des constantes, soins, vaccination                                                    | Gestion financière, prescriptions                                          |

---

## 3. Interface du directeur (gestionnaire / médecin‑chef)

### 3.1 Tableau de bord (Dashboard)

**Cartes statistiques (temps réel)**  

- Nombre total de patients  
- Nombre de médecins  
- Nombre de secrétaires  
- Nombre de techniciens laboratoire  
- Nombre de pharmaciens  
- Rendez‑vous du jour  
- Patients en attente aujourd’hui  
- Analyses en attente au laboratoire  
- Médicaments sous seuil de stock  
- Médicaments expirant dans 30 jours  
- Chiffre d’affaires (jour / semaine / mois)  
- Bénéfice net (CA – dépenses)  
- Nouvelles notifications non lues  

**Graphiques**  

- Évolution du CA journalier sur le mois (courbe)  
- Répartition des services les plus demandés (consultations, analyses, médicaments) – diagramme circulaire  
- Performance des médecins (nombre de patients vus) – histogramme  
- Proportion des factures payées vs impayées – diagramme circulaire  

*Exclus du tableau de bord directeur :*  
- Détails diagnostiques confidentiels  
- Modification des résultats de laboratoire

---

### 3.2 Gestion des patients

**Création d’un nouveau patient**  

Informations de base :  
- Numéro de dossier (auto‑généré)  
- Nom complet  
- Date de naissance  
- Sexe  
- Groupe sanguin (optionnel)  
- Téléphone principal, secondaire (optionnel), e‑mail (optionnel)  

Informations médicales de base :  
- Allergies (texte libre + liste : médicamenteuse, alimentaire, latex, autre)  
- Maladies chroniques (sélection multiple : diabète, hypertension, asthme, etc.)  
- Notes confidentielles (réservées au médecin)  

**Liste des patients** (tableau) :  

| N° dossier | Nom complet | Téléphone | Nb visites | Dernière visite | Actions                          |
|------------|-------------|-----------|------------|----------------|----------------------------------|
| ...        | ...         | ...       | ...        | ...            | Voir, Modifier, Supprimer, Message |

**Suppression définitive** :  
- Uniquement par le directeur.  
- Impossible si le patient a des factures ou des résultats d’analyse enregistrés.  

**Fiche patient détaillée**  

- *Informations personnelles*  
- *Antécédents médicaux* : maladies chroniques, allergies, interventions, traitements en cours  
- *Visites et rendez‑vous* : tableau (date, médecin, motif, statut : présent/absent/annulé)  
- *Ordonnances antérieures* : date, médecin, liste des médicaments  
- *Résultats de laboratoire / imagerie* : chaque demande avec résultat, possibilité de télécharger le PDF  
- *Factures et paiements* : liste (date, montant, statut : payé, impayé, partiel)

---

### 3.3 Gestion des rendez‑vous (planning)

**Création d’un rendez‑vous**  

- Médecin (liste déroulante)  
- Date  
- Créneau horaire (précision 15 min)  
- Patient (recherche par nom ou n° dossier)  
- Motif (texte court)  
- Type : consultation normale, suivi, urgence, contrôle périodique  

**Vérification automatique** :  
- Conflit avec un autre rendez‑vous du même médecin → interdiction.  
- Envoi d’une notification (e‑mail / SMS) au patient.  

**Liste des rendez‑vous (interface accueil)**  

- Rendez‑vous du jour, triés par heure.  
- Chaque ligne : patient, médecin, heure, statut.  
- Boutons : « Confirmer présence », « Annuler », « Replanifier ».  

**Files d’attente**  

- Patients présents mais non encore vus.  
- Le secrétariat peut réordonner la liste (priorité urgence).

---

### 3.4 Facturation et encaissement

**Création d’une facture** (à l’arrivée du patient)  

- Sélection du patient  
- Ajout de prestations :  
  - Consultation médecin (tarif automatique selon médecin)  
  - Analyses de laboratoire (choix dans la grille tarifaire)  
  - Médicaments (uniquement au moment de la dispensation effective en pharmacie)  
- Remise (pourcentage ou montant fixe – autorisation directeur requise)  
- Total calculé automatiquement  

**Modes de paiement** :  

- Espèces  
- Carte bancaire (terminal)  
- Virement  
- Assurance (société – génération d’une créance)  
- Autre  

**Actions post‑paiement** :  

- Impression de la facture (PDF)  
- Envoi optionnel par WhatsApp au patient  

**Restrictions** :  

- Une facture payée ne peut être modifiée.  
- Seul le directeur peut annuler un paiement et modifier la facture.  

**Suivi des impayés** :  

- Liste des factures impayées ou partiellement réglées.  
- Bouton « Rappel de paiement » (envoi automatique d’un message).  
- Possibilité de créer un échéancier (directeur uniquement).

---

### 3.5 Prescription électronique

**Création d’une ordonnance**  

Depuis le dossier patient ou depuis la facture :  

- Recherche du médicament (base de données interne)  
- Dosage (texte)  
- Durée (nombre de jours)  
- Instructions (texte)  

**À l’enregistrement** :  

- L’ordonnance est envoyée automatiquement à la pharmacie interne.  
- Elle apparaît dans la file des prescriptions à dispenser.  

**Restrictions** :  

- Impossible de modifier une ordonnance après dispensation partielle.  
- La dispensation d’un médicament non disponible en stock est bloquée (alerte).

---

### 3.6 Laboratoire d’analyses

**Demande d’analyse** (par le médecin) :  

- Depuis le dossier patient, sélection des analyses souhaitées (liste multiple).  
- Priorité : normale / urgente.  
- La demande est transmise au laboratoire.  

**Interface technicien de laboratoire** :  

- Liste des demandes en attente (triées par priorité).  
- En cliquant sur une demande :  
  - Affichage des données patient et des analyses demandées.  
  - Champs de saisie des résultats (texte, numérique, booléen positif/négatif).  
- Bouton « Enregistrer les résultats ».  

**Après enregistrement** :  

- Résultats visibles immédiatement dans le dossier patient.  
- Notification envoyée au médecin (système interne).  

**Résultats critiques** :  

- Des plages critiques peuvent être définies par paramètre.  
- Si le résultat est hors plage : alerte immédiate au médecin + notification au directeur.

---

### 3.7 Pharmacie interne et gestion des stocks

**Dispensation des médicaments**  

Interface du pharmacien :  

- Liste des ordonnances non délivrées.  
- Sélection d’une ordonnance → affichage des médicaments avec quantités prescrites.  
- Vérification automatique de la disponibilité (stock suffisant).  
- Bouton « Délivrer » → le stock est déduit automatiquement.  

**Si rupture** :  

- Alerte au pharmacien.  
- Possibilité de créer une demande d’achat (génère automatiquement une écriture dans les dépenses).  

**Gestion du stock**  

Ajout d’un médicament :  

- Nom (DCI + commercial)  
- Concentration  
- Forme (comprimés, sirop, injectable)  
- Quantité initiale  
- Seuil d’alerte  
- Date de péremption (critique)  
- Prix d’achat et prix de vente  

**Alertes automatiques** :  

- Stock inférieur au seuil minimal.  
- Péremption dans ≤ 30 jours.  
- Péremption dépassée → interdiction de dispensation.

---

### 3.8 Rapports et analyse décisionnelle

**Rapports financiers**  

- CA par jour / mois / an (détail par médecin, par service)  
- Liste des factures impayées  
- Relevés des créances assurance (par société)  
- Dépenses (salaires, loyer, fournitures, achats pharmacie)  

**Rapports médicaux et administratifs**  

- Top 10 des médicaments les plus délivrés  
- Médicaments expirés ou proches expiration  
- Analyses les plus fréquentes  
- Statistiques rendez‑vous (par médecin, taux de présence/absence)  

**Export**  

- Tous les rapports exportables en Excel / PDF.

---

### 3.9 Paramètres généraux

**Paramètres de la clinique**  

- Nom, logo (upload image), adresse, téléphone, e‑mail officiel  
- Tarif par défaut de la consultation (modifiable par médecin)  

**Paramètres d’envoi (e‑mail / SMS / WhatsApp)**  

- Serveur SMTP  
- Modèles de messages : confirmation rendez‑vous, rappel, facture, résultat d’analyse  

**Gestion des utilisateurs et rôles**  

- Création de comptes (nom d’utilisateur, mot de passe temporaire, rôle)  
- Modification fine des droits (RBAC avancé – réservé au directeur)  

**Sauvegarde (Backup)**  

- Sauvegarde manuelle (base de données + fichiers)  
- Restauration (avec avertissement d’écrasement)  
- Planification quotidienne ou hebdomadaire  

**Journal d’audit (Logs)**  

- Chaque action critique (modification de tarif, suppression patient, paiement) est enregistrée :  
  - Utilisateur, adresse IP, timestamp, anciennes/nouvelles valeurs  
- Consultable uniquement par le directeur.

---

## 4. Interface du médecin

**Tableau de bord médecin**  

- Prochains rendez‑vous du jour  
- Nombre de patients en salle d’attente  
- Derniers résultats d’analyses critiques  
- Notifications non lues  

**Mes patients**  

- Recherche / accès au dossier complet (antécédents, notes, résultats, prescriptions antérieures)  

**Prescription et analyses**  

- Rédiger une ordonnance (avec accès au stock de la pharmacie)  
- Prescrire des analyses de laboratoire  

**Rendez‑vous**  

- Visualisation de son agenda uniquement  
- Possibilité de bloquer des créneaux (congés, réunions)  

**Restrictions médecin**  

- Pas d’accès aux tarifs, aux encaissements, ni aux rapports financiers  
- Ne peut ni créer ni supprimer des utilisateurs  

---

## 5. Interface de l’accueil / secrétariat

**Gestion des patients**  

- Création et modification des fiches patients (partie administrative uniquement – pas d’antécédents médicaux)  

**Planification des rendez‑vous**  

- Visualisation complète de l’agenda de tous les médecins  
- Prise, modification, annulation de rendez‑vous  
- Gestion de la file d’attente  

**Facturation**  

- Création des factures, encaissement, édition de reçus  
- Suivi des impayés et envoi de rappels  

**Restrictions**  

- Pas de suppression définitive de patient  
- Pas d’accès aux notes médicales confidentielles  
- Pas d’accès aux rapports financiers globaux (CA, bénéfices)  

---

## 6. Interface du technicien de laboratoire

**Liste des demandes**  

- Demandes nouvelles avec priorité (normale / urgente)  

**Saisie des résultats**  

- Interface dédiée par demande  
- Possibilité de téléverser un fichier PDF (ex : compte rendu d’imagerie)  

**Notifications**  

- Aucun accès aux données financières ou aux rendez‑vous  
- Peut voir les informations patient strictement nécessaires à l’identification  

---

## 7. Interface du pharmacien

**Dispensation**  

- File des ordonnances non délivrées  
- Vérification de disponibilité, déduction de stock  

**Gestion des stocks**  

- Ajout, modification, suppression de médicaments  
- Consultation des alertes de rupture et de péremption  
- Édition des rapports de stock (entrées, sorties, inventaire)  

**Restrictions**  

- Pas d’accès aux dossiers patients complets (seulement le nom, le médecin prescripteur et la prescription)  
- Pas d’accès à la facturation ni aux statistiques financières  

---

## 8. Interface de l’infirmier (V2 – livraison ultérieure)

- Suivi des constantes (tension, pouls, température, glycémie)  
- Administration de soins / vaccins  
- Possibilité d’ajouter des notes de suivi dans le dossier patient  
- Ne peut ni prescrire, ni modifier une ordonnance, ni voir les données financières  

---

## 9. Modèle de base de données (MongoDB / Mongoose)

| Collection                 | Rôle                                                                 |
|----------------------------|----------------------------------------------------------------------|
| `users`                    | Comptes utilisateurs (mot de passe haché, rôle, permissions)         |
| `patients`                 | Informations de base des patients                                    |
| `medical_history`          | Maladies chroniques, allergies, interventions, traitements réguliers |
| `doctors`                  | Données spécifiques aux médecins (spécialité, tarif consultation)    |
| `receptionists`            | Données secrétaires                                                  |
| `lab_technicians`          | Données techniciens de laboratoire                                   |
| `pharmacists`              | Données pharmaciens                                                  |
| `appointments`             | Rendez‑vous (patient, médecin, date, statut)                         |
| `invoices`                 | Factures (patient, total, payé, reste, statut)                       |
| `invoice_items`            | Lignes de facture (type : consultation, analyse, médicament…)        |
| `prescriptions`            | Prescriptions (patient, médecin, date)                               |
| `prescription_drugs`       | Médicaments prescrits (dose, durée, instructions, statut dispensation) |
| `lab_requests`             | Demandes d’analyses (patient, médecin, priorité)                     |
| `lab_results`              | Résultats d’analyses (texte, numérique, fichier attaché)             |
| `pharmacy_inventory`       | Médicaments (nom, concentration, quantité, seuil, péremption, prix)  |
| `pharmacy_transactions`    | Mouvements de stock (entrée, sortie, raison)                         |
| `insurance_claims`         | Créances auprès des compagnies d’assurance                           |
| `settings`                 | Paramètres généraux (clinique, SMTP, modèles)                        |
| `user_logs`                | Journal d’audit                                                      |
| `notifications`            | Notifications internes (lues/non lues)                               |

---

## 10. Architecture technique et technologies proposées

| Couche              | Technologie retenue                    | Justification                                                              |
|---------------------|----------------------------------------|----------------------------------------------------------------------------|
| **Frontend**        | Next.js (App Router) + TypeScript + Tailwind CSS | SSR, performances, expérience développeur optimisée                      |
| **Backend**         | Node.js + Express.js                   | Léger, asynchrone, vaste écosystème                                       |
| **Base de données** | MongoDB (Atlas ou auto‑hébergé)        | Flexibilité pour données hétérogènes                                      |
| **Temps réel**      | Socket.IO                              | Notifications instantanées (résultats critiques, rappels rendez‑vous)    |
| **Authentification**| JWT + bcrypt                           | Stateless, sécurisé                                                       |
| **Génération PDF**  | Puppeteer / jsPDF                      | Factures, ordonnances, rapports                                           |
| **Messagerie**      | Nodemailer (SMTP) + API WhatsApp Business | Confirmations, rappels, factures                                         |
| **Tâches planifiées**| node‑cron                             | Vérification stocks, rappels impayés, nettoyage logs                     |
| **Hébergement**     | VPS (DigitalOcean) ou Docker + Kubernetes | Contrôle total, évolutivité                                               |

---

## 11. Flux principaux du système

### 11.1 Enregistrement d’une nouvelle analyse par le médecin

1. Le médecin ouvre le dossier patient.  
2. Clique sur « Demander des analyses », sélectionne les tests, priorité.  
3. Validation → création d’un document `lab_requests`.  
4. Le laborantin voit la demande dans sa liste.  

### 11.2 Saisie des résultats par le laborantin

1. Le laborantin ouvre la demande.  
2. Remplit les champs de résultats.  
3. Sauvegarde → document `lab_results` créé.  
4. Une notification `Socket.IO` est envoyée au médecin.  

### 11.3 Dispensation d’une prescription

1. Le pharmacien consulte la liste des ordonnances non délivrées.  
2. Sélectionne une ordonnance → vérification stock.  
3. Clique « Délivrer » → mise à jour `pharmacy_inventory` (décrémentation).  
4. Statut de chaque ligne dans `prescription_drugs` passe à `delivered`.  

### 11.4 Paiement d’une facture et impact stock médicaments

1. Le secrétariat crée la facture (consultation + analyses).  
2. Si des médicaments sont prescrits, ils ne sont pas facturés tant qu’ils ne sont pas délivrés.  
3. À la délivrance, le pharmacien déclenche la mise à jour de la facture (ajout des montants des médicaments).  
4. Le patient règle le solde → statut `paid`.  

---

## 12. Fonctionnalités intelligentes (V2 ou progressive)

| Fonctionnalité                         | Mécanisme                                      | Bénéfice                                                         |
|----------------------------------------|------------------------------------------------|------------------------------------------------------------------|
| **Rappel de paiement impayé**          | Cron + analyse `invoices`                     | Envoi automatique à J‑7, J‑3, J‑1                               |
| **Prédiction de rupture de stock**     | Analyse de tendance des sorties               | Anticipation des commandes                                       |
| **Alerte comportement critique**       | Seuil paramétrable pour résultats de labo     | Prévention des urgences médicales                               |
| **Optimisation du planning médecin**   | Algorithme simple sur historique de présence  | Suggestion de créneaux pour réduire l’attente                   |
| **Tableau de bord analytique avancé**  | Aggrégations MongoDB / pipeline               | Visualisation rapide des KPI, meilleurs médecins, analyses fréquentes |

---

## 13. Sécurité et conformité

### 13.1 Contrôle d’accès (RBAC)  

- Chaque API vérifie le `role` contenu dans le JWT.  
- Exemple : `DELETE /api/patients` interdit à tout rôle autre que `director`.  

### 13.2 Protection des données  

- Mots de passe hachés avec bcrypt.  
- Données médicales et financières séparées : les médecins ne voient pas les montants, les secrétaires ne voient pas les notes médicales.  
- HTTPS obligatoire en production.  

### 13.3 Journal d’audit  

- Toute opération sensible est tracée : suppression de patient, modification de tarif, annulation de facture, changement de rôle.  

### 13.4 Sauvegarde  

- Sauvegarde complète (base + fichiers) tous les jours à 02h00.  
- Conservation 30 jours.  
- Procédure de restauration documentée.  

---

## 14. Périmètre de livraison (MVP vs V2)

| Fonctionnalité                                    | MVP   | V2    |
|---------------------------------------------------|-------|-------|
| Authentification & rôles (directeur, médecin, secrétariat, laborantin, pharmacien) | ✅    | ✅    |
| Gestion des patients (CRUD, dossier médical basique) | ✅    | ✅    |
| Planification des rendez‑vous                    | ✅    | ✅    |
| Facturation et encaissement (hors intégration assurance) | ✅    | ✅    |
| Prescription électronique et dispensation         | ✅    | ✅    |
| Gestion de stock pharmacie (entrées/sorties, alertes) | ✅    | ✅    |
| Laboratoire (demandes + saisie résultats)         | ✅    | ✅    |
| Rapports financiers (CA, impayés)                 | ✅    | ✅    |
| Notifications internes (in‑app)                  | ✅    | ✅    |
| Paramètres de base (clinique, utilisateurs)       | ✅    | ✅    |
| Envoi e‑mails / SMS / WhatsApp                    | ✅ (e‑mail) | ✅ (tous canaux) |
| Interface infirmier                               | ❌    | ✅    |
| Gestion des assurances (créances, tiers payant)   | ❌    | ✅    |
| Application mobile patient (prise de rendez‑vous, résultats) | ❌ | ✅ |
| Prédiction de rupture de stock                    | ❌    | ✅    |
| Multi‑cliniques (multi‑tenancy)                   | ❌    | ✅    |

---

## 15. Remarques complémentaires pour le développement

- **Langues** : support français + arabe (RTL pour l’arabe).  
- **Fichiers joints** (résultats d’analyses, documents patients) : stocker sur S3 / Cloudinary, conserver l’URL en base.  
- **Performance** : la page du dossier patient avec historique complet doit rester rapide même pour 1000+ visites.  
- **Tests** : prévoir des jeux de données réalistes (500 patients, 10 médecins, 10 000 factures) pour valider les temps de réponse.  

---

**Fin du cahier des charges – CliniMind v1.0**  
*Document prêt à être remis à l’équipe de développement (frontend, backend, base de données).*
```