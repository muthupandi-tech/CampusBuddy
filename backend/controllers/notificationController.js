const db = require('../config/db');

// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications.rows);
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Utility function to create notification
const createNotification = async (user_id, message, type) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [user_id, message, type]
    );
  } catch (err) {
    console.error('Create notification error:', err.message);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
