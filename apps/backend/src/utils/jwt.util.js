const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

/**
 * Generate Access Token (expires in 8 hours)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
};

/**
 * Generate Refresh Token (expires in 7 days)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify Token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};
