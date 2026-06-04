const cron = require('node-cron');
const Appointment = require('../modules/appointment/appointment.model');
const Notification = require('../modules/notification/notification.model');
const Patient = require('../modules/patient/patient.model');

// Run daily at 09:00 AM
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('[Cron] Running appointmentReminder job...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: tomorrow, $lte: endOfTomorrow },
      status: 'scheduled'
    }).populate('patientId doctorId').lean();

    for (const appt of appointments) {
      // 1. Create in-app notification for the doctor
      await Notification.create({
        userId: appt.doctorId._id,
        type: 'appointment_reminder',
        title: 'Rappel de rendez-vous',
        body: `Vous avez un rendez-vous avec ${appt.patientId.fullName} demain à ${appt.timeSlot}.`,
        data: { appointmentId: appt._id }
      });

      // 2. Send email to patient (placeholder for email service)
      // if (appt.patientId.email) {
      //   await sendEmail(appt.patientId.email, ...);
      // }
    }
    
    console.log(`[Cron] appointmentReminder job completed. Reminded ${appointments.length} appointments.`);
  } catch (error) {
    console.error('[Cron Error] appointmentReminder job failed:', error);
  }
});
