const db = require('../config/db');

// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    // 1. Check if user is currently muted or has notifications OFF
    const userResult = await db.query('SELECT notifications_enabled, muted_until, notifications_paused_at FROM users WHERE id = $1', [req.user.id]);
    const { notifications_enabled, muted_until, notifications_paused_at } = userResult.rows[0];

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];

    // Check if we should filter "new" notifications
    const isMuted = muted_until && new Date(muted_until) > new Date();
    const isOff = !notifications_enabled;

    if (isMuted || isOff) {
      // If paused, only show notifications created BEFORE the pause started
      // Use COALESCE to fallback to NOW() if paused_at is missing for some reason
      if (notifications_paused_at) {
        query += ' AND created_at < $2';
        params.push(notifications_paused_at);
      }
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await db.query(query, params);
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
    // We always create the notification in DB now.
    // The GET API will handle hiding it if the user is muted.
    // This way, they show up once the mute hours end.
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
