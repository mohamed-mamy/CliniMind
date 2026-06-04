const { z } = require('zod');

const updateNotificationSchema = z.object({
  isRead: z.boolean().optional()
});

module.exports = {
  updateNotificationSchema
};
