#!/bin/bash

# This script creates all the collections and indexes defined in docs/architecture.md
# using mongosh (MongoDB Shell).

# Define the MONGODB_URI explicitly or extract from .env
ENV_FILE="apps/backend/.env"

if [ -f "$ENV_FILE" ]; then
    echo "Loading MONGODB_URI from $ENV_FILE"
    # Extract MONGODB_URI value from .env file
    export MONGODB_URI=$(grep -v '^#' $ENV_FILE | grep MONGODB_URI | cut -d '=' -f2-)
else
    # Fallback default
    export MONGODB_URI="mongodb+srv://ClimMind:Nv1xd95rMGVHOBsn@cluster0.teo773l.mongodb.net/clinimind"
fi

if [ -z "$MONGODB_URI" ]; then
    echo "Error: MONGODB_URI is not set."
    exit 1
fi

echo "Connecting to MongoDB Atlas..."

mongosh "$MONGODB_URI" --eval '
  print("=== Initializing CliniMind Database ===");
  
  const collectionsToCreate = [
    "users",
    "patients",
    "medical_history",
    "appointments",
    "invoices",
    "invoice_items",
    "prescriptions",
    "prescription_drugs",
    "lab_requests",
    "lab_results",
    "expenses",
    "notifications",
    "settings",
    "user_logs",
    "counters"
  ];

  // 1. Create Collections
  collectionsToCreate.forEach(col => {
    try {
      db.createCollection(col);
      print("✅ Collection created: " + col);
    } catch (e) {
      // It will throw an error if the collection already exists
      print("⚠️ Collection might already exist: " + col);
    }
  });

  // 2. Create Indexes as specified in architecture.md
  print("\n=== Creating Indexes ===");

  // 7.1 Collection: users -> Index: username unique, role
  db.users.createIndex({ username: 1 }, { unique: true });
  db.users.createIndex({ role: 1 });
  print("✅ Indexes created for users");

  // 7.2 Collection: patients -> Index: fileNumber unique, fullName (texte)
  db.patients.createIndex({ fileNumber: 1 }, { unique: true });
  db.patients.createIndex({ fullName: "text" });
  print("✅ Indexes created for patients");

  // 7.4 Collection: appointments -> Index: doctorId + date + timeSlot (unique), patientId, status
  db.appointments.createIndex({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });
  db.appointments.createIndex({ patientId: 1 });
  db.appointments.createIndex({ status: 1 });
  print("✅ Indexes created for appointments");

  // 7.5 Collection: invoices -> Index: patientId, status, createdAt
  db.invoices.createIndex({ patientId: 1 });
  db.invoices.createIndex({ status: 1 });
  db.invoices.createIndex({ createdAt: 1 });
  print("✅ Indexes created for invoices");

  // 7.11 Collection: expenses -> Index: date, category
  db.expenses.createIndex({ date: 1 });
  db.expenses.createIndex({ category: 1 });
  print("✅ Indexes created for expenses");

  print("\n=== Database Initialization Completed ===");
'

echo "Script finished."
