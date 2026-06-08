const User = require('../user/user.model');
const RefreshToken = require('./refreshToken.model');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.util');

class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

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

const Otp = require('./otp.model');
const Setting = require('../setting/setting.model');
const { sendEmail } = require('../../utils/email');

const forgotPassword = async (usernameOrEmail) => {
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user) {
    return { message: 'If this account exists, an OTP has been sent.' };
  }

  const settings = await Setting.findOne().lean();
  const clinicName = settings?.clinicName || 'Clinic';
  const smtp = settings?.smtpConfig;
  const hasDbSmtp = smtp?.host && smtp?.smtpUser && smtp?.smtpPass;
  const hasEnvSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasDbSmtp && !hasEnvSmtp) {
    throw new AppError('SMTP is not configured. Ask the director to set up email settings first.', 'SMTP_NOT_CONFIGURED', 500);
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.deleteMany({ userId: user._id, used: false });
  await new Otp({ userId: user._id, otp, expiresAt }).save();

  await sendEmail({
    to: user.email,
    subject: `${clinicName} – Password Reset Code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px;">
        <h2 style="color:#1e293b;">${clinicName}</h2>
        <p style="color:#475569;font-size:14px;">Use the following code to reset your password. It expires in 10 minutes.</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f172a;margin:16px 0;">${otp}</div>
        <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    `
  });

  return { message: 'OTP sent to your email.' };
};

const verifyOtp = async (usernameOrEmail, otp) => {
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user) {
    throw new AppError('Invalid or expired OTP', 'OTP_INVALID', 400);
  }

  const otpDoc = await Otp.findOne({ userId: user._id, otp, used: false });
  if (!otpDoc || otpDoc.expiresAt < new Date()) {
    throw new AppError('Invalid or expired OTP', 'OTP_INVALID', 400);
  }

  return { message: 'OTP verified.' };
};

const resetPassword = async (usernameOrEmail, otp, newPassword) => {
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user) {
    throw new AppError('Invalid or expired OTP', 'OTP_INVALID', 400);
  }

  const otpDoc = await Otp.findOne({ userId: user._id, otp, used: false });
  if (!otpDoc || otpDoc.expiresAt < new Date()) {
    throw new AppError('Invalid or expired OTP', 'OTP_INVALID', 400);
  }

  otpDoc.used = true;
  await otpDoc.save();

  user.password = newPassword;
  await user.save();

  return { message: 'Password reset successfully.' };
};

module.exports = {
  login,
  refresh,
  logout,
  revokeAllTokens,
  forgotPassword,
  verifyOtp,
  resetPassword
};
