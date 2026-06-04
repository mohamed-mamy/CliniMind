const patientService = require('./patient.service');

exports.createPatient = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      data: patient,
      error: null,
      meta: null
    });
  } catch (err) {
    if (err.code === 11000) {
      err.status = 409;
      err.code = 'DUPLICATE';
      err.message = 'Phone already registered';
    }
    next(err);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const { page, limit, search, ageCategory, gender } = req.query;
    const result = await patientService.getPatients({ page, limit, search, ageCategory, gender });
    res.status(200).json({
      success: true,
      data: result.data,
      error: null,
      meta: result.meta
    });
  } catch (err) {
    next(err);
  }
};

exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(req.params.id, req.user.role);
    res.status(200).json({
      success: true,
      data: patient,
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: patient,
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    await patientService.deletePatient(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.getPatientHistory = async (req, res, next) => {
  try {
    const history = await patientService.getPatientHistory(req.params.id, req.user.role);
    res.status(200).json({
      success: true,
      data: history,
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMedicalHistory = async (req, res, next) => {
  try {
    const medicalHistory = await patientService.updateMedicalHistory(req.params.id, req.body, req.user.userId);
    res.status(200).json({
      success: true,
      data: medicalHistory,
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getMedicalHistory = async (req, res, next) => {
  try {
    const medicalHistory = await patientService.getMedicalHistory(req.params.id, req.user.role);
    res.status(200).json({
      success: true,
      data: medicalHistory,
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};
