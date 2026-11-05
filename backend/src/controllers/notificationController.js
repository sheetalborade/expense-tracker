const notificationService = require('../services/notificationService');
const { success } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    // Refresh budget alerts when user opens notifications
    await notificationService.checkBudgetAlerts(req.user.id);
    const notifications = await notificationService.getAll(req.user.id);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    return success(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return success(res, { count });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.user.id,
      parseInt(req.params.id, 10)
    );
    return success(res, notification, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getUnreadCount, markAsRead, markAllAsRead };
