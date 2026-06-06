const { sendSuccess, sendError } = require('../../utils/apiResponse');
const labService = require('./lab.service');
const mongoose = require('mongoose');

const createLabRequest = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const labRequest = await labService.createLabRequest(req.body, doctorId);
    return sendSuccess(res, 201, labRequest);
  } catch (error) {
    next(error);
  }
};

const listLabRequests = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const { data, meta } = await labService.listLabRequests(req.query, role, userId);
    return sendSuccess(res, 200, data, meta);
  } catch (error) {
    next(error);
  }
};

const getPendingLabRequests = async (req, res, next) => {
  try {
    // Simplified view for pending
    // Spread query first, then override status so callers cannot bypass the pending filter
    const query = { ...req.query, status: 'pending' };
    const { data, meta } = await labService.listLabRequests(query, req.user.role, req.user.userId);
    return sendSuccess(res, 200, data, meta);
  } catch (error) {
    next(error);
  }
};

const getLabRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid Lab Request ID');
    }
    const labRequest = await labService.getLabRequestById(id);
    return sendSuccess(res, 200, labRequest);
  } catch (error) {
    if (error.status === 404) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    next(error);
  }
};

const enterLabResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const technicianId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid Lab Request ID');
    }
    const result = await labService.enterResults(id, req.body, technicianId);
    return sendSuccess(res, 200, result);
  } catch (error) {
    if (error.status === 404) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    next(error);
  }
};

const updateLabRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid Lab Request ID');
    }
    const labRequest = await labService.updateLabRequestStatus(id, status, req.user.userId);
    return sendSuccess(res, 200, labRequest);
  } catch (error) {
    if (error.status === 404) return sendError(res, 404, 'NOT_FOUND', error.message);
    if (error.status === 409) return sendError(res, 409, 'INVALID_TRANSITION', error.message);
    next(error);
  }
};

const getCriticalResults = async (req, res, next) => {
  try {
    const { from } = req.query;
    const results = await labService.getCriticalResults(from, req.user.role, req.user.userId);
    return sendSuccess(res, 200, results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLabRequest,
  listLabRequests,
  getPendingLabRequests,
  getLabRequestById,
  updateLabRequestStatus,
  enterLabResults,
  getCriticalResults,
};
