const auditService = require('./audit.service');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * Handle listing of audit logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { data, meta } = await auditService.listLogs(req.query);
    return sendSuccess(res, 200, data, meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
