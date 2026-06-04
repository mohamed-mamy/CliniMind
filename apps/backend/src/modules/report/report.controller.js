const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const getDefaultDates = () => {
  const now = new Date();
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { fromDefault: firstDay.toISOString(), toDefault: lastDay.toISOString() };
};

const getFinancialReport = async (req, res, next) => {
  try {
    let { from, to, format } = req.query;
    if (!from || !to) {
      const { fromDefault, toDefault } = getDefaultDates();
      if (!from) from = fromDefault;
      if (!to) to = toDefault;
    }
    
    const reportData = await reportService.getFinancialReport({ from, to });

    if (format === 'excel' || format === 'pdf') {
      return sendError(res, 501, 'NOT_IMPLEMENTED', `File export in ${format} format is not available in the MVP phase.`);
    }

    return sendSuccess(res, 200, reportData);
  } catch (err) {
    next(err);
  }
};

const getMedicalReport = async (req, res, next) => {
  try {
    let { from, to, format } = req.query;
    if (!from || !to) {
      const { fromDefault, toDefault } = getDefaultDates();
      if (!from) from = fromDefault;
      if (!to) to = toDefault;
    }
    
    const reportData = await reportService.getMedicalReport({ from, to });

    if (format === 'excel' || format === 'pdf') {
      return sendError(res, 501, 'NOT_IMPLEMENTED', `File export in ${format} format is not available in the MVP phase.`);
    }

    return sendSuccess(res, 200, reportData);
  } catch (err) {
    next(err);
  }
};

const exportReports = async (req, res, next) => {
  try {
    // Expected to return a ZIP file according to API-Contract
    // For MVP, if file gen is not ready, return 501 Not Implemented or error.
    return sendError(res, 501, 'NOT_IMPLEMENTED', 'Exporting zip files is not available in the MVP phase.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFinancialReport,
  getMedicalReport,
  exportReports
};
