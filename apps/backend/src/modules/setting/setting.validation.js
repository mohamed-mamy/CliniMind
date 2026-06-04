const { z } = require('zod');

const smtpConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().int().optional(),
  user: z.string().optional(),
  pass: z.string().optional()
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
  })).optional(),
  notificationTemplates: z.record(z.string()).optional()
});

module.exports = {
  updateSettingSchema
};
