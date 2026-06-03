const { sendError } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const fields = {};
      error.errors.forEach(err => {
        fields[err.path.join('.')] = err.message;
      });
      return sendError(res, 400, 'VALIDATION_ERROR', 'Body/query failed validation', fields);
    }
    next(error);
  }
};

module.exports = { validate };
