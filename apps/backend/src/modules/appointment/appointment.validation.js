const { z } = require('zod');

const createAppointmentSchema = z.object({
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  date: z.string().datetime(), // ISO 8601 string
  timeSlot: z.string().min(4).max(5), // e.g. "14:30"
  duration: z.number().int().positive().optional(),
  reason: z.string().max(200).optional(),
  type: z.enum(['normal', 'followup', 'emergency', 'checkup']).optional()
});

const updateAppointmentSchema = z.object({
  doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional(),
  date: z.string().datetime().optional(),
  timeSlot: z.string().min(4).max(5).optional(),
  duration: z.number().int().positive().optional(),
  reason: z.string().max(200).optional(),
  type: z.enum(['normal', 'followup', 'emergency', 'checkup']).optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional()
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema
};
