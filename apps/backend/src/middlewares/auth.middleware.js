const { verifyToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/apiResponse');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Access token expired — call /auth/refresh');
    }
    return sendError(res, 401, 'TOKEN_INVALID', 'Token signature invalid or revoked');
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'Role lacks the required permission');
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
