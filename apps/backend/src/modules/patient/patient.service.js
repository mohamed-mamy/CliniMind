const mongoose = require('mongoose');
const Patient = require('./patient.model');
const AuditLog = require('../audit/audit.model');

class PatientService {
  async createPatient(data, userId) {
    const patient = new Patient({ ...data, createdBy: userId });
    await patient.save();
    return patient;
  }

  async getPatients({ page = 1, limit = 20, search, ageCategory, gender }) {
    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phonePrimary: { $regex: search, $options: 'i' } }
      ];
      if (!isNaN(search)) {
        query.$or.push({ fileNumber: Number(search) });
      }
    }
    if (ageCategory) query.ageCategory = ageCategory;
    if (gender) query.gender = gender;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Patient.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Patient.countDocuments(query)
    ]);

    return { data, meta: { page: Number(page), limit: Number(limit), total } };
  }

  async getPatientById(id, role) {
    const patient = await Patient.findById(id);
    if (!patient) {
      const err = new Error('Patient not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const patientObj = patient.toObject();
    
    // Field-level access control
    if (role === 'receptionist' || role === 'lab_technician') {
      if (patientObj.medicalHistory) {
        delete patientObj.medicalHistory.confidentialNotes;
      }
    }
    
    if (role === 'lab_technician') {
      delete patientObj.medicalHistory;
    }

    return patientObj;
  }

  async updatePatient(id, data) {
    const patient = await Patient.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true });
    if (!patient) {
      const err = new Error('Patient not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return patient;
  }

  async deletePatient(id, userId) {
    const hasAppointments = mongoose.models.Appointment ? await mongoose.model('Appointment').exists({ patientId: id }) : false;
    const hasInvoices = mongoose.models.Invoice ? await mongoose.model('Invoice').exists({ patientId: id }) : false;
    const hasLabRequests = mongoose.models.LabRequest ? await mongoose.model('LabRequest').exists({ patientId: id }) : false;

    if (hasAppointments || hasInvoices || hasLabRequests) {
      const err = new Error('Patient has existing records and cannot be deleted');
      err.status = 409;
      err.code = 'INVALID_STATE';
      throw err;
    }

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      const err = new Error('Patient not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (userId) {
      await AuditLog.create({
        userId,
        action: 'delete_patient',
        details: `Deleted patient ${patient.fullName} (File: ${patient.fileNumber})`,
        oldValues: patient.toObject(),
        resourceType: 'Patient',
        resourceId: id
      });
    }

    return patient;
  }

  async getPatientHistory(id, role) {
    const patient = await this.getPatientById(id, role);

    const appointments = mongoose.models.Appointment ? await mongoose.model('Appointment').find({ patientId: id }).sort({ date: -1 }).limit(10) : [];
    const prescriptions = mongoose.models.Prescription ? await mongoose.model('Prescription').find({ patientId: id }).sort({ createdAt: -1 }).limit(10) : [];
    const labRequests = mongoose.models.LabRequest ? await mongoose.model('LabRequest').find({ patientId: id }).sort({ createdAt: -1 }).limit(10) : [];
    const invoices = mongoose.models.Invoice ? await mongoose.model('Invoice').find({ patientId: id }).sort({ createdAt: -1 }).limit(10) : [];

    return {
      patient,
      appointments,
      prescriptions,
      labRequests,
      invoices
    };
  }

  async updateMedicalHistory(id, data, userId) {
    const patient = await Patient.findById(id);
    if (!patient) {
      const err = new Error('Patient not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Merge incoming data into the existing medical history subdocument
    const currentHistory = patient.medicalHistory ? patient.medicalHistory.toObject() : {};
    patient.medicalHistory = { ...currentHistory, ...data };
    await patient.save();

    await AuditLog.create({
      userId,
      action: 'UPDATE_MEDICAL_HISTORY',
      resourceType: 'Patient',
      resourceId: id,
      oldValues: currentHistory,
      newValues: data
    });

    return patient.medicalHistory.toObject();
  }

  async getMedicalHistory(id, role) {
    if (role === 'receptionist' || role === 'lab_technician') {
      const err = new Error('Insufficient permission to view medical history');
      err.status = 403;
      err.code = 'INSUFFICIENT_PERMISSION';
      throw err;
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      const err = new Error('Patient not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return patient.medicalHistory ? patient.medicalHistory.toObject() : {};
  }
}

module.exports = new PatientService();
