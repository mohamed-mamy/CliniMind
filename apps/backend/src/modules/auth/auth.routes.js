const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const authController = require('./auth.controller');

const router = express.Router();

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

const forgotSchema = z.object({
  username: z.string()
});

const otpSchema = z.object({
  username: z.string(),
  otp: z.string().length(6)
});

const resetSchema = z.object({
  username: z.string(),
  otp: z.string().length(6),
  newPassword: z.string().min(4)
});

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);

router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);

router.post('/forgot-password', validate(forgotSchema), authController.forgotPassword);
router.post('/verify-otp', validate(otpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetSchema), authController.resetPassword);

module.exports = router;
