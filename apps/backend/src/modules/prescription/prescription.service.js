const mongoose = require('mongoose');
const Prescription = require('./prescription.model');
const PrescriptionDrug = require('./prescriptionDrug.model');

/**
 * Create a new prescription
 */
const createPrescription = async (data, doctorId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const prescription = new Prescription({
      patientId: data.patientId,
      doctorId,
      notes: data.notes
    });
    await prescription.save({ session });

    const drugsToInsert = data.drugs.map(drug => ({
      ...drug,
      prescriptionId: prescription._id
    }));

    await PrescriptionDrug.insertMany(drugsToInsert, { session });

    await session.commitTransaction();
    session.endSession();

    // Fetch the complete prescription to return
    return await getPrescriptionById(prescription._id);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Get prescription details by ID
 */
const getPrescriptionById = async (id) => {
  const prescription = await Prescription.findById(id).lean();
  if (!prescription) {
    const error = new Error('Prescription not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const drugs = await PrescriptionDrug.find({ prescriptionId: id }).lean();
  
  return {
    ...prescription,
    drugs
  };
};

module.exports = {
  createPrescription,
  getPrescriptionById,
};
