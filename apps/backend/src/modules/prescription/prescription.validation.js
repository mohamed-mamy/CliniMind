const { z } = require('zod');

const createPrescriptionSchema = z.object({
  patientId: z.string().length(24, 'Invalid ObjectId'),
  notes: z.string().optional(),
  drugs: z.array(z.object({
    drugName: z.string().min(1, 'Drug name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    duration: z.number().int().positive('Duration must be a positive integer'),
    instructions: z.string().optional()
  })).min(1, 'At least one drug is required')
});

module.exports = {
  createPrescriptionSchema,
};
