const mongoose = require('mongoose');
const LabRequest = require('./labRequest.model');
const Notification = require('../notification/notification.model');
const { emitNewLabRequest, emitCriticalResult } = require('../../socket');

// Load Settings model with correct path
let Settings;
try {
  Settings = require('../setting/setting.model');
} catch (e) {
  console.warn('[LabService] Settings model not available:', e.message);
}

const createLabRequest = async (data, doctorId) => {
  const labRequest = new LabRequest({
    patientId: data.patientId,
    doctorId,
    tests: data.tests,
    priority: data.priority,
    status: 'pending'
  });
  
  await labRequest.save();

  // Note: Invoice items creation should be hooked here if billing is enabled
  // billingService.addInvoiceItem(...)

  // Emit real-time notification for lab:new_request
  emitNewLabRequest(labRequest);

  return labRequest;
};

const listLabRequests = async (query, userRole, userId) => {
  const { page = 1, limit = 20, patientId, status, priority } = query;
  const filter = {};

  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // Role-based filtering
  if (userRole === 'doctor') {
    filter.doctorId = userId;
  } else if (userRole === 'lab_technician') {
    // Lab technicians see all pending/in_progress
    if (!status) filter.status = { $in: ['pending', 'in_progress'] };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    LabRequest.find(filter).sort({ requestedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    LabRequest.countDocuments(filter)
  ]);

  return { data, meta: { page: parseInt(page), limit: parseInt(limit), total } };
};

const getLabRequestById = async (id) => {
  const labRequest = await LabRequest.findById(id).lean();
  if (!labRequest) {
    const error = new Error('Lab request not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return labRequest;
};

const updateLabRequestStatus = async (id, status, userId) => {
  const labRequest = await LabRequest.findById(id);
  if (!labRequest) {
    const error = new Error('Lab request not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const validTransitions = {
    pending: ['in_progress'],
    in_progress: ['completed'],
    completed: [],
  };

  if (!validTransitions[labRequest.status].includes(status)) {
    const error = new Error(`Cannot transition from ${labRequest.status} to ${status}`);
    error.status = 409;
    error.code = 'INVALID_TRANSITION';
    throw error;
  }

  labRequest.status = status;
  if (status === 'in_progress') {
    labRequest.assignedTo = userId;
  }

  await labRequest.save();
  return labRequest;
};

const enterResults = async (id, data, technicianId) => {
  const labRequest = await LabRequest.findById(id);
  if (!labRequest) {
    const error = new Error('Lab request not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Guard: reject edits on already-finalized requests
  if (labRequest.status === 'completed') {
    const error = new Error('Lab request is already finalized. Use an amendment flow to modify results.');
    error.status = 409;
    error.code = 'ALREADY_FINALIZED';
    throw error;
  }

  // Fetch thresholds if settings exist
  let thresholds = {};
  if (Settings) {
    const settings = await Settings.findOne();
    if (settings && settings.criticalThresholds) {
      thresholds = settings.criticalThresholds;
    }
  } else {
    // Fallback/Mock thresholds for MVP testing
    thresholds = {
      'Glycémie à jeun': { min: 0.70, max: 1.10 }
    };
  }

  const criticalResultsDetected = [];
  let hasCritical = false;

  const evaluatedResults = data.results.map(result => {
    let isCrit = false;
    if (result.resultNumeric !== undefined) {
      const threshold = thresholds[result.testName];
      if (threshold && (result.resultNumeric < threshold.min || result.resultNumeric > threshold.max)) {
        isCrit = true;
        hasCritical = true;
        criticalResultsDetected.push(result.testName);
      }
    }
    return result;
  });

  labRequest.results = evaluatedResults;
  labRequest.status = 'completed';
  labRequest.isCritical = hasCritical;
  labRequest.completedAt = new Date();
  labRequest.completedBy = technicianId;

  await labRequest.save();

  if (hasCritical) {
    // Emit critical result to the doctor via Socket.IO
    emitCriticalResult(labRequest.doctorId, labRequest);

    // Create persistent notification for the doctor
    await Notification.create({
      userId: labRequest.doctorId,
      type: 'critical_result',
      title: 'Résultats critiques détectés',
      body: `Des résultats critiques ont été détectés pour la demande d'analyse #${labRequest._id}`,
      data: { labRequestId: labRequest._id, criticalResults: criticalResultsDetected }
    });
  }

  return {
    labRequest: labRequest.toObject(),
    criticalResults: criticalResultsDetected
  };
};

const getCriticalResults = async (from, callerRole, callerUserId) => {
  const filter = { isCritical: true };

  // Scope to doctor's own patients when caller is a doctor
  if (callerRole === 'doctor' && callerUserId) {
    filter.doctorId = callerUserId;
  }

  if (from) {
    filter.updatedAt = { $gte: new Date(from) };
  } else {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filter.updatedAt = { $gte: sevenDaysAgo };
  }

  const results = await LabRequest.find(filter).sort({ updatedAt: -1 }).lean();
  return results;
};

module.exports = {
  createLabRequest,
  listLabRequests,
  getLabRequestById,
  updateLabRequestStatus,
  enterResults,
  getCriticalResults,
};
