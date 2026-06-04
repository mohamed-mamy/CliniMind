const { sendError } = require('../utils/apiResponse');

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed; // Assign sanitized/coerced values back
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const fields = {};
      const issues = error.issues || error.errors || [];
      issues.forEach(issue => {
        fields[issue.path.join('.')] = issue.message;
      });
      return sendError(res, 400, 'VALIDATION_ERROR', 'Body/query failed validation', fields);
    }
    next(error);
  }
};

module.exports = { validate };
