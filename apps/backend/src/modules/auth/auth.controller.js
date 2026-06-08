const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    return sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.userId);
    return sendSuccess(res, 204);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const User = require('../user/user.model');
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return sendSuccess(res, 200, user);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.username);
    return sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body.username, req.body.otp);
    return sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body.username, req.body.otp, req.body.newPassword);
    return sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword
};
