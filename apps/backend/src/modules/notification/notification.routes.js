const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

router.use(requireAuth); // All notification routes require authentication

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead); // Place before /:id to avoid route conflict
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
