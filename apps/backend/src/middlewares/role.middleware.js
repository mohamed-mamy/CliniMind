const { sendError } = require('../utils/apiResponse');

const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'No token provided');
    }
    
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'Role lacks the required permission');
    }
    
    next();
  };
};

module.exports = { requireRoles };
