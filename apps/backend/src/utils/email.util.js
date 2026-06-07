const nodemailer = require('nodemailer');
const Setting = require('../modules/setting/setting.model');

/**
 * Sends an email using SMTP configurations from database settings or environment variables.
 * @param {Object} options Email options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject
 * @param {string} options.text Plain text content
 * @param {string} options.html HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // 1. Fetch SMTP settings from DB (ClinicSettings singleton)
    let settings = null;
    try {
      settings = await Setting.findOne().lean();
    } catch (dbErr) {
      console.warn('[Email Util] Could not fetch settings from DB:', dbErr.message);
    }

    const host = settings?.smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = settings?.smtpConfig?.port || parseInt(process.env.SMTP_PORT, 10) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('[Email Util] SMTP credentials (SMTP_USER or SMTP_PASS) not configured. Skipping email dispatch.');
      return null;
    }

    // 2. Create nodemailer transport
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465 port, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const clinicName = settings?.clinicName || 'CliniMind';
    
    // 3. Send email
    const info = await transporter.sendMail({
      from: `"${clinicName}" <${user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Util] Email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Util Error] Failed to send email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
