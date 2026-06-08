const nodemailer = require('nodemailer');
const Setting = require('../modules/setting/setting.model');

function getSmptFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (host && smtpUser && smtpPass) {
    return { host, port: parseInt(port, 10) || 587, smtpUser, smtpPass };
  }
  return null;
}

async function sendEmail({ to, subject, html }) {
  const settings = await Setting.findOne().lean();
  let smtpConfig = settings?.smtpConfig;

  if (!smtpConfig?.host || !smtpConfig?.smtpUser || !smtpConfig?.smtpPass) {
    smtpConfig = getSmptFromEnv();
  }

  if (!smtpConfig) {
    throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env or configure in Settings.');
  }

  const smtpPort = parseInt(smtpConfig.port, 10) || 587;

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpConfig.smtpUser, pass: smtpConfig.smtpPass },
    tls: { rejectUnauthorized: false }
  });

  const clinicName = settings?.clinicName || process.env.CLINIC_NAME || 'Clinic';

  await transporter.sendMail({
    from: `"${clinicName}" <${smtpConfig.smtpUser}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };
