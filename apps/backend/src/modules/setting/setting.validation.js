const { z } = require('zod');

const smtpConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().int().optional()
  // user and pass removed — credentials sourced from env vars only
});

const updateSettingSchema = z.object({
  clinicName: z.string().min(2).optional(),
  clinicAddress: z.string().min(5).optional(),
  clinicPhone: z.string().optional(),
  clinicEmail: z.string().email().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  defaultConsultationFee: z.number().int().nonnegative().optional(),
  smtpConfig: smtpConfigSchema.optional(),
  criticalThresholds: z.record(z.object({
    min: z.number(),
    max: z.number(),
    unit: z.string()
  }).refine(data => data.min <= data.max, {
    message: 'min must be <= max'
  })).optional(),
  notificationTemplates: z.record(z.string()).optional()
});

module.exports = {
  updateSettingSchema
};
