const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'ahismail2005@gmail.com', pass: 'shsr osgx rbjg nygq' },
  tls: { rejectUnauthorized: false }
});
transporter.sendMail({
  from: '"Test" <ahismail2005@gmail.com>',
  to: 'ahismail2005@gmail.com',
  subject: 'Test SMTP',
  html: '<p>test</p>'
}).then(info => console.log('SENT:', info.messageId))
  .catch(err => console.log('FAIL:', err.message));
