const mongoose = require('mongoose');
const LabRequest = require('./labRequest.model');
const Notification = require('../notification/notification.model');
const User = require('../user/user.model');
const Patient = require('../patient/patient.model');
const { sendEmail } = require('../../utils/email.util');
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

  // Fetch patient details for formatting notifications
  const patient = await Patient.findById(data.patientId).lean();
  const patientName = patient ? patient.fullName : 'Walk-in';

  // Find all active lab technicians
  const technicians = await User.find({ role: 'lab_technician', isActive: true });

  for (const tech of technicians) {
    try {
      // 1. Create a persistent notification in the DB
      const notification = await Notification.create({
        userId: tech._id,
        type: 'new_lab_request',
        title: 'طلب تحليل مخبري جديد / Demande d\'analyse',
        body: `تم إرسال طلب تحليل جديد للمريض ${patientName} من قبل الطبيب.`,
        data: { labRequestId: labRequest._id }
      });

      // 2. Emit real-time notification via Socket.IO
      emitNotification(tech._id, notification);
    } catch (dbErr) {
      console.error('[LabService Error] Failed to create DB notification for tech:', dbErr.message);
    }

    // 3. Send email notification
    if (tech.email) {
      try {
        await sendEmail({
          to: tech.email,
          subject: `طلب تحليل جديد - ${patientName}`,
          text: `تم استلام طلب تحليل جديد للمريض ${patientName}. الفحوصات المطلوبة: ${labRequest.tests.join(', ')}.`,
          html: `
            <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h3 style="color: #0284c7;">طلب تحليل مخبري جديد</h3>
              <p>أهلاً بك،</p>
              <p>تم استلام طلب تحليل مخبري جديد للمريض: <strong>${patientName}</strong>.</p>
              <p>الفحوصات المطلوبة: <strong>${labRequest.tests.join(', ')}</strong></p>
              <p>الأولوية: <strong>${labRequest.priority === 'urgent' ? 'عاجل / Urgent' : 'عادي / Normal'}</strong></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999;">CliniMind Center - نظام إدارة العيادات المتكامل</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('[LabService Error] Failed to send email to technician:', mailErr.message);
      }
    }
  }

  // Emit generic room notification for lab technicians
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
