const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  clinicName: { type: String, required: true, default: 'CliniMind Center' },
  clinicAddress: { type: String, required: true, default: 'Nouakchott, Mauritanie' },
  clinicPhone: { type: String, required: true, default: '+22236123456' },
  clinicEmail: { type: String, required: true, default: 'contact@clinimind.com' },
  logoUrl: { type: String, default: '' },
  defaultConsultationFee: { type: Number, required: true, default: 500 },
  smtpConfig: {
    host: { type: String, default: 'smtp.gmail.com' },
    port: { type: Number, default: 587 }
    // user and pass removed — read from SMTP_USER / SMTP_PASS env vars at send time
  },
  criticalThresholds: {
    type: Map,
    of: new mongoose.Schema({
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      unit: { type: String, required: true }
    }, { _id: false }),
    default: {
      glycemia: { min: 0.7, max: 1.1, unit: 'g/L' }
    }
  },
  notificationTemplates: {
    type: Map,
    of: String,
    default: {
      appointmentReminder: "Bonjour {{patientName}}, rappel de votre rendez-vous le {{date}} à {{time}}."
    }
  }
});

// We generally only have one settings document
module.exports = mongoose.model('Setting', settingSchema);
