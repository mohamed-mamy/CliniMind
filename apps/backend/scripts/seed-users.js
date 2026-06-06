const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/modules/user/user.model');

const USERS = [
  { username: 'directeur', password: 'admin123', role: 'director', fullName: 'Directeur Clinique', email: 'directeur@clinimind.com' },
  { username: 'medecin', password: 'medecin123', role: 'doctor', fullName: 'Dr. Ahmed Hassan', email: 'medecin@clinimind.com' },
  { username: 'dr.salim', password: 'salim123', role: 'doctor', fullName: 'Dr. Salim Ahmed', email: 'salim@clinimind.com' },
  { username: 'reception', password: 'recp123', role: 'receptionist', fullName: 'Aminata Diallo', email: 'reception@clinimind.com' },
  { username: 'technicien', password: 'lab123', role: 'lab_technician', fullName: 'Moussa Kane', email: 'technicien@clinimind.com' },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinimind';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const u of USERS) {
    const exists = await User.findOne({ username: u.username });
    if (!exists) {
      await User.create(u);
      console.log(`Created: ${u.username} / ${u.password} (${u.role})`);
    } else {
      console.log(`Skipped (exists): ${u.username}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => { console.error(err); process.exit(1); });
