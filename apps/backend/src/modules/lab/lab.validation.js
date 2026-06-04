const { z } = require('zod');

const createLabRequestSchema = z.object({
  patientId: z.string().length(24, 'Invalid ObjectId'),
  tests: z.array(z.string().min(1, 'Test name cannot be empty')).min(1, 'At least one test is required'),
  priority: z.enum(['normal', 'urgent']).optional().default('normal')
});

const enterLabResultsSchema = z.object({
  results: z.array(z.object({
    testName: z.string().min(1, 'Test name is required'),
    resultText: z.string().optional(),
    resultNumeric: z.number().optional(),
    unit: z.string().optional(),
    normalRange: z.string().optional(),
    attachmentUrl: z.string().url('Invalid URL').optional()
  })).min(1, 'At least one result is required')
});

module.exports = {
  createLabRequestSchema,
  enterLabResultsSchema,
};
