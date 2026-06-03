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

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);

router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
