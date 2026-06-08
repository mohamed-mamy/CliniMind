const mongoose = require('mongoose');
const LabRequest = require('./labRequest.model');
const Notification = require('../notification/notification.model');
const User = require('../user/user.model');
const { emitNewLabRequest, emitCriticalResult, emitNotification } = require('../../socket');

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

  // Populate patient name for real-time notification
  const populated = await LabRequest.findById(labRequest._id)
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName');

  // Emit real-time room broadcast (refreshes the lab technician's request list)
  emitNewLabRequest(populated);

  // Create a persistent DB notification for every active lab technician
  // and emit a per-user socket event so the bell badge lights up immediately
  try {
    const labTechs = await User.find({ role: 'lab_technician', isActive: true }).select('_id').lean();
    const patientName = populated.patientId?.fullName;
    const priorityTag = data.priority === 'urgent' ? ' 🚨 عاجل' : '';

    await Promise.all(
      labTechs.map(async (tech) => {
        const notif = await Notification.create({
          userId: tech._id,
          type: 'new_lab_request',
          title: `طلب فحص جديد${priorityTag}`,
          body: patientName
            ? `طلب فحص جديد للمريض: ${patientName}`
            : `تم استلام طلب فحص مختبر جديد #${populated._id}`,
          data: { labRequestId: populated._id }
        });
        emitNotification(tech._id, notif);
      })
    );
  } catch (notifErr) {
    console.error('[LabService] Lab technician notification failed (non-fatal):', notifErr.message);
  }

  return populated;
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

  // Populate patient name before emitting
  const populated = await LabRequest.findById(labRequest._id)
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName');

  const doctorId = populated.doctorId?._id || populated.doctorId;

  if (hasCritical) {
    // Emit critical result to the doctor via Socket.IO (triggers special critical alert UI)
    emitCriticalResult(doctorId, populated);

    // Create persistent notification for the doctor
    const criticalNotif = await Notification.create({
      userId: doctorId,
      type: 'critical_result',
      title: 'نتيجة حرجة / Résultat critique',
      body: populated.patientId?.fullName
        ? `نتيجة حرجة للمريض: ${populated.patientId.fullName}`
        : `Des résultats critiques ont été détectés pour la demande d'analyse #${populated._id}`,
      data: { labRequestId: populated._id, criticalResults: criticalResultsDetected }
    });
    // Also emit notification:new so the bell badge lights up
    emitNotification(doctorId, criticalNotif);
  } else {
    // Notify doctor that results are ready
    const notif = await Notification.create({
      userId: doctorId,
      type: 'results_ready',
      title: 'نتائج الفحص جاهزة / Résultats prêts',
      body: populated.patientId?.fullName
        ? `نتائج فحص المريض ${populated.patientId.fullName} جاهزة`
        : `Les résultats d'analyse pour la demande #${populated._id} sont disponibles.`,
      data: { labRequestId: populated._id }
    });
    emitNotification(doctorId, notif);
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
