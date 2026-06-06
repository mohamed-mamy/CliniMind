const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../src/modules/user/user.model');
  const users = await User.find({ username: { $in: ['directeur','medecin','dr.salim','reception','technicien'] } }).select('username role fullName');
  users.forEach(u => console.log(u.username, '-', u.role, '-', u.fullName));
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
