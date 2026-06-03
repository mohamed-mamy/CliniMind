const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const patientController = require('./patient.controller');

const router = express.Router();

const createPatientSchema = z.object({
  fullName: z.string().min(2).max(100),
  ageCategory: z.enum(["0-1 an", "1-5 ans", "6-12 ans", "13-18 ans", "19-35 ans", "36-50 ans", "51-65 ans", "65+ ans"]),
  gender: z.enum(['M', 'F']),
  bloodType: z.string().optional(),
  phonePrimary: z.string(),
  phoneSecondary: z.string().optional(),
  email: z.string().email().optional(),
  allergies: z.array(z.object({
    type: z.enum(['medication', 'food', 'latex', 'other']),
    description: z.string()
  })).optional(),
  chronicDiseases: z.array(z.string()).optional()
});

const updatePatientSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  ageCategory: z.enum(["0-1 an", "1-5 ans", "6-12 ans", "13-18 ans", "19-35 ans", "36-50 ans", "51-65 ans", "65+ ans"]).optional(),
  gender: z.enum(['M', 'F']).optional(),
  bloodType: z.string().optional(),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  email: z.string().email().optional()
});

const updateMedicalHistorySchema = z.object({
  allergies: z.array(z.object({
    type: z.enum(['medication', 'food', 'latex', 'other']),
    description: z.string()
  })).optional(),
  chronicDiseases: z.array(z.string()).optional(),
  surgeries: z.array(z.string()).optional(),
  currentTreatments: z.array(z.string()).optional(),
  familyHistory: z.string().optional(),
  confidentialNotes: z.string().optional()
});

router.use(requireAuth);

router.post('/', requireRoles(['director', 'receptionist']), validate(createPatientSchema), patientController.createPatient);
router.get('/', requireRoles(['director', 'doctor', 'receptionist']), patientController.getPatients);
router.get('/:id', requireRoles(['director', 'doctor', 'receptionist']), patientController.getPatientById);
router.put('/:id', requireRoles(['director', 'receptionist']), validate(updatePatientSchema), patientController.updatePatient);
router.delete('/:id', requireRoles(['director']), patientController.deletePatient);

router.get('/:id/history', requireRoles(['director', 'doctor']), patientController.getPatientHistory);
router.put('/:id/medical-history', requireRoles(['director', 'doctor']), validate(updateMedicalHistorySchema), patientController.updateMedicalHistory);
router.get('/:id/medical-history', requireRoles(['director', 'doctor']), patientController.getMedicalHistory);

module.exports = router;
