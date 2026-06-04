const { sendSuccess, sendError } = require('../../utils/apiResponse');
const prescriptionService = require('./prescription.service');
const pdfGenerator = require('../../utils/pdfGenerator');
const mongoose = require('mongoose');

// Assuming Patient model is at ../patient/patient.model or similar
// We will require it to get patient details for the PDF
let Patient;
try {
  Patient = require('../patient/patient.model');
} catch (e) {
  // Fallback if not found
}

const createPrescription = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const prescription = await prescriptionService.createPrescription(req.body, doctorId);
    return sendSuccess(res, 201, prescription);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    next(error);
  }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid Prescription ID');
    }
    const prescription = await prescriptionService.getPrescriptionById(id);
    return sendSuccess(res, 200, prescription);
  } catch (error) {
    if (error.status === 404) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    next(error);
  }
};

const getPrescriptionPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid Prescription ID');
    }
    
    const prescription = await prescriptionService.getPrescriptionById(id);
    let patient = null;
    if (Patient) {
      patient = await Patient.findById(prescription.patientId).lean();
    }
    
    const doc = pdfGenerator.createPrescriptionPdf(prescription, patient);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${id}.pdf`);
    
    doc.pipe(res);
  } catch (error) {
    if (error.status === 404) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
  getPrescriptionPdf,
};
