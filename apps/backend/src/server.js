const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const app = require('./app');
const { seedInitialDirector } = require('./modules/user/user.service');
const { initSocket } = require('./socket');

// Initialize Cron Jobs
require('./jobs/appointmentReminder.job');
require('./jobs/paymentReminder.job');
require('./jobs/backup.job');
require('./jobs/cleanup.job');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinimind';

const pino = require('pino');
const logger = pino();

mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('Connected to MongoDB');
    await seedInitialDirector();
    
    const server = http.createServer(app);
    initSocket(server);
    
    server.listen(PORT, () => {
      console.log("HELLO I AM THE REAL SERVER ON PORT", PORT);
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
  });
