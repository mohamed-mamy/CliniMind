const AuditLog = require('./audit.model');

/**
 * Get paginated list of audit logs with optional filters
 * @param {Object} query query parameters
 * @returns {Promise<Object>} Object containing data array and pagination metadata
 */
const listLogs = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.userId) {
    filter.userId = query.userId;
  }

  if (query.action) {
    // If multiple actions are passed separated by commas, match any of them
    if (query.action.includes(',')) {
      filter.action = { $in: query.action.split(',').map(a => a.trim()) };
    } else {
      filter.action = query.action;
    }
  }

  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) {
      filter.timestamp.$gte = new Date(query.from);
    }
    if (query.to) {
      filter.timestamp.$lte = new Date(query.to);
    }
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username fullName role')
      .lean(),
    AuditLog.countDocuments(filter)
  ]);

  // Map to DTO format as defined in Appendix A.11 of API Contract
  const data = logs.map(log => {
    return {
      _id: log._id,
      userId: log.userId ? log.userId._id : null,
      userName: log.userId ? log.userId.fullName || log.userId.username : 'System',
      action: log.action,
      details: log.details || '',
      oldValues: log.oldValues || undefined,
      newValues: log.newValues || undefined,
      ipAddress: log.ipAddress || '',
      timestamp: log.timestamp ? log.timestamp.toISOString() : null
    };
  });

  return {
    data,
    meta: {
      page,
      limit,
      total
    }
  };
};

module.exports = {
  listLogs
};
