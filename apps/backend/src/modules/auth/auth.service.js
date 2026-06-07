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

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('User not found with this email');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.resetCode = code;
  user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
  await user.save();

  // Send email alert
  const { sendEmail } = require('../../utils/email.util');
  await sendEmail({
    to: user.email,
    subject: 'رمز إعادة تعيين كلمة المرور / Code de réinitialisation de mot de passe',
    text: `رمز التحقق الخاص بك هو: ${code}. هذا الرمز صالح لمدة 15 دقيقة.`,
    html: `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h3 style="color: #0284c7;">إعادة تعيين كلمة المرور</h3>
        <p>أهلاً <strong>${user.fullName}</strong>،</p>
        <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك على CliniMind.</p>
        <p>رمز التحقق الخاص بك هو:</p>
        <div style="background-color: #f0f9ff; border: 1px dashed #0284c7; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #0369a1; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p>هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">CliniMind Center - في حال لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
      </div>
    `
  });

  return { success: true };
};

const resetPassword = async (email, code, newPassword) => {
  const user = await User.findOne({
    email,
    resetCode: code,
    resetCodeExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    const err = new Error('Invalid verification code or code has expired');
    err.status = 400;
    err.code = 'INVALID_RESET_CODE';
    throw err;
  }

  user.password = newPassword;
  user.resetCode = undefined;
  user.resetCodeExpiresAt = undefined;
  await user.save();

  // Invalidate any active refresh tokens for security
  await revokeAllTokens(user._id);

  return { success: true };
};

module.exports = {
  login,
  refresh,
  logout,
  revokeAllTokens,
  forgotPassword,
  resetPassword
};
