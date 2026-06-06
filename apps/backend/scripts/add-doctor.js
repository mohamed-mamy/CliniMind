const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../src/modules/user/user.model');
  const doc = await User.create({ username: 'dr.fatima', password: 'fatima123', role: 'doctor', fullName: 'Dr. Fatima Zahra', email: 'fatima@clinimind.com' });
  console.log('Created:', doc.username, '/ fatima123');
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
