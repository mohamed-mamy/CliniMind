const cron = require('node-cron');
const Appointment = require('../modules/appointment/appointment.model');
const Notification = require('../modules/notification/notification.model');
const { sendEmail } = require('../utils/email.util');
const { emitNotification } = require('../socket');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Get start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch all active appointments for today
    const appointments = await Appointment.find({
      date: today,
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('patientId doctorId');

    for (const appt of appointments) {
      if (!appt.doctorId || !appt.patientId) continue;

      // Construct appointment date-time in UTC
      const apptDate = new Date(appt.date);
      const [hours, minutes] = appt.timeSlot.split(':').map(Number);
      apptDate.setUTCHours(hours, minutes, 0, 0);

      const diffMs = apptDate.getTime() - now.getTime();
      const diffMinutes = diffMs / (60 * 1000);

      // Check if starting in exactly 5 minutes (within a 1-minute window: 4.5 to 5.5 minutes)
      if (diffMinutes >= 4.5 && diffMinutes <= 5.5) {
        
        // Check if we already sent the 5min reminder to prevent duplicates
        const alreadyNotified = await Notification.findOne({
          userId: appt.doctorId._id,
          type: 'appointment_5min_reminder',
          'data.appointmentId': appt._id
        });

        if (!alreadyNotified) {
          console.log(`[Cron] Sending 5-minute reminder to Dr. ${appt.doctorId.fullName} for appointment ${appt._id}`);

          // 1. Save notification in database
          const notification = await Notification.create({
            userId: appt.doctorId._id,
            type: 'appointment_5min_reminder',
            title: 'موعد قريب جداً / Rendez-vous imminent',
            body: `تذكير: لديك موعد بعد 5 دقائق مع المريض ${appt.patientId.fullName} (الساعة ${appt.timeSlot}).`,
            data: { appointmentId: appt._id }
          });

          // 2. Emit notification in real-time
          emitNotification(appt.doctorId._id, notification);

          // 3. Dispatch SMTP Email
          if (appt.doctorId.email) {
            try {
              await sendEmail({
                to: appt.doctorId.email,
                subject: `تذكير بموعد قريب: ${appt.patientId.fullName} - ${appt.timeSlot}`,
                text: `تذكير: لديك موعد بعد 5 دقائق مع المريض ${appt.patientId.fullName} (الساعة ${appt.timeSlot}).`,
                html: `
                  <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h3 style="color: #0284c7;">تذكير بموعد قريب جداً</h3>
                    <p>أهلاً دكتور <strong>${appt.doctorId.fullName}</strong>،</p>
                    <p>نود تذكيركم بأن لديكم موعداً مجدولاً بعد 5 دقائق مع المريض: <strong>${appt.patientId.fullName}</strong>.</p>
                    <p>الوقت المجدول: <strong>${appt.timeSlot}</strong></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #999;">CliniMind Center - نظام إدارة العيادات المتكامل</p>
                  </div>
                `
              });
            } catch (mailErr) {
              console.error('[Cron Error] Failed to send doctor email reminder:', mailErr.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Cron Error] appointmentNearReminder job failed:', error);
  }
});
