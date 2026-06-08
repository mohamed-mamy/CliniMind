process.env.MONGODB_URI = 'mongodb+srv://ClimMind:Nv1xd95rMGVHOBsn@cluster0.teo773l.mongodb.net/clinimind';

async function main() {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/modules/user/user.model');
  const user = await User.findOneAndUpdate(
    { username: 'admin' },
    { $set: { email: 'ahismail2005@gmail.com' } },
    { new: true }
  );
  console.log('Updated:', user?.username, '->', user?.email);
  await mongoose.disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
