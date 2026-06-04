const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');

const app = express();

app.use(pinoHttp());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/v1/auth', require('./modules/auth/auth.routes'));
app.use('/v1/users', require('./modules/user/user.routes'));
app.use('/v1/patients', require('./modules/patient/patient.routes'));
app.use('/v1/appointments', require('./modules/appointment/appointment.routes'));
app.use('/v1/invoices', require('./modules/billing/billing.routes'));
app.use('/v1/prescriptions', require('./modules/prescription/prescription.routes'));
app.use('/v1/lab', require('./modules/lab/lab.routes'));
app.use('/v1/expenses', require('./modules/expense/expense.routes'));
app.use('/v1/reports', require('./modules/report/report.routes'));
app.use('/v1/notifications', require('./modules/notification/notification.routes'));
app.use('/v1/settings', require('./modules/setting/setting.routes'));
app.use('/v1/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/v1/audit-logs', require('./modules/audit/audit.routes'));
// Global error handler
app.use((err, req, res, next) => {
  req.log.error(err);
  res.status(err.status || 500).json({
    success: false,
    data: null,
    error: {
      code: err.code || 'INTERNAL',
      message: err.message || 'Internal Server Error',
      fields: err.fields || undefined
    },
    meta: null
  });
});

module.exports = app;
