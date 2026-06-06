const express = require('express');
const router = express.Router();
const settingController = require('./setting.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

router.get('/public', settingController.getPublicSettings);

router.use(requireAuth);

router.get('/', settingController.getSettings);
router.put('/', requireRole('director'), settingController.updateSettings);

module.exports = router;
