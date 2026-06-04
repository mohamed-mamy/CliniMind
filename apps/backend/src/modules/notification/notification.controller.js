const mongoose = require('mongoose');
const Notification = require('./notification.model');

// GET /notifications
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user.userId }),
      Notification.countDocuments({ userId: req.user.userId, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      error: null,
      meta: {
        page,
        limit,
        total,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    // Validate ObjectId format before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid notification ID format' },
        meta: null
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
        meta: null
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      error: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      data: { updatedCount: result.modifiedCount },
      error: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
