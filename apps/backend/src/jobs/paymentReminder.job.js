const cron = require('node-cron');
const Invoice = require('../modules/billing/invoice.model');
const Notification = require('../modules/notification/notification.model');
const User = require('../modules/user/user.model'); 

// Run daily at 00:00 (midnight)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('[Cron] Running paymentReminder job...');

    // Find unpaid or partially paid invoices
    const unpaidInvoices = await Invoice.find({
      status: { $in: ['unpaid', 'partial'] },
      remainingAmount: { $gt: 0 }
    }).populate('patientId').lean();

    const now = new Date();
    let count = 0;

    for (const invoice of unpaidInvoices) {
      const daysSinceCreation = Math.floor((now - new Date(invoice.createdAt)) / (1000 * 60 * 60 * 24));
      
      // J-1, J-3, J-7 logic
      if (daysSinceCreation === 1 || daysSinceCreation === 3 || daysSinceCreation === 7) {
        // Find staff to notify (director or receptionist)
        const staff = await User.find({ role: { $in: ['director', 'receptionist'] } }).lean();
        
        const notifications = staff.map(s => ({
          userId: s._id,
          type: 'payment_reminder',
          title: 'Facture impayée',
          body: `La facture #${invoice.invoiceNumber} pour ${invoice.patientId?.fullName || 'Patient inconnu'} est impayée depuis ${daysSinceCreation} jours. Montant restant : ${invoice.remainingAmount}.`,
          data: { invoiceId: invoice._id }
        }));
        
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          count++;
        }
      }
    }
    
    console.log(`[Cron] paymentReminder job completed. Generated alerts for ${count} invoices.`);
  } catch (error) {
    console.error('[Cron Error] paymentReminder job failed:', error);
  }
});
