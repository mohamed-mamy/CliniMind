/**
 * Standard API Response format
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {Object} data - Payload
 * @param {Object} meta - Pagination or extra metadata
 */
const sendSuccess = (res, status = 200, data = {}, meta = null) => {
  if (status === 204) {
    return res.status(204).send();
  }
  return res.status(status).json({
    success: true,
    data,
    error: null,
    meta
  });
};

/**
 * Standard API Error format
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} code - Error code (e.g., VALIDATION_ERROR)
 * @param {string} message - Human readable error message
 * @param {Object} fields - Validation fields (optional)
 */
const sendError = (res, status = 500, code = 'INTERNAL', message = 'Internal Server Error', fields = undefined) => {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(fields && { fields })
    },
    meta: null
  });
};

module.exports = {
  sendSuccess,
  sendError
};
