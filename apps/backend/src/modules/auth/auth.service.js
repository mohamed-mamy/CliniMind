const User = require('../user/user.model');
const RefreshToken = require('./refreshToken.model');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.util');

const login = async (username, password) => {
  const user = await User.findOne({ username });
  
  if (!user || user.password !== password) {
    const err = new Error('Username or password wrong');
    err.status = 401;
    err.code = 'AUTH_REQUIRED';
    throw err;
  }
  
  if (!user.isActive) {
    const err = new Error('Account is disabled');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  
  // Create tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  const accessTokenExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h
  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
  
  // Store refresh token
  await new RefreshToken({
    userId: user._id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt
  }).save();
  
  // Update last login
  user.lastLoginAt = new Date();
  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return {
    user: userObj,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt
  };
};

const refresh = async (tokenString) => {
  const tokenDoc = await RefreshToken.findOne({ token: tokenString, revoked: false });
  
  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    const err = new Error('Refresh token revoked or expired');
    err.status = 401;
    err.code = 'TOKEN_INVALID';
    throw err;
  }
  
  const user = await User.findById(tokenDoc.userId);
  if (!user || !user.isActive) {
    const err = new Error('User not found or disabled');
    err.status = 401;
    err.code = 'TOKEN_INVALID';
    throw err;
  }
  
  // Revoke old token
  tokenDoc.revoked = true;
  await tokenDoc.save();
  
  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  const accessTokenExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await new RefreshToken({
    userId: user._id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt
  }).save();
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return {
    user: userObj,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt
  };
};

const logout = async (userId) => {
  // Revoke all refresh tokens for the user
  await RefreshToken.updateMany({ userId }, { revoked: true });
};

const revokeAllTokens = async (userId) => {
  await RefreshToken.updateMany({ userId }, { revoked: true });
};

module.exports = {
  login,
  refresh,
  logout,
  revokeAllTokens
};
